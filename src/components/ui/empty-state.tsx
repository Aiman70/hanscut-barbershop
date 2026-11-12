// src/components/ui/empty-state.tsx - Hanscut Design System Empty State
import React from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-gray-950 border border-gray-800 flex items-center justify-center text-gray-500 mb-1">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h4 className="text-base font-bold text-white tracking-tight">{title}</h4>
      {description && <p className="text-xs text-gray-400 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
