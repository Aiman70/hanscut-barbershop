// src/app/api/user/membership/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Sila log masuk' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Ambil semua rekod tempahan yang dah selesai (COMPLETED)
    const completedBookings = await prisma.booking.findMany({
      where: {
        customerId: userId,
        status: 'COMPLETED',
      },
      include: {
        service: true,
        barber: { include: { user: true } },
      },
      orderBy: { date: 'desc' },
    })

    const totalCuts = completedBookings.length

    // Kira cop dalam pusingan semasa (setiap 10 kali dapat ganjaran)
    const currentCycleStamps = totalCuts % 10
    const freeCutsEarned = Math.floor(totalCuts / 10)
    const cutsRemaining = 10 - currentCycleStamps

    // Tentukan tahap VIP Tier
    let tier = 'BRONZE'
    let discount = '0%'
    if (totalCuts >= 20) {
      tier = 'PLATINUM VIP'
      discount = '15%'
    } else if (totalCuts >= 10) {
      tier = 'GOLD MEMBER'
      discount = '10%'
    } else if (totalCuts >= 3) {
      tier = 'SILVER MEMBER'
      discount = '5%'
    }

    // Cari barber kegemaran
    const barberCounts: Record<string, { name: string; count: number }> = {}
    completedBookings.forEach((b) => {
      const bName = b.barber?.user?.name || 'Barber'
      if (!barberCounts[bName]) barberCounts[bName] = { name: bName, count: 0 }
      barberCounts[bName].count += 1
    })

    let favoriteBarber = 'Belum Ada'
    let maxCount = 0
    Object.values(barberCounts).forEach((b) => {
      if (b.count > maxCount) {
        maxCount = b.count
        favoriteBarber = b.name
      }
    })

    return NextResponse.json({
      totalCuts,
      currentCycleStamps,
      freeCutsEarned,
      cutsRemaining,
      tier,
      discount,
      favoriteBarber,
      lastCutDate: completedBookings[0]?.date || null,
    })
  } catch (error) {
    console.error('Membership error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
