import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../auth'
import { requestCoachTips } from '../ai-coach/api'
import type { CoachTip, LocalFootprint } from '../../lib/supabase'
import {
  createFootprint,
  deleteFootprint,
  listFootprints,
  updateFootprintMigrated,
} from './api'
import {
  TASK_TEMPLATES,
  consumeRequestedTemplate,
  getTemplate,
  onTemplateRequest,
  type Scene,
  type TaskTemplate,
} from './templates'
import './footprints.css'

const SCENES: Scene[] = ['生活', '职场', '兴趣']

const DEFAULT = TASK_TEMPLATES[0]

export function FootprintsPanel() {
  const { user, configured } = useAuth()
  const draftRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [items, setItems] = useState<LocalFootprint[]>([])
  const [source, setSource] = useState<'supabase' | 'local'>('local')
  const [busy, setBusy] = useState(false)
  const [activeId, setActiveId] = useState(DEFAULT.id)
  const [scene, setScene] = useState<Scene>(DEFAULT.scene)
  const [title, setTitle] = useState(DEFAULT.title)
  const [criteria, setCriteria] = useState(DEFAULT.criteria)
  const [placeholder, setPlaceholder] = useState(DEFAULT.placeholder)
  const [exampleDraft, setExampleDraft] = useState(DEFAULT.exampleDraft)
  const [body, setBody] = useState('')
  const [showExampleInDraft, setShowExampleInDraft] = useState(false)
  const [criteriaMet, setCriteriaMet] = useState(true)
  const [selfRating, setSelfRating] = useState('还行')
  const [tips, setTips] = useState<CoachTip[] | null>(null)
  const [coachNote, setCoachNote] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [focusDraftAfter, setFocusDraftAfter] = useState(0)

  const activeTemplate = getTemplate(activeId) ?? DEFAULT

  useEffect(() => {
    if (!focusDraftAfter) return
    const el = draftRef.current
    if (!el) return
    const timer = window.setTimeout(() => {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 40)
    return () => window.clearTimeout(timer)
  }, [focusDraftAfter])

  function applyTemplate(tpl: TaskTemplate, opts?: { fillExample?: boolean; focus?: boolean }) {
    setActiveId(tpl.id)
    setScene(tpl.scene)
    setTitle(tpl.title)
    setCriteria(tpl.criteria)
    setPlaceholder(tpl.placeholder)
    setExampleDraft(tpl.exampleDraft)
    const fill = opts?.fillExample ?? showExampleInDraft
    if (fill) {
      setBody(tpl.exampleDraft)
      setShowExampleInDraft(true)
    } else if (showExampleInDraft) {
      setBody(tpl.exampleDraft)
    } else {
      setBody('')
    }
    setStatus(`已填入「${tpl.title}」——先自己写，AI 只点拨。`)
    if (opts?.focus) setFocusDraftAfter((n) => n + 1)
  }

  function selectTemplate(tpl: TaskTemplate) {
    applyTemplate(tpl)
  }

  function practiceWithTemplate(tpl: TaskTemplate, fillExample = false) {
    applyTemplate(tpl, { fillExample, focus: true })
  }

  useEffect(() => {
    const pending = consumeRequestedTemplate()
    if (pending) {
      const tpl = getTemplate(pending)
      if (tpl) applyTemplate(tpl, { focus: true })
    }
    return onTemplateRequest((id) => {
      const tpl = getTemplate(id)
      if (tpl) applyTemplate(tpl, { focus: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once for external requests
  }, [])

  async function refresh() {
    const res = await listFootprints(user?.id)
    setItems(res.items)
    setSource(res.source)
  }

  useEffect(() => {
    void refresh()
  }, [user?.id])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setStatus('请先登录后再把足迹写入云端。')
      return
    }
    const draft = body.trim()
    if (!draft) {
      setStatus('请先写独立稿，再存足迹或请求陪练。')
      return
    }
    setBusy(true)
    setStatus(null)
    setTips(null)
    setCoachNote(null)

    await createFootprint(
      {
        scene,
        title: title.trim() || '未命名任务',
        body: draft,
        criteria_met: criteriaMet,
        self_rating: selfRating,
        mode: 'text',
      },
      user.id,
    )
    await refresh()

    const coach = await requestCoachTips({
      draft,
      taskTitle: title.trim(),
      criteria: criteria.trim() || undefined,
      scene,
    })
    if (coach.ok) {
      setTips(coach.data.tips)
      setCoachNote(
        coach.data.source === 'model'
          ? '陪练来自服务端模型（未代写整段）'
          : '陪练为服务端 mock / 降级模板（结构与真模型一致）',
      )
    } else {
      setCoachNote(`陪练暂不可用：${coach.error}`)
    }

    setBody('')
    setShowExampleInDraft(false)
    setStatus('足迹已保存')
    setBusy(false)
  }

  async function onToggleMigrate(fp: LocalFootprint) {
    if (!user) return
    await updateFootprintMigrated(fp.id, !fp.migrateChecked, user.id)
    await refresh()
  }

  async function onDelete(fp: LocalFootprint) {
    if (!user) return
    await deleteFootprint(fp.id, user.id)
    await refresh()
  }

  function toggleExampleFill(on: boolean) {
    setShowExampleInDraft(on)
    if (on) setBody(exampleDraft)
    else setBody('')
  }

  return (
    <section className="fp-panel" id="app-footprints">
      <div className="fp-head">
        <div>
          <p className="kicker">足迹 · 持久化</p>
          <h2>留下独立输出</h2>
          <p className="fp-lead">
            先写自己的稿，再存证；AI 只点拨，不整段改写。真实任务卡 = 场景 · 受众 · 动作 ·
            完成标准 · 证据。
            {configured ? (
              <>
                {' '}
                当前数据源：<strong>{source === 'supabase' ? 'Supabase' : '本地缓存'}</strong>
              </>
            ) : (
              ' （未配置 env 时仅本地）'
            )}
          </p>
        </div>
      </div>

      {!user ? (
        <p className="fp-banner" role="status">
          登录后足迹会写入 Postgres（RLS 仅本人可见）。匿名可浏览首页与订阅。
        </p>
      ) : null}

      <div className="fp-studio">
        <aside className="fp-studio-list" aria-label="推荐模板">
          <div className="fp-recommend-head">
            <p className="fp-section-label">推荐模板</p>
            <p className="fp-section-hint">点选右侧即时预览；独立稿仍须你自己写。</p>
          </div>
          <ul className="fp-template-list">
            {TASK_TEMPLATES.map((tpl) => (
              <li key={tpl.id}>
                <button
                  type="button"
                  className={activeId === tpl.id ? 'on' : undefined}
                  aria-current={activeId === tpl.id ? 'true' : undefined}
                  onClick={() => selectTemplate(tpl)}
                >
                  <span className="fp-tpl-scene">{tpl.scene}</span>
                  <span className="fp-tpl-title">{tpl.title}</span>
                  <span className="fp-tpl-meta">
                    {tpl.timeHint} · {tpl.action}
                  </span>
                  <span className="fp-tpl-std">{tpl.criteria}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="fp-studio-detail">
          <div className="fp-detail-head">
            <p className="fp-section-label">
              正在练习 <span className="fp-badge">示例 · 可模仿</span>
            </p>
            <h3 className="fp-practicing">{activeTemplate.title}</h3>
            <p className="fp-section-hint">
              受众：{activeTemplate.audience} · 动作：{activeTemplate.action}
            </p>
          </div>

          <article className="fp-example-card" aria-live="polite">
            <p className="fp-example-std">
              <strong>完成标准：</strong>
              {activeTemplate.criteria}
            </p>
            <pre className="fp-example-draft">{activeTemplate.exampleDraft}</pre>
            <div className="fp-example-actions">
              <BridgeButton
                type="button"
                variant="primary"
                onClick={() => practiceWithTemplate(activeTemplate)}
              >
                用这个模板练习
              </BridgeButton>
              <BridgeButton
                type="button"
                variant="ghost"
                arrow="none"
                onClick={() => practiceWithTemplate(activeTemplate, true)}
              >
                填入示例稿（可改）
              </BridgeButton>
            </div>
          </article>

          <form className="fp-form" ref={formRef} onSubmit={(e) => void onSave(e)}>
            <p className="fp-form-kicker">独立输出 · {activeTemplate.title.replace(/ · .*$/, '')}</p>
            <label>
              独立稿（必填）
              <textarea
                ref={draftRef}
                id="fp-draft"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={placeholder}
                required
              />
            </label>
            <label className="fp-check fp-example-toggle">
              <input
                type="checkbox"
                checked={showExampleInDraft}
                onChange={(e) => toggleExampleFill(e.target.checked)}
              />
              显示示例稿作起点（请改成自己的话再提交）
            </label>
            <div className="fp-form-meta">
              <label>
                场景
                <select value={scene} onChange={(e) => setScene(e.target.value as Scene)}>
                  {SCENES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                任务标题
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                完成标准
                <input
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder="可观察的结果，例如：对方能听懂你要什么"
                />
              </label>
            </div>
            <div className="fp-row">
              <label className="fp-check">
                <input
                  type="checkbox"
                  checked={criteriaMet}
                  onChange={(e) => setCriteriaMet(e.target.checked)}
                />
                对照完成标准
              </label>
              <label>
                自评
                <select value={selfRating} onChange={(e) => setSelfRating(e.target.value)}>
                  <option>吃力</option>
                  <option>还行</option>
                  <option>流畅</option>
                </select>
              </label>
            </div>
            {status ? <p className="fp-status">{status}</p> : null}
            <BridgeButton type="submit" variant="primary" disabled={busy || !user}>
              {busy ? '保存中…' : '存足迹并请求陪练'}
            </BridgeButton>
          </form>
        </div>
      </div>

      {tips ? (
        <div className="fp-tips">
          <h3>AI 陪练反馈</h3>
          {coachNote ? <p className="fp-note">{coachNote}</p> : null}
          <ol>
            {tips.map((t) => (
              <li key={t.tag + t.text}>
                <span className="tag">{t.tag}</span>
                <p>{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="fp-list">
        <h3>最近足迹</h3>
        {!items.length ? (
          <p className="fp-empty">还没有足迹。完成上面的独立稿即可留下第一条。</p>
        ) : (
          <ul>
            {items.map((fp) => (
              <li key={fp.id}>
                <div className="fp-meta">
                  {fp.scene} · {new Date(fp.date).toLocaleString()}
                  {fp.selfRate ? ` · 自评 ${fp.selfRate}` : ''}
                </div>
                <h4>{fp.title}</h4>
                <p className="fp-body">{fp.raw}</p>
                <div className="fp-actions">
                  <button type="button" onClick={() => void onToggleMigrate(fp)}>
                    {fp.migrateChecked ? '已迁移 ✓' : '标记迁移'}
                  </button>
                  <button type="button" className="danger" onClick={() => void onDelete(fp)}>
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
