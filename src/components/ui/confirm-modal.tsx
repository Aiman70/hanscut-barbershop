// src/components/ui/confirm-modal.tsx - Hanscut Design System Confirmation Dialog
'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  children?: React.ReactNode
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Sahkan Tindakan',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
  children,
}: ConfirmModalProps) {
  const iconConfig = {
    danger: {
      icon: AlertTriangle,
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
      btnVariant: 'danger' as const,
    },
    warning: {
      icon: AlertCircle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      btnVariant: 'primary' as const,
    },
    info: {
      icon: Info,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      btnVariant: 'secondary' as const,
    },
  }

  const current = iconConfig[variant]
  const Icon = current.icon

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center space-y-4 pt-1">
        <div
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${current.color}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h4>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
        </div>

        {children && <div className="text-left text-xs bg-gray-950 p-3 rounded-xl border border-gray-800">{children}</div>}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={current.btnVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
