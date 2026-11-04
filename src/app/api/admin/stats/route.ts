// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 403 })
    }

    const now = new Date()

    const [totalBookings, todayBookings, pendingBookings, completedBookings] =
      await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({
          where: {
            date: {
              gte: startOfDay(now),
              lte: endOfDay(now),
            },
          },
        }),
        prisma.booking.count({
          where: { status: 'PENDING' },
        }),
        prisma.booking.findMany({
          where: {
            status: 'COMPLETED',
            date: {
              gte: startOfMonth(now),
              lte: endOfMonth(now),
            },
          },
          select: { totalPrice: true },
        }),
      ])

    const allCompleted = await prisma.booking.findMany({
      where: { status: 'COMPLETED' },
      select: { totalPrice: true },
    })

    const totalRevenue = allCompleted.reduce((sum, b) => sum + b.totalPrice, 0)
    const monthlyRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0)

    return NextResponse.json({
      totalBookings,
      todayBookings,
      pendingBookings,
      totalRevenue,
      monthlyRevenue,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
