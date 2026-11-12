// src/components/ui/badge.tsx - Hanscut Design System Generic Badge
import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'amber' | 'emerald' | 'blue' | 'red' | 'outline' | 'muted'
  size?: 'sm' | 'md'
}

export function Badge({
  className,
  children,
  variant = 'default',
  size = 'md',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-bold tracking-wide rounded-full select-none transition-colors border'

  const variants = {
    default: 'bg-gray-800 text-gray-300 border-gray-700',
    amber: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    outline: 'bg-transparent text-gray-300 border-gray-800',
    muted: 'bg-gray-950 text-gray-400 border-gray-800',
  }

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  )
}
