import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [picks, setPicks] = useState<LocalFootprint[]>([])
  const [dims, setDims] = useState<ReviewDims>(emptyDims)
  const [focusNext, setFocusNext] = useState('下周先盯一件事，别同时开太多线。')
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
      setStatus('要记下这次复盘，需要先登录。')
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
    setStatus('这次复盘已经记下了。下周还可以回来对照。')
    setStatusTone('ok')
  }

  return (
    <section className="rv-panel" id="app-review">
      <h2>复盘</h2>
      <p className="rv-lead">
        {weekRangeLabel()}。对照这周写下的练习，看看带走了什么。不打分，也不跟别人比。
      </p>

      {!user ? (
        <p className="rv-banner" role="status">
          要记下这次复盘，需要先登录。没登录也可以先看看、先写，只是存不下来。
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
        <h3>这周写下的练习</h3>
        <p className="rv-hint">下面抽出几条，方便对照着回答。不是全部清单。</p>
        {!picks.length ? (
          <div className="rv-empty">
            <p>这周还没有练习可对照。先去写一条，周末再回来看。</p>
            <BridgeButton variant="primary" onClick={() => navigate('/app/footprints')}>
              先去写一条练习
            </BridgeButton>
          </div>
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
        <h3>四个小问题</h3>
        <p className="rv-hint">各写一句就够。空着也没关系，先存下来，之后还能改。</p>
        <div className="rv-dims">
          <label>
            做成了什么
            <span>这周我真正做完了哪一件？</span>
            <textarea
              rows={2}
              value={dims.done}
              onChange={(e) => setDims((d) => ({ ...d, done: e.target.value }))}
              placeholder="例如：机场值机那张卡，自己说完了一轮"
            />
          </label>
          <label>
            哪句还站得住
            <span>哪一句还能用？哪里可以对自己松一点？</span>
            <textarea
              rows={2}
              value={dims.quality}
              onChange={(e) => setDims((d) => ({ ...d, quality: e.target.value }))}
              placeholder="例如：礼貌请求那句还记得；别纠结语法"
            />
          </label>
          <label>
            还会再用吗
            <span>上周留下的说法，这周还说得出口吗？</span>
            <textarea
              rows={2}
              value={dims.keep}
              onChange={(e) => setDims((d) => ({ ...d, keep: e.target.value }))}
              placeholder="例如：Could you please… 点餐时又说了"
            />
          </label>
          <label className="rv-migrate">
            生活里用过了吗
            <span>这周有没有在真实场合里说出去、写出去？</span>
            <label className="rv-check">
              <input
                type="checkbox"
                checked={dims.migrateLive}
                onChange={(e) => setDims((d) => ({ ...d, migrateLive: e.target.checked }))}
              />
              有——点餐、问路、回消息……用回生活了
            </label>
            <textarea
              rows={2}
              value={dims.migrateNote}
              onChange={(e) => setDims((d) => ({ ...d, migrateNote: e.target.value }))}
              placeholder="愿意的话写一下：用在哪一次？"
            />
          </label>
        </div>
      </div>

      <div className="rv-section">
        <h3>下周先盯这一件</h3>
        <p className="rv-hint">只改一件事就好，别同时开太多线。存下来，下周复盘时对照。</p>
        <input
          className="rv-focus"
          maxLength={80}
          value={focusNext}
          onChange={(e) => setFocusNext(e.target.value)}
          aria-label="下周先盯这一件"
        />
      </div>

      {status ? (
        <p className={`rv-status${statusTone === 'warn' ? ' rv-status--warn' : ''}`}>{status}</p>
      ) : null}

      <div className="rv-actions">
        {user ? (
          <BridgeButton variant="primary" disabled={busy} onClick={() => void onSave()}>
            {busy ? '正在记下…' : '记下这次复盘'}
          </BridgeButton>
        ) : (
          <BridgeButton
            variant="primary"
            onClick={() => {
              setStatus('要记下这次复盘，需要先登录。')
              setStatusTone('warn')
              onNeedAuth?.()
            }}
          >
            先登录，才能记下这次复盘
          </BridgeButton>
        )}
      </div>
    </section>
  )
}
