import type { BlockKey, PlanAnswers, SceneKey, SessionKey } from './questions'
import { SCENE_LABEL, SCENE_TO_TEMPLATE } from './questions'

export type PlanFocus = { one: string; why: string }

export type BuiltPlan = {
  scene: SceneKey
  sceneLabel: string
  goalSentence: string
  weekFocus: string
  focus: PlanFocus
  qualityGate: string
  firstTemplateId: string
  firstTaskTitle: string
  firstTaskCriteria: string
  metaLine: string
}

function pickFocus(blocks: BlockKey[]): PlanFocus {
  const order: BlockKey[] = ['speak', 'listen', 'write', 'read']
  const hit = order.find((k) => blocks.includes(k)) || 'speak'
  const map: Record<BlockKey, PlanFocus> = {
    speak: { one: '这一周先把一句话说完整', why: '先能自己把一句话说完，再去追求流利、堆单词。' },
    listen: { one: '这一周先听懂在说什么', why: '不必抓住每个词，先听清场景主线和几个关键词。' },
    write: { one: '这一周先把该写的写全', why: '先把对方需要知道的信息写齐，再打磨语气和语法。' },
    read: { one: '这一周先抓住主旨和两个细节', why: '读完要能讲给别人听，而不是「感觉看懂了」。' },
  }
  return map[hit]
}

function qualityGate(session: SessionKey, blocks: BlockKey[]): string {
  if (blocks.includes('speak'))
    return session === 'short' ? '能独立说完 4 句不求助' : '能独立完成一轮对话不卡壳'
  if (blocks.includes('listen')) return '能用一句话概括刚听的内容'
  if (blocks.includes('write')) return '写出的稿包含场景所需的关键信息'
  return '能复述主旨与两个细节'
}

const FIRST_TASK: Record<SceneKey, { title: string; std: string }> = {
  travel: { title: '点餐与过敏说明', std: '能清楚说出菜名、忌口与数量。' },
  show: { title: '剧情一句复述', std: '用 3 句英语讲清刚看的片段。' },
  chat: { title: '兴趣闲聊开场', std: '能自然开场并维持 4 轮对话。' },
  read: { title: '兴趣文章抓主线', std: '能写出文章主旨与两个细节。' },
  other: { title: '机场值机对话', std: '能独立完成一轮值机对话不卡壳。' },
}

export function buildPlanFromAnswers(answers: PlanAnswers): BuiltPlan {
  const scene = answers.scene || 'travel'
  const sceneLabel =
    scene === 'other' ? answers.sceneOther.trim() || '你的场景' : SCENE_LABEL[scene]
  const goal = answers.goal12.trim() || '把一件英语小事真正做成'
  const blocks = answers.block.length ? answers.block.slice() : (['speak'] as BlockKey[])
  const session = answers.session || 'long'
  const focus = pickFocus(blocks)
  const gate = qualityGate(session, blocks)
  const first = FIRST_TASK[scene]

  return {
    scene,
    sceneLabel,
    goalSentence: `在「${sceneLabel}」里，12 周内做成：${goal}——验收标准：${gate}。`,
    weekFocus: focus.one,
    focus,
    qualityGate: gate,
    firstTemplateId: SCENE_TO_TEMPLATE[scene],
    firstTaskTitle: first.title,
    firstTaskCriteria: first.std,
    metaLine: `${blocks.map((b) => ({ listen: '听', speak: '说', read: '读', write: '写' })[b]).join('·')} · 先自己写；AI 只点拨，不代写整段`,
  }
}
