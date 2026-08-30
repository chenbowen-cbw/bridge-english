import { useMemo, useState } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../auth'
import { requestTemplate } from '../footprints'
import { saveLearningPlan } from './api'
import { buildPlanFromAnswers, type BuiltPlan } from './buildPlan'
import {
  emptyAnswers,
  PLAN_STEPS,
  type BlockKey,
  type HoursKey,
  type MaterialKey,
  type PlanAnswers,
  type SceneKey,
  type SessionKey,
} from './questions'
import './plans.css'

type Props = {
  seedGoal?: string
  onNeedAuth?: () => void
  onStartFirstTask?: (templateId: string) => void
  onCancel?: () => void
}

export function PlanWizard({ seedGoal = '', onNeedAuth, onStartFirstTask, onCancel }: Props) {
  const { user } = useAuth()
  const [answers, setAnswers] = useState<PlanAnswers>(() => {
    const a = emptyAnswers()
    if (seedGoal.trim()) a.goal12 = seedGoal.trim().slice(0, 200)
    return a
  })
  const [qi, setQi] = useState(0)
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const [built, setBuilt] = useState<BuiltPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const step = PLAN_STEPS[qi]
  const pct = Math.round((qi / PLAN_STEPS.length) * 100)

  const canNext = useMemo(() => {
    if (step.type === 'single') {
      if (step.id === 'scene') {
        if (answers.scene === 'other') return answers.sceneOther.trim().length > 0
        return !!answers.scene
      }
      if (step.id === 'weekHours') return !!answers.weekHours
      if (step.id === 'session') return !!answers.session
      if (step.id === 'material') return !!answers.material
      return false
    }
    if (step.type === 'multi') return answers.block.length >= 1
    if (step.type === 'text') return answers.goal12.trim().length >= 4
    if (step.type === 'confirm') return answers.aiOk
    return false
  }, [step, answers])

  async function finish() {
    const result = buildPlanFromAnswers(answers)
    setBuilt(result)
    setPhase('result')

    if (!user) {
      setStatus('计划已生成。登录后才能保存到你的本子。')
      return
    }

    setBusy(true)
    const saved = await saveLearningPlan(user.id, answers, result)
    setBusy(false)
    if (!saved.ok) {
      setStatus(`计划已生成，但云端写入失败：${saved.error}`)
      return
    }
    setStatus('计划已保存。点「本周第一张任务」开始练习。')
  }

  function goNext() {
    if (!canNext) return
    if (qi >= PLAN_STEPS.length - 1) {
      void finish()
      return
    }
    setQi((n) => n + 1)
  }

  function startFirst() {
    if (!built) return
    requestTemplate(built.firstTemplateId)
    onStartFirstTask?.(built.firstTemplateId)
  }

  if (phase === 'result' && built) {
    return (
      <section className="plan-wizard" id="app-plan">
        <h2>这一本，专为你这一周</h2>
        <p className="plan-goal">{built.goalSentence}</p>
        <p className="plan-meta">{built.metaLine}</p>

        <div className="plan-focus">
          <h3>本周唯一重点</h3>
          <p className="plan-focus-one">{built.focus.one}</p>
          <p className="plan-focus-why">{built.focus.why}</p>
        </div>

        <div className="plan-first-card">
          <h3>本周第一张任务</h3>
          <p className="plan-first-title">{built.firstTaskTitle}</p>
          <p className="plan-first-std">完成标准：{built.firstTaskCriteria}</p>
          <div className="plan-first-actions">
            <BridgeButton variant="primary" onClick={startFirst}>
              开始本周第一张任务
            </BridgeButton>
            {!user ? (
              <BridgeButton variant="ghost" arrow="none" onClick={() => onNeedAuth?.()}>
                登录以云端保存
              </BridgeButton>
            ) : null}
          </div>
        </div>
        {status ? <p className="plan-status">{status}</p> : null}
        {busy ? <p className="plan-status">正在写入…</p> : null}
        <BridgeButton
          variant="ghost"
          arrow="none"
          onClick={() => {
            setPhase('quiz')
            setQi(0)
            setStatus(null)
          }}
        >
          再改一改答案
        </BridgeButton>
      </section>
    )
  }

  return (
    <section className="plan-wizard" id="app-plan">
      {onCancel ? (
        <p className="plan-desk-note">
          <button type="button" className="plan-text-btn" onClick={onCancel}>
            回到当前计划
          </button>
        </p>
      ) : null}
      <h2>先聊聊你想做成的事</h2>
      <p className="plan-hint">答几题，定下周怎么练。不是测评。</p>

      <div
        className="plan-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="plan-count">
        {qi + 1} / {PLAN_STEPS.length}
      </p>

      <div className="plan-qbox">
        <div className="plan-bubble">
          <p className="plan-q">{step.q}</p>
          {'sub' in step && step.sub ? <p className="plan-sub">{step.sub}</p> : null}
        </div>

        {step.type === 'text' ? (
          <textarea
            className="plan-free"
            rows={3}
            placeholder={step.placeholder}
            value={answers.goal12}
            onChange={(e) => setAnswers((a) => ({ ...a, goal12: e.target.value }))}
          />
        ) : null}

        {step.type === 'confirm' ? (
          <>
            <div className="plan-ai-bound">
              <p>{step.body}</p>
              <p>你先动手，AI 再上场——这是 Bridge 的默认规矩。</p>
            </div>
            <button
              type="button"
              className={`plan-opt${answers.aiOk ? ' on' : ''}`}
              onClick={() => setAnswers((a) => ({ ...a, aiOk: true }))}
            >
              {step.confirmLabel}
            </button>
          </>
        ) : null}

        {step.type === 'multi'
          ? step.options.map((o) => {
              const on = answers.block.includes(o.v as BlockKey)
              return (
                <button
                  key={o.v}
                  type="button"
                  className={`plan-opt${on ? ' on' : ''}`}
                  onClick={() =>
                    setAnswers((a) => {
                      const v = o.v as BlockKey
                      const i = a.block.indexOf(v)
                      if (i >= 0) return { ...a, block: a.block.filter((x) => x !== v) }
                      if (a.block.length >= (step.max || 2)) return a
                      return { ...a, block: [...a.block, v] }
                    })
                  }
                >
                  {o.l}
                </button>
              )
            })
          : null}

        {step.type === 'single'
          ? step.options.map((o) => {
              const selected =
                step.id === 'scene'
                  ? answers.scene === o.v
                  : step.id === 'weekHours'
                    ? answers.weekHours === o.v
                    : step.id === 'session'
                      ? answers.session === o.v
                      : answers.material === o.v
              return (
                <div key={o.v} className="plan-opt-wrap">
                  <button
                    type="button"
                    className={`plan-opt${selected ? ' on' : ''}`}
                    onClick={() =>
                      setAnswers((a) => {
                        if (step.id === 'scene')
                          return {
                            ...a,
                            scene: o.v as SceneKey,
                            sceneOther: o.v === 'other' ? a.sceneOther : '',
                          }
                        if (step.id === 'weekHours')
                          return { ...a, weekHours: o.v as HoursKey }
                        if (step.id === 'session') return { ...a, session: o.v as SessionKey }
                        return { ...a, material: o.v as MaterialKey }
                      })
                    }
                  >
                    {o.l}
                  </button>
                  {step.id === 'scene' && o.v === 'other' && answers.scene === 'other' ? (
                    <input
                      className="plan-other"
                      placeholder="用一句话写写你想做的…"
                      value={answers.sceneOther}
                      onChange={(e) =>
                        setAnswers((a) => ({ ...a, sceneOther: e.target.value }))
                      }
                    />
                  ) : null}
                </div>
              )
            })
          : null}
      </div>

      <div className="plan-quiz-foot">
        <BridgeButton
          variant="ghost"
          arrow="none"
          disabled={qi === 0}
          onClick={() => setQi((n) => Math.max(0, n - 1))}
        >
          上一题
        </BridgeButton>
        <BridgeButton variant="primary" disabled={!canNext || busy} onClick={goNext}>
          {qi === PLAN_STEPS.length - 1 ? '生成我的计划' : '下一题'}
        </BridgeButton>
      </div>
      {status ? <p className="plan-status">{status}</p> : null}
    </section>
  )
}
