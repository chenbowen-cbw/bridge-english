import { useEffect, useState } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../auth'
import type { LocalFootprint } from '../../lib/supabase'
import {
  loadReviewContext,
  saveWeeklyReview,
  weekKey,
  weekRangeLabel,
  type ReviewDims,
} from './api'
import './reviews.css'

type Props = {
  onNeedAuth?: () => void
}

const emptyDims = (): ReviewDims => ({
  done: '',
  quality: '',
  keep: '',
  migrateNote: '',
  migrateLive: false,
})

export function WeeklyReviewPanel({ onNeedAuth }: Props) {
  const { user } = useAuth()
  const [picks, setPicks] = useState<LocalFootprint[]>([])
  const [dims, setDims] = useState<ReviewDims>(emptyDims)
  const [focusNext, setFocusNext] = useState('本周只盯一个变量，别同时开太多线。')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'ok' | 'warn'>('ok')

  useEffect(() => {
    void (async () => {
      const ctx = await loadReviewContext(user?.id)
      setPicks(ctx.picks)
      if (ctx.existing?.answers?.dims) {
        setDims({ ...emptyDims(), ...ctx.existing.answers.dims })
      }
      if (ctx.existing?.focus_next) setFocusNext(ctx.existing.focus_next)
    })()
  }, [user?.id])

  async function onSave() {
    if (!user) {
      setStatus('请先登录再保存复盘。')
      setStatusTone('warn')
      onNeedAuth?.()
      return
    }
    setBusy(true)
    setStatus(null)
    const result = await saveWeeklyReview(user.id, {
      week_key: weekKey(),
      answers: { dims },
      focus_next: focusNext.trim(),
      footprint_ids: [],
    })
    setBusy(false)
    if (!result.ok) {
      setStatus(`保存失败：${result.error}`)
      setStatusTone('warn')
      return
    }
    setStatus('本周复盘已写入云端。')
    setStatusTone('ok')
  }

  return (
    <section className="rv-panel" id="app-review">
      <p className="kicker">每周复盘</p>
      <h2>本周轻量对照</h2>
      <p className="rv-lead">
        {weekRangeLabel()} · 不打分、不惩罚——从练习里抽出几条，问问自己。
      </p>

      {!user ? (
        <p className="rv-banner" role="status">
          登录后可把复盘写入 <code>weekly_reviews</code>。
          {onNeedAuth ? (
            <>
              {' '}
              <button type="button" className="rv-link" onClick={onNeedAuth}>
                去登录
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="rv-section">
        <h3>本周练习</h3>
        <p className="rv-hint">系统抽了最多 3 条（优先本周）。</p>
        {!picks.length ? (
          <p className="rv-empty">还没有可复盘的练习。先完成一张任务卡的独立输出。</p>
        ) : (
          <ul className="rv-picks">
            {picks.map((fp) => (
              <li key={fp.id}>
                <div className="rv-pick-meta">
                  {fp.scene} · {new Date(fp.date).toLocaleDateString()}
                </div>
                <strong>{fp.title}</strong>
                <p>{fp.raw.length > 140 ? `${fp.raw.slice(0, 140)}…` : fp.raw}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rv-section">
        <h3>四维问答</h3>
        <p className="rv-hint">各写一句就好。空白也可以，先点保存再说。</p>
        <div className="rv-dims">
          <label>
            完成
            <span>这周我真正做完了什么？</span>
            <textarea
              rows={2}
              value={dims.done}
              onChange={(e) => setDims((d) => ({ ...d, done: e.target.value }))}
              placeholder="例如：机场值机那张卡，自己说完了一轮"
            />
          </label>
          <label>
            质量
            <span>哪一句还站得住？哪里可以松一点？</span>
            <textarea
              rows={2}
              value={dims.quality}
              onChange={(e) => setDims((d) => ({ ...d, quality: e.target.value }))}
              placeholder="例如：礼貌请求那句还记得；别纠结语法"
            />
          </label>
          <label>
            保持
            <span>上周留下的表达，这周还会用吗？</span>
            <textarea
              rows={2}
              value={dims.keep}
              onChange={(e) => setDims((d) => ({ ...d, keep: e.target.value }))}
              placeholder="例如：Could you please… 点餐时又说了"
            />
          </label>
          <label className="rv-migrate">
            迁移
            <span>这周有没有在真实生活里用过？</span>
            <label className="rv-check">
              <input
                type="checkbox"
                checked={dims.migrateLive}
                onChange={(e) => setDims((d) => ({ ...d, migrateLive: e.target.checked }))}
              />
              有——点餐 / 问路 / 回消息…用回生活了
            </label>
            <textarea
              rows={2}
              value={dims.migrateNote}
              onChange={(e) => setDims((d) => ({ ...d, migrateNote: e.target.value }))}
              placeholder="可选：用在哪一次？"
            />
          </label>
        </div>
      </div>

      <div className="rv-section">
        <h3>下周唯一重点</h3>
        <p className="rv-hint">仍只动一个变量。保存后下周对照用。</p>
        <input
          className="rv-focus"
          maxLength={80}
          value={focusNext}
          onChange={(e) => setFocusNext(e.target.value)}
          aria-label="下周唯一重点"
        />
      </div>

      {status ? (
        <p className={`rv-status${statusTone === 'warn' ? ' rv-status--warn' : ''}`}>{status}</p>
      ) : null}

      <div className="rv-actions">
        {user ? (
          <BridgeButton variant="primary" disabled={busy} onClick={() => void onSave()}>
            {busy ? '保存中…' : '保存本周复盘'}
          </BridgeButton>
        ) : (
          <BridgeButton
            variant="primary"
            onClick={() => {
              setStatus('请先登录再保存复盘。')
              setStatusTone('warn')
              onNeedAuth?.()
            }}
          >
            先登录再保存复盘
          </BridgeButton>
        )}
      </div>
    </section>
  )
}
