import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useSpring } from 'motion/react'

/**
 * Vendored from Amicro magnetic-button (registry/ui/hover/magnetic-button.tsx).
 * Adapted for `motion/react` and Bridge notebook styling (no Tailwind dependency).
 * @see https://amicro.vercel.app/buttons
 */
export type MagneticButtonProps = {
  children: ReactNode
  range?: number
  strength?: number
  className?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  'aria-label'?: string
}

export function MagneticButton({
  children,
  range = 45,
  strength = 0.32,
  className = '',
  onClick,
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()
  const springConfig = { stiffness: 160, damping: 16, mass: 0.55 }
  const x = useSpring(0, springConfig)
  const y = useSpring(0, springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    const dist = Math.hypot(clientX - centerX, clientY - centerY)
    if (dist < range) {
      x.set((clientX - centerX) * strength)
      y.set((clientY - centerY) * strength)
    } else {
      x.set(0)
      y.set(0)
    }
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={reduce ? undefined : { x, y }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={className}
    >
      {children}
    </motion.button>
  )
}
