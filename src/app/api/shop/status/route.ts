// src/app/api/shop/status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { getMalaysiaDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const db = prisma as any

export async function GET() {
  try {
    // Gunakan waktu Malaysia (UTC+8) agar tepat walaupun server Vercel di zon masa UTC
    const now = getMalaysiaDate()
    const dateStr = format(now, 'yyyy-MM-dd')
    const dayOfWeek = now.getDay()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeMinutes = currentHour * 60 + currentMinute

    const [settings, closedDate] = await Promise.all([
      db.shopSettings?.findUnique({ where: { id: 'default' } }).catch(() => null),
      db.closedDate?.findUnique({ where: { date: dateStr } }).catch(() => null),
    ])

    // 1. Semakan Mod Tutup Kecemasan (Emergency Close)
    if (settings?.isEmergencyClose) {
      return NextResponse.json({
        isOpen: false,
        statusBadge: '🔴 Kedai Ditutup Sementara',
        detail: settings.noticeMessage || 'Kedai ditutup sementara atas urusan khas / kecemasan.',
        isEmergency: true,
      })
    }

    // 2. Semakan Tarikh Cuti Khas Terjadual (Contoh: Cuti Raya)
    if (closedDate) {
      return NextResponse.json({
        isOpen: false,
        statusBadge: '🔴 Kedai Ditutup Hari Ini',
        detail: closedDate.reason || 'Cuti Khas Kedai',
        isHoliday: true,
      })
    }

    // 3. Waktu Operasi Rasmi Hanscut Barbershop:
    // Jumaat (dayOfWeek = 5): 8.30 Malam - 11.00 Malam (20:30 - 23:00)
    // Sabtu hingga Khamis: 3.00 Petang - 11.00 Malam (15:00 - 23:00)
    const isFriday = dayOfWeek === 5
    const openTimeMinutes = isFriday ? (20 * 60 + 30) : (15 * 60) // 20:30 or 15:00
    const closeTimeMinutes = 23 * 60 // 23:00

    if (currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes) {
      // Sedang Waktu Operasi
      return NextResponse.json({
        isOpen: true,
        statusBadge: '🟢 Kedai Dibuka Sekarang',
        detail: isFriday
          ? 'Jumaat (Malam Sahaja): 8.30 PM - 11.00 PM'
          : 'Waktu Operasi: 3.00 PM - 11.00 PM (Slot Tersedia)',
      })
    } else if (currentTimeMinutes < openTimeMinutes) {
      // Sebelum Waktu Buka Hari Ini
      const openTimeLabel = isFriday ? '8.30 Malam' : '3.00 Petang'
      return NextResponse.json({
        isOpen: false,
        statusBadge: `🕒 Buka Jam ${openTimeLabel} Hari Ini`,
        detail: isFriday
          ? 'Hari Jumaat operasi bermula 8.30 PM - 11.00 PM (Tempahan slot dibuka!)'
          : 'Operasi bermula 3.00 PM - 11.00 PM (Tempahan slot dibuka awal sekarang!)',
      })
    } else {
      // Selepas Waktu Tutup (11.00 PM ke atas)
      const nextOpenLabel = dayOfWeek === 4 ? 'Jumaat jam 8.30 Malam' : 'jam 3.00 Petang'
      return NextResponse.json({
        isOpen: false,
        statusBadge: '🌙 Kedai Ditutup Malam Ini',
        detail: `Buka semula ${nextOpenLabel}. Tempahan slot esok dibuka!`,
      })
    }
  } catch (error) {
    console.error('Shop status error:', error)
    return NextResponse.json({
      isOpen: true,
      statusBadge: '🟢 Hanscut Barbershop Dibuka',
      detail: 'Sabtu - Khamis: 3.00 PM - 11.00 PM | Jumaat: 8.30 PM - 11.00 PM',
    })
  }
}
