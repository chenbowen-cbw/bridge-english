import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../auth'
import { requestCoachTips } from '../ai-coach/api'
import type { CoachTip, LocalFootprint } from '../../lib/supabase'
import {
  createFootprint,
  deleteFootprint,
  listFootprints,
  loadLocalFootprints,
  updateFootprint,
  updateFootprintMigrated,
} from './api'
import { notifyFootprintsChanged } from './events'
import {
  TASK_TEMPLATES,
  consumeRequestedTemplate,
  getTemplate,
  onTemplateRequest,
  type Scene,
  type TaskTemplate,
} from './templates'
import './footprints.css'

const SCENES: Scene[] = ['生活', '职场', '兴趣']

const DEFAULT = TASK_TEMPLATES[0]

type AuthNudge = () => void

type Props = {
  onNeedAuth?: AuthNudge
  /** Sidebar session → highlight / open this footprint. */
  focusId?: string | null
  queryWarning?: string | null
  onClearFocus?: () => void
  onInvalidFocus?: () => void
}

export function FootprintsPanel({
  onNeedAuth,
  focusId,
  queryWarning,
  onClearFocus,
  onInvalidFocus,
}: Props) {
  const { user, configured } = useAuth()
  const draftRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const appliedFocusRef = useRef<string | null>(null)
  const [items, setItems] = useState<LocalFootprint[]>([])
  const [source, setSource] = useState<'supabase' | 'local'>('local')
  const [busy, setBusy] = useState(false)
  const [activeId, setActiveId] = useState(DEFAULT.id)
  const [scene, setScene] = useState<Scene>(DEFAULT.scene)
  const [title, setTitle] = useState(DEFAULT.title)
  const [criteria, setCriteria] = useState(DEFAULT.criteria)
  const [placeholder, setPlaceholder] = useState(DEFAULT.placeholder)
  const [exampleDraft, setExampleDraft] = useState(DEFAULT.exampleDraft)
  const [body, setBody] = useState('')
  const [showExampleInDraft, setShowExampleInDraft] = useState(false)
  const [criteriaMet, setCriteriaMet] = useState(true)
  const [selfRating, setSelfRating] = useState('还行')
  const [tips, setTips] = useState<CoachTip[] | null>(null)
  const [coachNote, setCoachNote] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'ok' | 'warn'>('ok')
  const [focusDraftAfter, setFocusDraftAfter] = useState(0)
  const [focusedId, setFocusedId] = useState<string | null>(focusId ?? null)
  const [listReady, setListReady] = useState(false)

  const activeTemplate = getTemplate(activeId) ?? DEFAULT

  useEffect(() => {
    if (!focusDraftAfter) return
    const el = draftRef.current
    if (!el) return
    const timer = window.setTimeout(() => {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 40)
    return () => window.clearTimeout(timer)
  }, [focusDraftAfter])

  function applyTemplate(tpl: TaskTemplate, opts?: { fillExample?: boolean; focus?: boolean }) {
    setActiveId(tpl.id)
    setScene(tpl.scene)
    setTitle(tpl.title)
    setCriteria(tpl.criteria)
    setPlaceholder(tpl.placeholder)
    setExampleDraft(tpl.exampleDraft)
    const fill = opts?.fillExample ?? showExampleInDraft
    if (fill) {
      setBody(tpl.exampleDraft)
      setShowExampleInDraft(true)
    } else if (showExampleInDraft) {
      setBody(tpl.exampleDraft)
    } else {
      setBody('')
    }
    setStatus(`已填入「${tpl.title}」——先自己写，AI 只点拨。`)
    setStatusTone('ok')
    if (opts?.focus) setFocusDraftAfter((n) => n + 1)
  }

  function selectTemplate(tpl: TaskTemplate) {
    applyTemplate(tpl)
  }

  function practiceWithTemplate(tpl: TaskTemplate, fillExample = false) {
    applyTemplate(tpl, { fillExample, focus: true })
  }

  useEffect(() => {
    const pending = consumeRequestedTemplate()
    if (pending) {
      const tpl = getTemplate(pending)
      if (tpl) applyTemplate(tpl, { focus: true })
    }
    return onTemplateRequest((id) => {
      const tpl = getTemplate(id)
      if (tpl) applyTemplate(tpl, { focus: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once for external requests
  }, [])

  async function refresh() {
    const res = await listFootprints(user?.id)
    setItems(res.items)
    setSource(res.source)
    setListReady(true)
    notifyFootprintsChanged()
  }

  function showLocalAfterCloudFail() {
    setItems(loadLocalFootprints(user?.id))
    setSource('local')
    notifyFootprintsChanged()
  }

  useEffect(() => {
    setListReady(false)
    void refresh()
  }, [user?.id])

  useEffect(() => {
    if (!focusId) {
      appliedFocusRef.current = null
      setFocusedId(null)
      return
    }
    if (!listReady) return
    const fp = items.find((item) => item.id === focusId)
    if (!fp) {
      onInvalidFocus?.()
      return
    }
    setFocusedId(focusId)
    if (appliedFocusRef.current === focusId) return
    appliedFocusRef.current = focusId
    setTitle(fp.title)
    setBody(fp.raw)
    if (SCENES.includes(fp.scene as Scene)) setScene(fp.scene as Scene)
    setCriteriaMet(fp.stdChecked)
    if (fp.selfRate) setSelfRating(fp.selfRate)
    const tpl = TASK_TEMPLATES.find((t) => t.title === fp.title)
    if (tpl) {
      setActiveId(tpl.id)
      setCriteria(tpl.criteria)
      setPlaceholder(tpl.placeholder)
      setExampleDraft(tpl.exampleDraft)
    }
    setStatus(`正在改「${fp.title}」——保存会更新这条，不会另存一条。`)
    setStatusTone('ok')
    const el = document.getElementById(`fp-item-${focusId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId, items, listReady, onInvalidFocus])

  const editingId =
    focusedId && items.some((item) => item.id === focusedId) ? focusedId : null

  function writeAnotherWithSameTemplate() {
    const tpl = getTemplate(activeId) ?? DEFAULT
    setBody('')
    setShowExampleInDraft(false)
    setFocusedId(null)
    appliedFocusRef.current = null
    onClearFocus?.()
    setStatus(`用「${tpl.title}」再写一条。写完会存成新练习。`)
    setStatusTone('ok')
    setFocusDraftAfter((n) => n + 1)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    const draft = body.trim()
    if (!draft) {
      setStatus('请先写独立稿，再存练习或请求陪练。')
      setStatusTone('warn')
      return
    }

    const payload = {
      scene,
      title: title.trim() || '未命名任务',
      body: draft,
      criteria_met: criteriaMet,
      self_rating: selfRating,
      mode: 'text' as const,
    }

    // Anonymous: one local draft; updating that same row is allowed.
    if (!user) {
      const existing = items.length ? items : (await listFootprints(null)).items
      if (!editingId && existing.length >= 1) {
        setStatus('匿名草稿限一条。登录后可写入云端并请求陪练。')
        setStatusTone('warn')
        onNeedAuth?.()
        return
      }
      setBusy(true)
      setStatus(null)
      setTips(null)
      setCoachNote(null)
      if (editingId) {
        const updated = await updateFootprint(editingId, payload, null)
        await refresh()
        setStatus(
          updated.cloud === 'failed'
            ? `本机这条还在，未能写入：${updated.cloudError ?? '未知错误'}。`
            : '已更新这条本机草稿（同一条，没有另存）。',
        )
        setStatusTone(updated.cloud === 'failed' ? 'warn' : 'ok')
        setBusy(false)
        return
      }
      const created = await createFootprint(payload, null)
      await refresh()
      setBody('')
      setShowExampleInDraft(false)
      setStatus(
        created.cloud === 'skipped'
          ? '已存一条本机匿名草稿。登录后可同步云端并开启陪练。'
          : '练习已保存到本机',
      )
      setStatusTone('ok')
      setBusy(false)
      return
    }

    setBusy(true)
    setStatus(null)
    setTips(null)
    setCoachNote(null)

    if (editingId) {
      const updated = await updateFootprint(editingId, payload, user.id)
      if (updated.cloud === 'failed') {
        showLocalAfterCloudFail()
        setStatus(
          `本地已更新这条练习，但云端同步失败：${updated.cloudError ?? '未知错误'}。请检查网络后重试，勿当作已同步。`,
        )
        setStatusTone('warn')
        setBusy(false)
        return
      }
      await refresh()
      setStatus(updated.cloud === 'ok' ? '已更新这条练习（同一条）' : '已更新本机练习')
      setStatusTone('ok')
      setBusy(false)
      return
    }

    const created = await createFootprint(payload, user.id)
    if (created.cloud === 'failed') {
      showLocalAfterCloudFail()
      setStatus(
        `本地已暂存，但云端写入失败：${created.cloudError ?? '未知错误'}。请检查网络后重试，勿当作已同步。`,
      )
      setStatusTone('warn')
      setBusy(false)
      return
    }

    await refresh()

    const coach = await requestCoachTips({
      draft,
      taskTitle: title.trim(),
      criteria: criteria.trim() || undefined,
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
    setShowExampleInDraft(false)
    setStatus(created.cloud === 'ok' ? '练习已写入云端' : '练习已保存到本机')
    setStatusTone('ok')
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
    if (focusedId === fp.id) onClearFocus?.()
    await refresh()
  }

  function toggleExampleFill(on: boolean) {
    setShowExampleInDraft(on)
    if (on) setBody(exampleDraft)
    else setBody('')
  }

  return (
    <section className="fp-panel" id="app-footprints">
      <div className="fp-head">
        <div>
          <p className="kicker">练习 · 持久化</p>
          <h2>留下独立输出</h2>
          <p className="fp-lead">
            先写自己的稿，再存证；AI 只点拨，不整段改写。打开笔记本对页：左页选模板，右页练习。
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
          未登录可先写草稿（存于本机匿名本）。要写入云端并请求陪练，请先登录。
          {onNeedAuth ? (
            <>
              {' '}
              <button type="button" className="fp-banner-link" onClick={onNeedAuth}>
                去登录
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="fp-spread" aria-label="练习对页">
        <div className="fp-page fp-page--left" aria-label="推荐模板">
          <div className="fp-page-margin" aria-hidden="true" />
          <div className="fp-recommend-head">
            <p className="fp-section-label">左页 · 推荐模板</p>
            <p className="fp-section-hint">点选后右页即时预览；独立稿仍须你自己写。</p>
          </div>
          <ul className="fp-template-list">
            {TASK_TEMPLATES.map((tpl) => (
              <li key={tpl.id}>
                <button
                  type="button"
                  className={activeId === tpl.id ? 'on' : undefined}
                  aria-current={activeId === tpl.id ? 'true' : undefined}
                  onClick={() => selectTemplate(tpl)}
                >
                  <span className="fp-tpl-scene">{tpl.scene}</span>
                  <span className="fp-tpl-title">{tpl.title}</span>
                  <span className="fp-tpl-meta">
                    {tpl.timeHint} · {tpl.action}
                  </span>
                  <span className="fp-tpl-std">{tpl.criteria}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="fp-spine" aria-hidden="true" />

        <div className="fp-page fp-page--right">
          <div className="fp-page-margin" aria-hidden="true" />
          <div className="fp-detail-head">
            <p className="fp-section-label">
              右页 · 正在练习 <span className="fp-badge">示例 · 可模仿</span>
            </p>
            <h3 className="fp-practicing">{activeTemplate.title}</h3>
            <p className="fp-section-hint">
              受众：{activeTemplate.audience} · 动作：{activeTemplate.action}
            </p>
          </div>

          <article className="fp-example-card" aria-live="polite">
            <p className="fp-example-std">
              <strong>完成标准：</strong>
              {activeTemplate.criteria}
            </p>
            <pre className="fp-example-draft">{activeTemplate.exampleDraft}</pre>
            <div className="fp-example-actions">
              <BridgeButton
                type="button"
                variant="primary"
                onClick={() => practiceWithTemplate(activeTemplate)}
              >
                用这个模板练习
              </BridgeButton>
              <BridgeButton
                type="button"
                variant="ghost"
                arrow="none"
                onClick={() => practiceWithTemplate(activeTemplate, true)}
              >
                填入示例稿（可改）
              </BridgeButton>
            </div>
          </article>

          <form className="fp-form" ref={formRef} onSubmit={(e) => void onSave(e)}>
            <p className="fp-form-kicker">
              {editingId ? '独立输出 · 正在改原条' : '独立输出'} ·{' '}
              {activeTemplate.title.replace(/ · .*$/, '')}
            </p>
            <label>
              独立稿（必填）
              <textarea
                ref={draftRef}
                id="fp-draft"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={placeholder}
                required
              />
            </label>
            <label className="fp-check fp-example-toggle">
              <input
                type="checkbox"
                checked={showExampleInDraft}
                onChange={(e) => toggleExampleFill(e.target.checked)}
              />
              显示示例稿作起点（请改成自己的话再提交）
            </label>
            <div className="fp-form-meta">
              <label>
                场景
                <select value={scene} onChange={(e) => setScene(e.target.value as Scene)}>
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
                完成标准
                <input
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder="可观察的结果，例如：对方能听懂你要什么"
                />
              </label>
            </div>
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
            {queryWarning ? (
              <p className="fp-status fp-status--warn" role="status">
                {queryWarning}
              </p>
            ) : null}
            {status ? (
              <p className={`fp-status${statusTone === 'warn' ? ' fp-status--warn' : ''}`}>{status}</p>
            ) : null}
            {editingId ? (
              <div className="fp-cta-row">
                <BridgeButton type="submit" variant="primary" disabled={busy}>
                  {busy ? '更新中…' : '更新这条练习'}
                </BridgeButton>
                <BridgeButton
                  type="button"
                  variant="ghost"
                  arrow="none"
                  disabled={busy}
                  onClick={writeAnotherWithSameTemplate}
                >
                  用同一模板再写一条
                </BridgeButton>
              </div>
            ) : user ? (
              <BridgeButton type="submit" variant="primary" disabled={busy}>
                {busy ? '保存中…' : '存练习并请求陪练'}
              </BridgeButton>
            ) : (
              <div className="fp-cta-row">
                <BridgeButton type="submit" variant="primary" disabled={busy}>
                  {busy ? '保存中…' : '存一条本机草稿'}
                </BridgeButton>
                <BridgeButton type="button" variant="ghost" arrow="none" onClick={() => onNeedAuth?.()}>
                  登录以云端保存
                </BridgeButton>
              </div>
            )}
          </form>
        </div>
      </div>

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
        <h3>最近练习</h3>
        {!items.length ? (
          <p className="fp-empty">还没有练习。完成上面的独立稿即可留下第一条。</p>
        ) : (
          <ul>
            {items.map((fp) => (
              <li
                key={fp.id}
                id={`fp-item-${fp.id}`}
                className={focusedId === fp.id ? 'fp-item-on' : undefined}
              >
                <div className="fp-meta">
                  {fp.scene} · {new Date(fp.date).toLocaleString()}
                  {fp.selfRate ? ` · 自评 ${fp.selfRate}` : ''}
                </div>
                <h4>{fp.title}</h4>
                <p className="fp-body">{fp.raw}</p>
                <div className="fp-actions">
                  <button type="button" onClick={() => void onToggleMigrate(fp)} disabled={!user}>
                    {fp.migrateChecked ? '已迁移 ✓' : '标记迁移'}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void onDelete(fp)}
                    disabled={!user}
                  >
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
