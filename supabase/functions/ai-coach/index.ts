// Edge Runtime Deno. Bridge AI coach via DeepSeek (or mock).
// Hard boundaries: independent draft required; never wholesale rewrite.
// Rate limit: per user + UTC day via bump_ai_coach_daily RPC.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Default daily coach calls per user (free-tier style). Override with AI_COACH_DAILY_LIMIT. */
const DEFAULT_DAILY_LIMIT = 20;

type CoachRequest = {
  draft: string;
  taskTitle?: string;
  criteria?: string;
  scene?: string;
};

type Tip = { tag: string; text: string };

function mockTips(input: CoachRequest): Tip[] {
  const raw = input.draft.trim();
  const tips: Tip[] = [
    {
      tag: "保留原意",
      text: "你留下了自己的表述——判断权在你这边。AI 不会整段改写这篇独立稿。",
    },
    {
      tag: "一点提醒",
      text: input.criteria
        ? `对照完成标准「${input.criteria}」：检查关键信息是否说全，不必追求完美句子。`
        : "检查关键信息是否说全即可。",
    },
  ];
  if (raw.length < 40) {
    tips.push({
      tag: "下一步",
      text: "下次可以多写一句具体细节（时间、地点或诉求），痕迹会更清晰。",
    });
  } else {
    tips.push({
      tag: "下一步",
      text: "一周后回来勾一下「迁移」——如果真用回生活，那就是最好的复盘。",
    });
  }
  return tips.slice(0, 3);
}

function assertBoundaries(body: unknown): CoachRequest {
  if (!body || typeof body !== "object") {
    throw new Response(JSON.stringify({ error: "invalid_body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const b = body as Record<string, unknown>;
  const draft = typeof b.draft === "string" ? b.draft.slice(0, 8000) : "";
  if (!draft.trim()) {
    throw new Response(
      JSON.stringify({
        error: "draft_required",
        message: "Independent draft required before coaching. No final polish without a draft.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  if (b.mode === "rewrite_full" || b.ghostwrite === true || b.polish_final === true) {
    throw new Response(
      JSON.stringify({
        error: "boundary_violation",
        message: "Wholesale rewrite / final polish without learner draft is not allowed.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  return {
    draft,
    taskTitle: typeof b.taskTitle === "string" ? b.taskTitle.slice(0, 200) : undefined,
    criteria: typeof b.criteria === "string" ? b.criteria.slice(0, 400) : undefined,
    scene: typeof b.scene === "string" ? b.scene.slice(0, 80) : undefined,
  };
}

function parseTipsFromModel(content: string): Tip[] | null {
  try {
    const start = content.indexOf("[");
    const end = content.lastIndexOf("]");
    if (start < 0 || end <= start) return null;
    const parsed = JSON.parse(content.slice(start, end + 1)) as unknown;
    if (!Array.isArray(parsed)) return null;
    const tips = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        if (typeof o.tag !== "string" || typeof o.text !== "string") return null;
        return { tag: o.tag.slice(0, 40), text: o.text.slice(0, 500) };
      })
      .filter(Boolean) as Tip[];
    return tips.length ? tips.slice(0, 3) : null;
  } catch {
    return null;
  }
}

async function callDeepSeek(input: CoachRequest, apiKey: string): Promise<Tip[] | null> {
  const base = Deno.env.get("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com";
  const model = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-chat";
  const system = `你是 Bridge 英语陪练教练。规则：
1) 学习者已提交独立稿；你只点拨，禁止整段改写或给出可直接粘贴的终稿。
2) 只输出 JSON 数组，恰好 3 项，形如 [{"tag":"...","text":"..."}]。
3) tag 用中文短标签（如 保留原意 / 一点提醒 / 下一步）。
4) 语气务实、克制，像纸质笔记本旁的教练。`;

  const userMsg = [
    input.taskTitle ? `任务：${input.taskTitle}` : null,
    input.scene ? `场景：${input.scene}` : null,
    input.criteria ? `完成标准：${input.criteria}` : null,
    "独立稿：",
    input.draft,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(`${base.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    }),
  });

  if (!res.ok) {
    console.error("deepseek_http", res.status, await res.text());
    return null;
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;
  return parseTipsFromModel(content);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limit = Number(Deno.env.get("AI_COACH_DAILY_LIMIT") ?? DEFAULT_DAILY_LIMIT) ||
      DEFAULT_DAILY_LIMIT;
    const { data: quota, error: quotaError } = await supabase.rpc("bump_ai_coach_daily", {
      p_limit: limit,
    });
    if (quotaError) {
      console.error("quota_rpc", quotaError);
      // Fail open with warning only if RPC missing; prefer fail closed for abuse
      return new Response(
        JSON.stringify({
          error: "quota_unavailable",
          message: quotaError.message,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const allowed = (quota as { allowed?: boolean } | null)?.allowed !== false;
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "rate_limited",
          message: `今日陪练次数已达上限（${limit} 次 / 日）。明天再来。`,
          meta: quota,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const input = assertBoundaries(await req.json());
    const apiKey =
      Deno.env.get("DEEPSEEK_API_KEY") ??
      Deno.env.get("AI_API_KEY") ??
      "";

    let tips: Tip[];
    let source: "mock" | "model" = "mock";

    if (apiKey) {
      const modelTips = await callDeepSeek(input, apiKey);
      if (modelTips?.length) {
        tips = modelTips;
        source = "model";
      } else {
        tips = mockTips(input);
      }
    } else {
      tips = mockTips(input);
    }

    return new Response(
      JSON.stringify({
        tips,
        source,
        meta: {
          userId: user.id,
          taskTitle: input.taskTitle ?? null,
          rewritten: false,
          boundary: "coach_only_no_ghostwrite",
          quota,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
