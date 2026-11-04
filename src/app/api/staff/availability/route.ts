// src/app/api/staff/availability/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { recordAuditLog } from '@/lib/audit'

const toggleSchema = z.object({
  isAvailable: z.boolean(),
})

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Sila log masuk' }, { status: 401 })
    }

    const body = await request.json()
    const validated = toggleSchema.parse(body)

    // Cari profil barber milik pengguna yang sedang login
    const barber = await prisma.barber.findUnique({
      where: { userId: session.user.id },
    })

    if (!barber) {
      return NextResponse.json({ error: 'Profil barber tidak dijumpai' }, { status: 404 })
    }

    // Kemaskini status ketersediaan
    const updatedBarber = await prisma.barber.update({
      where: { id: barber.id },
      data: { isAvailable: validated.isAvailable },
    })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'TOGGLE_AVAILABILITY',
      category: 'STAFF',
      details: `Barber ${session.user.name || session.user.email} menukar status ketersediaan kepada: ${validated.isAvailable ? '🟢 Bertugas' : '🔴 Cuti / Rehat'}`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      ipAddress: clientIp,
    })

    return NextResponse.json({
      message: `Status ketersediaan berjaya dikemaskini kepada: ${validated.isAvailable ? 'Bertugas' : 'Cuti'}`,
      isAvailable: updatedBarber.isAvailable,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak sah' }, { status: 400 })
    }
    console.error('Toggle availability error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
