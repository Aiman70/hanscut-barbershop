// src/components/ui/textarea.tsx - Hanscut Design System Textarea
import React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 transition-all duration-150',
            'focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30',
            'disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed',
            error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-red-400 font-medium mt-1">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
