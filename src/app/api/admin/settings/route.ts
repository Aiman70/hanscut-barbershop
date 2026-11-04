// src/app/api/admin/settings/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const db = prisma as any

// 1. Ambil tetapan kedai terkini & senarai tarikh tutup
export async function GET() {
  try {
    let settings = await db.shopSettings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      settings = await db.shopSettings.create({
        data: {
          id: 'default',
          dailyQuota: 20,
          noticeMessage: 'Kedai beroperasi seperti biasa.',
          isEmergencyClose: false,
        },
      })
    }

    const closedDates = await db.closedDate.findMany({
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ settings, closedDates })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// 2. Kemaskini kuota harian & notis
const updateSettingsSchema = z.object({
  dailyQuota: z.number().min(1).max(200),
  noticeMessage: z.string().optional(),
  isEmergencyClose: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin dibenarkan' }, { status: 403 })
    }

    const body = await request.json()
    const validated = updateSettingsSchema.parse(body)

    const updated = await db.shopSettings.upsert({
      where: { id: 'default' },
      update: validated,
      create: {
        id: 'default',
        dailyQuota: validated.dailyQuota,
        noticeMessage: validated.noticeMessage || '',
        isEmergencyClose: validated.isEmergencyClose || false,
      },
    })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'UPDATE_SETTINGS',
      category: 'SETTINGS',
      details: `Kemaskini tetapan kedai: Kuota=${validated.dailyQuota}/hari, TutupKecemasan=${validated.isEmergencyClose ? 'AKTIF' : 'TIDAK'}, Notis="${validated.noticeMessage || '-'}"`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      ipAddress: clientIp,
    })

    return NextResponse.json({ message: 'Tetapan kedai berjaya dikemaskini!', settings: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// 3. Tambah tarikh tutup kedai
const closeDateSchema = z.object({
  date: z.string(), // "YYYY-MM-DD"
  reason: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin dibenarkan' }, { status: 403 })
    }

    const body = await request.json()
    const validated = closeDateSchema.parse(body)

    const newClosedDate = await db.closedDate.upsert({
      where: { date: validated.date },
      update: { reason: validated.reason || 'Cuti Khas' },
      create: { date: validated.date, reason: validated.reason || 'Cuti Khas' },
    })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'ADD_CLOSED_DATE',
      category: 'SETTINGS',
      details: `Menambah tarikh cuti kedai: ${validated.date} (Sebab: ${validated.reason || 'Cuti Khas'})`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      ipAddress: clientIp,
    })

    return NextResponse.json({ message: 'Tarikh tutup kedai berjaya ditambah!', closedDate: newClosedDate })
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// 4. Buka semula kedai (Padam tarikh cuti)
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin dibenarkan' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Parameter tarikh diperlukan' }, { status: 400 })
    }

    await db.closedDate.delete({
      where: { date },
    })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'REOPEN_DATE',
      category: 'SETTINGS',
      details: `Membuka semula tempahan untuk tarikh yang sebelum ini ditutup: ${date}`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      ipAddress: clientIp,
    })

    return NextResponse.json({ message: 'Kedai dibuka semula untuk tarikh ini!' })
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
