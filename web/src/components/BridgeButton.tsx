import type { ReactNode } from 'react'
import { MagneticButton } from './amicro/magnetic-button'
import './bridge-button.css'

export type BridgeButtonVariant = 'primary' | 'hero' | 'nav' | 'ghost'

type Props = {
  children: ReactNode
  variant?: BridgeButtonVariant
  arrow?: 'right' | 'up' | 'none'
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

/**
 * Bridge ink pill — Amicro patterns (magnetic + glare + slide arrow + press)
 * restrained to the paper-notebook brand.
 */
export function BridgeButton({
  children,
  variant = 'primary',
  arrow = 'right',
  className = '',
  onClick,
  type = 'button',
  disabled,
}: Props) {
  const arrowGlyph = arrow === 'up' ? '↑' : arrow === 'right' ? '→' : null

  return (
    <MagneticButton
      className={`bridge-btn bridge-btn--${variant} ${className}`.trim()}
      strength={variant === 'hero' ? 0.28 : 0.32}
      range={variant === 'nav' ? 36 : 48}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      <span className="bridge-btn__glare" aria-hidden="true" />
      {arrowGlyph ? (
        <span className="bridge-btn__arrow" aria-hidden="true">
          {arrowGlyph}
        </span>
      ) : null}
      <span className="bridge-btn__label">{children}</span>
    </MagneticButton>
  )
}
