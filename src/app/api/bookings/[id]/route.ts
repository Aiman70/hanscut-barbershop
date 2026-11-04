// src/app/api/bookings/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendBookingCancellationEmail } from '@/lib/email'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 401 })
    }

    const body = await request.json()
    const validated = statusSchema.parse(body)
    const { status } = validated

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        service: true,
        barber: { include: { user: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Tempahan tidak dijumpai' }, { status: 404 })
    }

    // 🛡️ SECURITY UPGRADE: Semakan Kebenaran Yang Ketat (Access Control)
    const isOwner = booking.customerId === session.user.id
    const isAdmin = (session.user as any).role === 'ADMIN'

    // Semak sama ada pengguna yang login adalah barber yang ditugaskan
    const barberProfile = await prisma.barber.findUnique({
      where: { userId: session.user.id },
    })
    const isAssignedBarber = barberProfile && booking.barberId === barberProfile.id

    // Pelanggan HANYA boleh batalkan tempahan miliknya sendiri
    if (isOwner && status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Pelanggan hanya dibenarkan membatalkan tempahan sahaja.' },
        { status: 403 }
      )
    }

    // Jika bukan Owner, bukan Admin, dan bukan Barber yang ditugaskan: TOLAK
    if (!isOwner && !isAdmin && !isAssignedBarber) {
      return NextResponse.json({ error: 'Akses dinafikan.' }, { status: 403 })
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
    })

    // Hantar email jika status bertukar kepada CANCELLED
    if (status === 'CANCELLED') {
      try {
        await sendBookingCancellationEmail({
          customerName: booking.customer.name || 'Pelanggan',
          customerEmail: booking.customer.email,
          serviceName: booking.service.name,
          barberName: booking.barber.user.name || 'Barber',
          date: format(booking.date, 'dd MMMM yyyy', { locale: ms }),
          time: booking.startTime,
          totalPrice: booking.totalPrice,
          bookingId: booking.id,
        })
      } catch (emailError) {
        console.warn('Email warning (non-fatal):', emailError)
      }
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Status tempahan tidak sah.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
