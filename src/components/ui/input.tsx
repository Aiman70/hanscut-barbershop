// src/components/ui/input.tsx - Hanscut Design System Input
import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 transition-all duration-150',
            'focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 flex items-center">
            {rightIcon}
          </div>
        )}
        {error && <p className="text-[11px] text-red-400 font-medium mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
