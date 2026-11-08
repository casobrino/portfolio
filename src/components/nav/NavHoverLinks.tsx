import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useRef, type MouseEvent } from 'react'
import './nav-hover.css'

export interface NavHoverItem {
  href: string
  heading: string
  subheading: string
  imgSrc: string
  current?: boolean
}

export default function NavHoverLinks ({ items }: { items: NavHoverItem[] }) {
  return (
    <div className='nav-hover'>
      {items.map((item) => (
        <HoverLink key={item.href} {...item} />
      ))}
    </div>
  )
}

function HoverLink ({ heading, subheading, imgSrc, href, current }: NavHoverItem) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 24 })
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 24 })
  const top = useTransform(mouseYSpring, [0.5, -0.5], ['40%', '60%'])
  const left = useTransform(mouseXSpring, [0.5, -0.5], ['62%', '74%'])

  function handleMouseMove (event: MouseEvent<HTMLAnchorElement>) {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    x.set((event.clientX - rect.left) / rect.width - 0.5)
    y.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.a
      href={href}
      ref={ref}
      onMouseMove={handleMouseMove}
      initial='initial'
      whileHover='whileHover'
      className='nav-hover-link'
      aria-current={current ? 'page' : undefined}
    >
      <div>
        <motion.span
          variants={{
            initial: { x: 0 },
            whileHover: { x: -16 },
          }}
          transition={{ type: 'spring', staggerChildren: 0.045, delayChildren: 0.08 }}
          className='nav-hover-heading'
        >
          {heading.split('').map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              variants={{
                initial: { x: 0 },
                whileHover: { x: 16 },
              }}
              transition={{ type: 'spring' }}
              className='nav-hover-letter'
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </motion.span>
        <span className='nav-hover-sub'>{subheading}</span>
      </div>

      <motion.img
        style={{ top, left, translateX: '-50%', translateY: '-50%' }}
        variants={{
          initial: { scale: 0, rotate: '-12.5deg' },
          whileHover: { scale: 1, rotate: '12.5deg' },
        }}
        transition={{ type: 'spring' }}
        src={imgSrc}
        alt=''
        className='nav-hover-img'
      />

      <motion.div
        variants={{
          initial: { x: '25%', opacity: 0 },
          whileHover: { x: '0%', opacity: 1 },
        }}
        transition={{ type: 'spring' }}
        className='nav-hover-arrow'
        aria-hidden='true'
      >
        <svg width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.6'>
          <path d='M5 12h14M13 6l6 6-6 6' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </motion.div>
    </motion.a>
  )
}
