import { useEffect, useState, type FormEvent } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../auth'
import { requestCoachTips } from '../ai-coach/api'
import type { CoachTip, LocalFootprint } from '../../lib/supabase'
import {
  createFootprint,
  deleteFootprint,
  listFootprints,
  updateFootprintMigrated,
} from './api'
import './footprints.css'

const SCENES = ['生活', '职场', '兴趣'] as const

export function FootprintsPanel() {
  const { user, configured } = useAuth()
  const [items, setItems] = useState<LocalFootprint[]>([])
  const [source, setSource] = useState<'supabase' | 'local'>('local')
  const [busy, setBusy] = useState(false)
  const [scene, setScene] = useState<(typeof SCENES)[number]>('生活')
  const [title, setTitle] = useState('旅行点餐卡 · 练习输出')
  const [body, setBody] = useState('')
  const [criteriaMet, setCriteriaMet] = useState(true)
  const [selfRating, setSelfRating] = useState('还行')
  const [tips, setTips] = useState<CoachTip[] | null>(null)
  const [coachNote, setCoachNote] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  async function refresh() {
    const res = await listFootprints(user?.id)
    setItems(res.items)
    setSource(res.source)
  }

  useEffect(() => {
    void refresh()
  }, [user?.id])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setStatus('请先登录后再把足迹写入云端。')
      return
    }
    const draft = body.trim()
    if (!draft) {
      setStatus('请先写独立稿，再存足迹或请求陪练。')
      return
    }
    setBusy(true)
    setStatus(null)
    setTips(null)
    setCoachNote(null)

    await createFootprint(
      {
        scene,
        title: title.trim() || '未命名任务',
        body: draft,
        criteria_met: criteriaMet,
        self_rating: selfRating,
        mode: 'text',
      },
      user.id,
    )
    await refresh()

    const coach = await requestCoachTips({
      draft,
      taskTitle: title.trim(),
      criteria: criteriaMet ? '关键信息说全即可' : undefined,
      scene,
    })
    if (coach.ok) {
      setTips(coach.data.tips)
      setCoachNote(
        coach.data.source === 'model'
          ? '陪练来自服务端模型（未代写整段）'
          : '陪练为服务端 mock / 降级模板（结构与真模型一致）',
      )
    } else {
      setCoachNote(`陪练暂不可用：${coach.error}`)
    }

    setBody('')
    setStatus('足迹已保存')
    setBusy(false)
  }

  async function onToggleMigrate(fp: LocalFootprint) {
    if (!user) return
    await updateFootprintMigrated(fp.id, !fp.migrateChecked, user.id)
    await refresh()
  }

  async function onDelete(fp: LocalFootprint) {
    if (!user) return
    await deleteFootprint(fp.id, user.id)
    await refresh()
  }

  return (
    <section className="fp-panel" id="app-footprints">
      <div className="fp-head">
        <div>
          <p className="kicker">足迹 · 持久化</p>
          <h2>留下独立输出</h2>
          <p className="fp-lead">
            先写自己的稿，再存证；AI 只点拨，不整段改写。
            {configured ? (
              <>
                {' '}
                当前数据源：<strong>{source === 'supabase' ? 'Supabase' : '本地缓存'}</strong>
              </>
            ) : (
              ' （未配置 env 时仅本地）'
            )}
          </p>
        </div>
      </div>

      {!user ? (
        <p className="fp-banner" role="status">
          登录后足迹会写入 Postgres（RLS 仅本人可见）。匿名可浏览首页与订阅。
        </p>
      ) : null}

      <form className="fp-form" onSubmit={(e) => void onSave(e)}>
        <label>
          场景
          <select value={scene} onChange={(e) => setScene(e.target.value as (typeof SCENES)[number])}>
            {SCENES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          任务标题
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          独立稿（必填）
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="先自己写一版……"
            required
          />
        </label>
        <div className="fp-row">
          <label className="fp-check">
            <input
              type="checkbox"
              checked={criteriaMet}
              onChange={(e) => setCriteriaMet(e.target.checked)}
            />
            对照完成标准
          </label>
          <label>
            自评
            <select value={selfRating} onChange={(e) => setSelfRating(e.target.value)}>
              <option>吃力</option>
              <option>还行</option>
              <option>流畅</option>
            </select>
          </label>
        </div>
        {status ? <p className="fp-status">{status}</p> : null}
        <BridgeButton type="submit" variant="primary" disabled={busy || !user}>
          {busy ? '保存中…' : '存足迹并请求陪练'}
        </BridgeButton>
      </form>

      {tips ? (
        <div className="fp-tips">
          <h3>AI 陪练反馈</h3>
          {coachNote ? <p className="fp-note">{coachNote}</p> : null}
          <ol>
            {tips.map((t) => (
              <li key={t.tag + t.text}>
                <span className="tag">{t.tag}</span>
                <p>{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="fp-list">
        <h3>最近足迹</h3>
        {!items.length ? (
          <p className="fp-empty">还没有足迹。完成上面的独立稿即可留下第一条。</p>
        ) : (
          <ul>
            {items.map((fp) => (
              <li key={fp.id}>
                <div className="fp-meta">
                  {fp.scene} · {new Date(fp.date).toLocaleString()}
                  {fp.selfRate ? ` · 自评 ${fp.selfRate}` : ''}
                </div>
                <h4>{fp.title}</h4>
                <p className="fp-body">{fp.raw}</p>
                <div className="fp-actions">
                  <button type="button" onClick={() => void onToggleMigrate(fp)}>
                    {fp.migrateChecked ? '已迁移 ✓' : '标记迁移'}
                  </button>
                  <button type="button" className="danger" onClick={() => void onDelete(fp)}>
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
