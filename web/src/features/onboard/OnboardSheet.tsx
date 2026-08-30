import { useEffect, useId, useRef, useState } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../auth'
import { isOnboardDone, markOnboardDone, ONBOARD_REPLAY } from './storage'
import './onboard.css'

const STEPS = [
  {
    title: '今日只做一件',
    body: '有了计划之后，打开「今日」，你会看到一张任务卡：这一周先练哪一件、怎样算做完。先看清再动手。',
  },
  {
    title: '练习里先自己写',
    body: '点进「练习」，选一张任务，用自己的话写一版。写完再请 AI 陪练——它只点出问题、给提示，不会替你改整段。',
  },
  {
    title: '周末轻轻复盘',
    body: '到了「复盘」，对照这周写下的练习，问问自己做成了什么、哪句还能用。不打分，也不跟别人比。',
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
            {step >= STEPS.length - 1 ? '好，我明白了' : '下一步'}
          </BridgeButton>
        </div>
      </div>
    </div>
  )
}
