// src/components/ui/status-badge.tsx - Centralized Booking & Availability Status Indicator
import React from 'react'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | string
export type StaffStatus = 'AVAILABLE' | 'AUTO_OFF' | 'OFF_DUTY' | string

export interface StatusBadgeProps {
  status: BookingStatus | StaffStatus
  showIcon?: boolean
  className?: string
  size?: 'sm' | 'md'
}

interface StatusConfigItem {
  label: string
  badgeClass: string
  icon?: React.ComponentType<{ className?: string }>
}

export const STATUS_MAP: Record<string, StatusConfigItem> = {
  // Booking Statuses
  PENDING: {
    label: 'Menunggu',
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Disahkan',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle,
  },
  COMPLETED: {
    label: 'Selesai',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Batal',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: XCircle,
  },

  // Staff / Barber Statuses
  AVAILABLE: {
    label: 'Bertugas',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle,
  },
  AUTO_OFF: {
    label: 'Auto-Off (3 PM)',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock,
  },
  OFF_DUTY: {
    label: 'Cuti / Rehat',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: AlertCircle,
  },
}

export function StatusBadge({
  status,
  showIcon = false,
  className,
  size = 'md',
}: StatusBadgeProps) {
  const normalizedKey = (status || '').toUpperCase()
  const config = STATUS_MAP[normalizedKey] || {
    label: status || 'Unknown',
    badgeClass: 'bg-gray-800 text-gray-400 border-gray-700',
  }

  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold tracking-tight rounded-full border select-none transition-colors shrink-0',
        config.badgeClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && Icon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      <span>{config.label}</span>
    </span>
  )
}
