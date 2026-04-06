'use client'

import React, { useEffect, useState } from 'react'

interface StatCounterProps {
  value: number
  prefix?: string
  suffix?: string
}

export default function StatCounter({ value, prefix = '', suffix = '' }: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return

    const duration = 1500
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span 
      className="animate-fadeIn"
      id={`stat-${value}`}
    >
      {prefix}
      <span>{displayValue.toLocaleString()}</span>
      {suffix}
    </span>
  )
}
