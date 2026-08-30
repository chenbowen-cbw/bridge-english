/** Plan wizard questions — ported from prototype index.html (minimal ring). */

export type SceneKey = 'travel' | 'show' | 'chat' | 'read' | 'other'
export type BlockKey = 'listen' | 'speak' | 'read' | 'write'
export type HoursKey = 'lt1' | '1to2' | '2to4' | '4plus'
export type SessionKey = 'short' | 'long'
export type MaterialKey = 'dialogue' | 'subtitle' | 'podcast' | 'article' | 'any'

export type PlanAnswers = {
  scene: SceneKey | null
  sceneOther: string
  goal12: string
  block: BlockKey[]
  weekHours: HoursKey | null
  session: SessionKey | null
  material: MaterialKey | null
  aiOk: boolean
}

export const emptyAnswers = (): PlanAnswers => ({
  scene: null,
  sceneOther: '',
  goal12: '',
  block: [],
  weekHours: null,
  session: null,
  material: null,
  aiOk: false,
})

export type QuizStep =
  | {
      id: 'scene' | 'weekHours' | 'session' | 'material'
      q: string
      sub?: string
      type: 'single'
      options: { v: string; l: string }[]
    }
  | {
      id: 'goal12'
      q: string
      sub?: string
      type: 'text'
      placeholder?: string
    }
  | {
      id: 'block'
      q: string
      sub?: string
      type: 'multi'
      max: number
      options: { v: string; l: string }[]
    }
  | {
      id: 'aiBound'
      q: string
      type: 'confirm'
      body: string
      confirmLabel: string
    }

export const PLAN_STEPS: QuizStep[] = [
  {
    id: 'scene',
    q: '最近最想用英语做什么？',
    sub: '选一个最贴近的就好。',
    type: 'single',
    options: [
      { v: 'travel', l: '旅行沟通' },
      { v: 'show', l: '看剧听播客' },
      { v: 'chat', l: '和外国人聊天' },
      { v: 'read', l: '读感兴趣内容' },
      { v: 'other', l: '其他' },
    ],
  },
  {
    id: 'goal12',
    q: '三个月后，希望真正做成哪一件具体的事？',
    sub: '一句话就行，比如：能在机场自己办完值机，不用回头找人帮忙。',
    type: 'text',
    placeholder: '写一句你想做成的事…',
  },
  {
    id: 'block',
    q: '哪一块最卡你？',
    sub: '最多选 2 项。我们先对付最堵的那块，别一次全开。',
    type: 'multi',
    max: 2,
    options: [
      { v: 'listen', l: '听' },
      { v: 'speak', l: '说' },
      { v: 'read', l: '读' },
      { v: 'write', l: '写' },
    ],
  },
  {
    id: 'weekHours',
    q: '这周大概能投入多久？',
    sub: '诚实一点，少而稳比空承诺好。',
    type: 'single',
    options: [
      { v: 'lt1', l: '不到 1 小时' },
      { v: '1to2', l: '1–2 小时' },
      { v: '2to4', l: '2–4 小时' },
      { v: '4plus', l: '4 小时以上' },
    ],
  },
  {
    id: 'session',
    q: '一次最长能坐多久？',
    sub: '时间短就给短任务，能坐久一点就给完整一点的。',
    type: 'single',
    options: [
      { v: 'short', l: '5–15 分钟' },
      { v: 'long', l: '25–45 分钟' },
    ],
  },
  {
    id: 'material',
    q: '更想用什么材料？',
    sub: '没有对错，选你愿意打开的那种。',
    type: 'single',
    options: [
      { v: 'dialogue', l: '生活对话' },
      { v: 'subtitle', l: '短视频字幕' },
      { v: 'podcast', l: '播客片段' },
      { v: 'article', l: '兴趣文章' },
      { v: 'any', l: '无所谓' },
    ],
  },
  {
    id: 'aiBound',
    q: '用 AI 之前，先说好规矩',
    type: 'confirm',
    body: '先自己说或写一版。AI 只给提示和纠错，不替你改整段。最后怎么说、怎么写，还是你自己定。',
    confirmLabel: '好，我先自己写，再请它点拨',
  },
]

export const SCENE_LABEL: Record<SceneKey, string> = {
  travel: '旅行沟通',
  show: '看剧听播客',
  chat: '和外国人聊天',
  read: '读感兴趣内容',
  other: '你的场景',
}

export const HOUR_LABEL: Record<HoursKey, string> = {
  lt1: '每周不到 1 小时',
  '1to2': '每周 1–2 小时',
  '2to4': '每周 2–4 小时',
  '4plus': '每周 4 小时以上',
}

export const SESSION_LABEL: Record<SessionKey, string> = {
  short: '单次 5–15 分钟',
  long: '单次 25–45 分钟',
}

export const MAT_LABEL: Record<MaterialKey, string> = {
  dialogue: '生活对话',
  subtitle: '短视频字幕',
  podcast: '播客片段',
  article: '兴趣文章',
  any: '灵活选材',
}

/** Map plan scene → first footprint template id */
export const SCENE_TO_TEMPLATE: Record<SceneKey, string> = {
  travel: 'travel-order',
  show: 'show-retell',
  chat: 'chat-opener',
  read: 'read-interest',
  other: 'airport-checkin',
}
