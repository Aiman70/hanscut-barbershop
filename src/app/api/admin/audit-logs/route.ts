// src/app/api/admin/audit-logs/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const db = prisma as any

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin dibenarkan' }, { status: 403 })
    }

    if (!db.auditLog) {
      return NextResponse.json({ logs: [] })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const whereClause: any = {}
    if (category && category !== 'ALL') {
      whereClause.category = category
    }

    const logs = await db.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
