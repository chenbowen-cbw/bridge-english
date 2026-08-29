import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BridgeButton } from '../../components/BridgeButton'
import { PLANS } from '../../content/pricing'
import { useAuth } from '../../features/auth'

export function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [billCycle, setBillCycle] = useState<'month' | 'year'>('month')

  function onPickPlan() {
    if (!user) {
      navigate('/login?next=' + encodeURIComponent('/app'))
      return
    }
    navigate('/app')
  }

  return (
    <main className="marketing-page">
      <section className="pricing-band" id="pricing">
        <div className="wrap">
          <div className="pricing-head">
            <h2>选一本陪你日常练英语的本子</h2>
            <p className="band-lead">
              计划、任务卡、陪练边界，再把输出留成足迹。付费换更稳的节奏与更长的对照——卖陪练与痕迹，不卖代写。
            </p>
          </div>
          <div className="bill-toggle" role="group" aria-label="计费周期">
            <button
              type="button"
              className={billCycle === 'month' ? 'on' : undefined}
              onClick={() => setBillCycle('month')}
            >
              按月
            </button>
            <button
              type="button"
              className={billCycle === 'year' ? 'on' : undefined}
              onClick={() => setBillCycle('year')}
            >
              按年 · 坚持奖励
            </button>
          </div>
          <p className="bill-hint">
            示意价 · CNY。年付按 <strong>8 个月价</strong>，多出来的 4 个月当作坚持奖励。当前仅存{' '}
            <code>plan_tier</code>，未接支付。工作台内只显示「当前：××本」，不重复完整价卡。
          </p>
          <div className="plan-spread">
            {PLANS.map((plan) => {
              const price = billCycle === 'year' ? plan.priceYear : plan.priceMonth
              const unit = billCycle === 'year' ? plan.unitYear : plan.unitMonth
              const note = billCycle === 'year' ? plan.noteYear : plan.noteMonth
              const colClass = [
                'plan-col',
                plan.featured ? 'featured' : '',
                plan.quiet ? 'quiet' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <article key={plan.id} className={colClass}>
                  <span className="plan-badge">{plan.badge}</span>
                  <h3>{plan.name}</h3>
                  <p className="plan-tagline">{plan.tagline}</p>
                  <div className="plan-price">
                    <span className="amt">{price}</span>
                    <span className="unit">{unit}</span>
                  </div>
                  <p className="plan-price-note">{note}</p>
                  <ul className="plan-list">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                    {plan.omit ? <li className="omit">{plan.omit}</li> : null}
                  </ul>
                  <BridgeButton
                    variant={plan.ghost ? 'ghost' : 'primary'}
                    arrow="right"
                    onClick={onPickPlan}
                  >
                    {plan.cta}
                  </BridgeButton>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
