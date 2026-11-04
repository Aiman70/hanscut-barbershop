// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMMM yyyy', { locale: ms })
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  duration: number,
  bufferMinutes: number = 10
): string[] {
  if (!duration || duration <= 0) return []
  const slots: string[] = []
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)

  let currentMinutes = openHour * 60 + openMin
  const closeMinutes = closeHour * 60 + closeMin

  while (currentMinutes + duration <= closeMinutes) {
    const hour = Math.floor(currentMinutes / 60)
    const min = currentMinutes % 60
    slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
    // Setiap slot berjarak (tempoh servis + 10 minit masa rehat / sanitasi)
    currentMinutes += (duration + bufferMinutes)
  }

  return slots
}

export function getMalaysiaDate(): Date {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }))
}

export const DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
