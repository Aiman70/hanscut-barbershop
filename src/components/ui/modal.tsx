// src/components/ui/modal.tsx - Hanscut Design System Unified Modal Dialog
'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 text-white animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-4 border-b border-gray-800/80 pb-3">
          <div>
            {title && <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{title}</h3>}
            {description && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Tutup Dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}
