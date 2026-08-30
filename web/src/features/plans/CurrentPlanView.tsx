import { BridgeButton } from '../../components/BridgeButton'
import { formatPlanDate, planFirstTask, type LearningPlanRow } from './api'

type Props = {
  plan: LearningPlanRow
  readonly?: boolean
  history?: LearningPlanRow[]
  onAdjust?: () => void
  onStartTask?: (templateId: string | null) => void
  onOpenHistory?: (id: string) => void
  onBack?: () => void
}

export function CurrentPlanView({
  plan,
  readonly = false,
  history = [],
  onAdjust,
  onStartTask,
  onOpenHistory,
  onBack,
}: Props) {
  const task = planFirstTask(plan)
  const retest = formatPlanDate(plan.retest_at)
  const archivedAt = formatPlanDate(plan.updated_at)

  return (
    <section className="plan-desk" id="app-plan">
      {readonly ? (
        <p className="plan-desk-note">
          {onBack ? (
            <button type="button" className="plan-text-btn" onClick={onBack}>
              回到正在用的计划
            </button>
          ) : null}
          {archivedAt ? ` · 这份已经收起来了，日期是 ${archivedAt}` : ' · 这份已经收起来了'}
        </p>
      ) : (
        <p className="plan-desk-note">你正在用的计划</p>
      )}

      <h2 className="plan-desk-goal">{plan.goal_sentence ?? '（还没写下想做成的事）'}</h2>

      {plan.week_focus ? (
        <p className="plan-desk-focus">{plan.week_focus}</p>
      ) : null}

      {task.title ? (
        <div className="plan-desk-task">
          <p className="plan-desk-task-label">这一周先练这一件</p>
          <p className="plan-desk-task-title">{task.title}</p>
          {task.criteria ? <p className="plan-stamp">{task.criteria}</p> : null}
          {!readonly ? (
            <BridgeButton variant="primary" onClick={() => onStartTask?.(task.templateId)}>
              按这张卡去写练习
            </BridgeButton>
          ) : null}
        </div>
      ) : !readonly ? (
        <BridgeButton variant="primary" onClick={() => onStartTask?.(null)}>
          去练习里写
        </BridgeButton>
      ) : null}

      {retest ? <p className="plan-desk-retest">大约到 {retest}，可以再对照一次，看看有没有进步</p> : null}

      {!readonly ? (
        <div className="plan-desk-secondary">
          <button type="button" className="plan-text-btn" onClick={onAdjust}>
            目标变了？重新定一份
          </button>
        </div>
      ) : null}

      {!readonly && history.length ? (
        <div className="plan-history">
          <h3>以前用过的计划</h3>
          <ul>
            {history.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onOpenHistory?.(item.id)}>
                  <span className="plan-history-goal">
                    {item.goal_sentence ?? '（还没写下想做成的事）'}
                  </span>
                  <span className="plan-history-date">
                    {formatPlanDate(item.updated_at) ?? formatPlanDate(item.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
