export const PLAN_SCENE_SEEDS = [
  { id: 'travel-order', label: '旅行点餐' },
  { id: 'show-retell', label: '看剧复述' },
  { id: 'chat-opener', label: '闲聊开场' },
  { id: 'read-interest', label: '兴趣阅读' },
] as const

export const STEPS = ['1 计划', '2 任务', '3 陪练', '4 练习', '5 复盘'] as const

export const METHOD_TRAIL = [
  { n: '01', title: '今日任务', body: '一张旅行点餐卡，约 30 分钟。' },
  { n: '02', title: '先独立试', body: '先写自己的稿，AI 不抢判断。' },
  { n: '03', title: '陪练纠错', body: '讲解 → 练习 → 追问，再独立输出。' },
  { n: '04', title: '留下痕迹', body: '输出嵌在任务结束态，周复盘轻量对比。' },
] as const

export const DEFAULT_GOAL =
  'I want clearer English for travel chats and shows I love — real conversations, not word lists. I have about 30 minutes most evenings.'
