/** 日常向任务模板：结构对齐「场景 · 受众 · 动作 · 完成标准 · 证据」 */

export type Scene = '生活' | '职场' | '兴趣'

export type TaskTemplate = {
  id: string
  scene: Scene
  title: string
  /** 谁听 / 谁读 */
  audience: string
  /** 听懂 / 表达 / 写作… */
  action: string
  criteria: string
  timeHint: string
  /** 空稿时的占位提示 */
  placeholder: string
  /** 短独立稿示范：可模仿，不是范文代写 */
  exampleDraft: string
  /** 出现在「示例」区 */
  showAsExample?: boolean
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'travel-order',
    scene: '生活',
    title: '旅行点餐',
    audience: '餐厅服务员',
    action: '表达',
    criteria: '店员能听懂你要什么：菜名、数量、忌口都说全。',
    timeHint: '大约 15–20 分钟',
    placeholder: '从点餐开始，用自己的话写……比如点什么、要不要冰、有没有过敏。',
    exampleDraft:
      "Could I get the grilled salmon, please?\nAnd water, no ice — thank you.\nI'm allergic to peanuts.",
    showAsExample: true,
  },
  {
    id: 'travel-ask-way',
    scene: '生活',
    title: '问路与复述路线',
    audience: '路人 / 前台',
    action: '听懂 + 表达',
    criteria: '能听懂并复述两步路线；对方听完点头，就算过了。',
    timeHint: '大约 15 分钟',
    placeholder: '先写你怎么问路，再写你听完后怎么把两步路线说回去……',
    exampleDraft:
      'Excuse me, how do I get to the subway?\nSo — go straight two blocks, then turn left at the bakery. Got it, thanks!',
    showAsExample: true,
  },
  {
    id: 'show-retell',
    scene: '兴趣',
    title: '剧情一句复述',
    audience: '自己 / 想聊剧的朋友',
    action: '听懂 + 表达',
    criteria: '用 3 句英语讲清刚看的片段：发生了什么、谁、结果如何。不要照抄字幕。',
    timeHint: '大约 20 分钟',
    placeholder: '关掉字幕后，用自己的话写 3 句……不要抄字幕。',
    exampleDraft:
      'She found the letter under the door.\nShe looked scared, but she still opened it.\nThen she called her sister right away.',
    showAsExample: true,
  },
  {
    id: 'chat-opener',
    scene: '生活',
    title: '兴趣闲聊开场',
    audience: '刚认识的人',
    action: '表达 + 提问',
    criteria: '能自然开场，并来回大约 4 轮（里面要有两个跟进问题）。',
    timeHint: '大约 25 分钟',
    placeholder: '写下开场、两个追问，再加上你自己会怎么接……',
    exampleDraft:
      "Hey — I saw you're into photography. What do you usually shoot?\nNice. Do you edit on the phone or a laptop?\nI mostly take street photos on weekends.",
    showAsExample: false,
  },
  {
    id: 'read-interest',
    scene: '兴趣',
    title: '兴趣文章抓主线',
    audience: '未来的自己（笔记）',
    action: '阅读',
    criteria: '能写出文章在讲什么、两个细节，并标出一处自己还不确定的地方。',
    timeHint: '大约 35 分钟',
    placeholder: '主旨一句 + 两个细节 + 一个「还不确定」……先自己写，再请 AI 点拨。',
    exampleDraft:
      'Main idea: the article says small daily walks help focus more than long rare workouts.\nDetail 1: 20 minutes is enough for most people.\nDetail 2: morning walks felt easier to keep.\nUnsure: whether this works the same on rainy days.',
    showAsExample: false,
  },
  {
    id: 'airport-checkin',
    scene: '生活',
    title: '机场值机对话',
    audience: '柜台工作人员',
    action: '表达',
    criteria: '能自己走完一轮值机对话，不卡在航班、证件或行李上。',
    timeHint: '大约 25 分钟',
    placeholder: '假装在办值机：报航班、托不托运行李、要靠窗还是过道……',
    exampleDraft:
      "Hi, I'm checking in for flight CA981 to San Francisco.\nOne bag to check, please. Window seat if possible.\nHere's my passport.",
    showAsExample: false,
  },
  {
    id: 'landlord-email',
    scene: '职场',
    title: '给房东写报修邮件',
    audience: '房东 / 物业',
    action: '写作',
    criteria: '邮件里写清哪里坏了、什么时候发现、希望对方怎么做；对方看完就能安排维修。',
    timeHint: '大约 40 分钟',
    placeholder: '第一版自己写：哪里坏了、什么时候发现、希望对方怎么做……',
    exampleDraft:
      'Hi,\n\nThe kitchen faucet has been dripping since Monday evening.\nCould someone come check it this week?\nI am usually home after 6 pm.\n\nThanks,\nAlex',
    showAsExample: false,
  },
]

export const EXAMPLE_TEMPLATES = TASK_TEMPLATES.filter((t) => t.showAsExample)

export function getTemplate(id: string): TaskTemplate | undefined {
  return TASK_TEMPLATES.find((t) => t.id === id)
}

const EVENT = 'bridge:fp-template'
const STORAGE_KEY = 'bridge-fp-template'

/** 计划页等处选用模板；路由由调用方导航到 /app/footprints?template=… */
export function requestTemplate(id: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }))
}

export function consumeRequestedTemplate(): string | null {
  try {
    const id = sessionStorage.getItem(STORAGE_KEY)
    if (id) sessionStorage.removeItem(STORAGE_KEY)
    return id
  } catch {
    return null
  }
}

export function onTemplateRequest(handler: (id: string) => void) {
  const fn = (e: Event) => {
    const id = (e as CustomEvent<string>).detail
    consumeRequestedTemplate()
    if (id) handler(id)
  }
  window.addEventListener(EVENT, fn)
  return () => window.removeEventListener(EVENT, fn)
}
