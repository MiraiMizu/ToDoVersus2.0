'use client'

import React, { useEffect, useRef } from 'react'
import { animate, useMotionValue, useTransform, motion } from 'framer-motion'

interface StatCounterProps {
  value: number
  prefix?: string
  suffix?: string
}

export default function StatCounter({ value, prefix = '', suffix = '' }: StatCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => {
    return Math.round(latest).toLocaleString()
  })

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1], // easeOutCubic
    })
    return () => controls.stop()
  }, [count, value])

  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      id={`stat-${value}`}
    >
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}
