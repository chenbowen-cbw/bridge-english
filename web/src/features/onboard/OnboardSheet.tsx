import { useEffect, useId, useRef, useState } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../auth'
import { isOnboardDone, markOnboardDone, ONBOARD_REPLAY } from './storage'
import './onboard.css'

const STEPS = [
  {
    title: '今日看一张卡',
    body: '有计划时，今日只摊开这一张任务。先看清要做成的那一件。',
  },
  {
    title: '练习写独立稿',
    body: '打开练习，用模板自己写。写完再开 AI——它只点拨，不代写。',
  },
  {
    title: '复盘看痕迹',
    body: '周末对照留下的练习，轻轻看一眼带走了什么。不打分。',
  },
] as const

export function OnboardSheet() {
  const { user, loading } = useAuth()
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  function finish() {
    markOnboardDone(user?.id)
    setOpen(false)
    setStep(0)
  }

  useEffect(() => {
    if (loading) return
    setOpen(!isOnboardDone(user?.id))
    setStep(0)
  }, [user?.id, loading])

  useEffect(() => {
    function onReplay() {
      setStep(0)
      setOpen(true)
    }
    window.addEventListener(ONBOARD_REPLAY, onReplay)
    return () => window.removeEventListener(ONBOARD_REPLAY, onReplay)
  }, [])

  useEffect(() => {
    if (!open) return
    const root = sheetRef.current
    const first = root?.querySelector<HTMLElement>('button')
    first?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        markOnboardDone(user?.id)
        setOpen(false)
        setStep(0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, user?.id])

  function goNext() {
    if (step >= STEPS.length - 1) {
      finish()
      return
    }
    setStep((n) => n + 1)
  }

  if (!open) return null

  const current = STEPS[step]

  return (
    <div
      className="onboard-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) finish()
      }}
    >
      <div
        ref={sheetRef}
        className="onboard-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p className="onboard-count">
          {step + 1} / {STEPS.length}
        </p>
        <h2 id={titleId}>{current.title}</h2>
        <p className="onboard-body">{current.body}</p>
        <div className="onboard-actions">
          <button type="button" className="onboard-skip" onClick={finish}>
            跳过
          </button>
          <BridgeButton variant="primary" onClick={goNext}>
            {step >= STEPS.length - 1 ? '开始' : '下一步'}
          </BridgeButton>
        </div>
      </div>
    </div>
  )
}
