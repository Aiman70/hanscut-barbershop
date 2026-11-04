// src/app/api/services/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { recordAuditLog } from '@/lib/audit'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().min(15),
  price: z.number().min(0),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 403 })
    }

    const body = await request.json()
    const validated = serviceSchema.parse(body)

    const service = await prisma.service.create({ data: validated })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'CREATE_SERVICE',
      category: 'SERVICE',
      details: `Menambah servis baru: "${validated.name}" (Harga: RM${validated.price}, Tempoh: ${validated.duration} min)`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      ipAddress: clientIp,
    })

    return NextResponse.json(service)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
