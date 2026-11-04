// src/app/api/services/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { recordAuditLog } from '@/lib/audit'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 403 })
    }

    const body = await request.json()
    const service = await prisma.service.update({
      where: { id: params.id },
      data: body,
    })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'UPDATE_SERVICE',
      category: 'SERVICE',
      details: `Mengemaskini servis "${service.name}" (Harga: RM${service.price}, Tempoh: ${service.duration} min)`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      ipAddress: clientIp,
    })

    return NextResponse.json(service)
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 403 })
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'DELETE_SERVICE',
      category: 'SERVICE',
      details: `Menyahaktifkan / memadam servis: "${service.name}"`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      ipAddress: clientIp,
    })

    return NextResponse.json({ message: 'Servis dipadamkan' })
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
