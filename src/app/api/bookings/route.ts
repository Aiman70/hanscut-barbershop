// src/app/api/bookings/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { z } from 'zod'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

const bookingSchema = z.object({
  serviceId: z.string(),
  barberId: z.string(),
  date: z.string(),
  startTime: z.string(),
  notes: z.string().max(500, 'Nota terhad kepada 500 aksara sahaja').optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Sila log masuk terlebih dahulu' }, { status: 401 })
    }

    const body = await request.json()
    const validated = bookingSchema.parse(body)

    // Dapatkan maklumat servis
    const service = await prisma.service.findUnique({
      where: { id: validated.serviceId, isActive: true },
    })

    if (!service) {
      return NextResponse.json({ error: 'Servis tidak dijumpai atau tidak aktif' }, { status: 404 })
    }

    // Kira masa tamat (endTime)
    const [startHour, startMin] = validated.startTime.split(':').map(Number)
    const startTotalMin = startHour * 60 + startMin
    const endTotalMin = startTotalMin + service.duration
    const endHour = Math.floor(endTotalMin / 60)
    const endMin = endTotalMin % 60
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

    // 🛡️ SECURITY UPGRADE: Atomic Transaction (Kalis Race Condition & Had Kuota Dinamik)
    const db = prisma as any
    const settings = await db.shopSettings?.findUnique({ where: { id: 'default' } }).catch(() => null)
    const MAX_BOOKINGS_PER_DAY = settings?.dailyQuota || 20

    // Semak juga sekiranya emergency close atau closed date
    const isClosed = await db.closedDate?.findUnique({ where: { date: validated.date } }).catch(() => null)
    if (settings?.isEmergencyClose || isClosed) {
      return NextResponse.json({
        error: isClosed?.reason || settings?.noticeMessage || 'Kedai ditutup pada tarikh ini.'
      }, { status: 400 })
    }

    const booking = await prisma.$transaction(async (tx) => {
      // 1. Semak Kuota Harian (Maksimum 20 Orang Sehari)
      const startOfDay = new Date(validated.date + 'T00:00:00.000Z')
      const endOfDay = new Date(validated.date + 'T23:59:59.999Z')

      const totalBookingsToday = await tx.booking.count({
        where: {
          date: { gte: startOfDay, lt: endOfDay },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      })

      if (totalBookingsToday >= MAX_BOOKINGS_PER_DAY) {
        throw new Error('DAILY_LIMIT_REACHED')
      }

      // 2. Semak konflik slot & masa rehat 10 minit barber dalam transaksi atomik
      const BUFFER_MINUTES = 10
      const [newStartH, newStartM] = validated.startTime.split(':').map(Number)
      const [newEndH, newEndM] = endTime.split(':').map(Number)
      const newStartMin = newStartH * 60 + newStartM
      const newEndMin = newEndH * 60 + newEndM

      const existingDayBookings = await tx.booking.findMany({
        where: {
          barberId: validated.barberId,
          date: {
            gte: new Date(validated.date + 'T00:00:00.000Z'),
            lt: new Date(validated.date + 'T23:59:59.999Z'),
          },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      })

      const hasConflict = existingDayBookings.some((b) => {
        const [bStartH, bStartM] = b.startTime.split(':').map(Number)
        const [bEndH, bEndM] = b.endTime.split(':').map(Number)
        const bStartMin = bStartH * 60 + bStartM
        const bEndMin = bEndH * 60 + bEndM
        const bBufferedEnd = bEndMin + BUFFER_MINUTES

        // Bertindih jika slot baru masuk ke dalam masa gunting atau 10 minit waktu rehat/sanitasi
        return newStartMin < bBufferedEnd && newEndMin > bStartMin
      })

      if (hasConflict) {
        throw new Error('SLOT_CONFLICT')
      }

      // 2. Semak kewujudan Barber
      const barber = await tx.barber.findUnique({
        where: { id: validated.barberId, isAvailable: true },
        include: { user: true },
      })

      if (!barber) {
        throw new Error('BARBER_NOT_FOUND')
      }

      // 3. Cipta Rekod Tempahan
      return await tx.booking.create({
        data: {
          customerId: session.user.id as string,
          serviceId: validated.serviceId,
          barberId: validated.barberId,
          date: new Date(validated.date),
          startTime: validated.startTime,
          endTime,
          totalPrice: service.price,
          notes: validated.notes,
          status: 'CONFIRMED',
        },
        include: {
          customer: true,
          service: true,
          barber: { include: { user: true } },
        },
      })
    })

    // Hantar email pengesahan
    try {
      await sendBookingConfirmationEmail({
        customerName: (booking as any).customer?.name || 'Pelanggan',
        customerEmail: (booking as any).customer?.email || '',
        serviceName: (booking as any).service?.name || '',
        barberName: (booking as any).barber?.user?.name || 'Barber',
        date: format(new Date(validated.date), 'dd MMMM yyyy', { locale: ms }),
        time: validated.startTime,
        totalPrice: service.price,
        bookingId: booking.id,
      })
    } catch (emailError) {
      console.warn('Email warning (non-fatal):', emailError)
    }

    return NextResponse.json({ booking, message: 'Tempahan berjaya dibuat!' })
  } catch (error: any) {
    if (error?.message === 'DAILY_LIMIT_REACHED') {
      return NextResponse.json({ error: '🔴 Kuota tempahan untuk tarikh ini telah penuh (Maksimum 20 orang sehari). Sila pilih tarikh lain.' }, { status: 400 })
    }
    if (error?.message === 'SLOT_CONFLICT') {
      return NextResponse.json({ error: 'Slot masa ini sudah diambil oleh pelanggan lain. Sila pilih waktu lain.' }, { status: 409 })
    }
    if (error?.message === 'BARBER_NOT_FOUND') {
      return NextResponse.json({ error: 'Barber yang dipilih tidak tersedia.' }, { status: 404 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Ralat pelayan semasa memproses tempahan.' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = (session.user as any).role

    // 🛡️ SECURITY UPGRADE: Prinsip Least Privilege
    let where: any = {}

    if (role === 'ADMIN') {
      // Admin boleh tengok semua tempahan
      where = status ? { status: status as any } : {}
    } else if (role === 'BARBER') {
      // Barber hanya boleh tengok tempahan yang ditugaskan kepada dirinya
      const barber = await prisma.barber.findUnique({
        where: { userId: session.user.id },
      })
      if (!barber) return NextResponse.json([])
      where = { barberId: barber.id, ...(status ? { status: status as any } : {}) }
    } else {
      // Pelanggan biasa HANYA boleh tengok tempahan miliknya sendiri
      where = { customerId: session.user.id }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: { name: true, email: true, phone: true },
        },
        barber: {
          include: {
            user: { select: { name: true } },
          },
        },
        service: {
          select: { name: true, duration: true },
        },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    })

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
