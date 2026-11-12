// src/components/ui/button.tsx - Hanscut Design System Button
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40'

    const variants = {
      primary:
        'bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-md shadow-amber-400/10 active:scale-[0.98]',
      secondary:
        'bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 hover:border-gray-700 active:scale-[0.98]',
      danger:
        'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 active:scale-[0.98]',
      success:
        'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 active:scale-[0.98]',
      ghost:
        'text-gray-400 hover:text-white hover:bg-gray-900 active:scale-[0.98]',
      outline:
        'border border-gray-800 text-gray-300 hover:text-white hover:border-amber-400/40 hover:bg-gray-900/50 active:scale-[0.98]',
    }

    const sizes = {
      sm: 'h-9 px-3 text-xs rounded-xl gap-1.5',
      md: 'min-h-[44px] px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
      lg: 'min-h-[48px] px-6 py-3 text-sm sm:text-base rounded-2xl gap-2.5',
      icon: 'h-10 w-10 p-0 rounded-xl justify-center',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
