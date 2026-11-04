// src/app/api/admin/backup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import crypto from 'crypto'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const db = prisma as any

const ENCRYPTION_SECRET = process.env.BACKUP_KEY || process.env.NEXTAUTH_SECRET || 'BarbershopEncryptedBackupKey2026!'
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest()

function encrypt(text: string) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin dibenarkan' }, { status: 403 })
    }

    // Kumpulkan seluruh data pangkalan data
    const backupPayload = {
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestedBy: session.user.email,
        encryption: 'AES-256-CBC',
      },
      data: {
        users: await prisma.user.findMany(),
        barbers: await prisma.barber.findMany(),
        services: await prisma.service.findMany(),
        bookings: await prisma.booking.findMany(),
        businessHours: await prisma.businessHours.findMany(),
        shopSettings: await db.shopSettings?.findMany().catch(() => []),
        closedDates: await db.closedDate?.findMany().catch(() => []),
        auditLogs: await db.auditLog?.findMany().catch(() => []),
      },
    }

    const rawJson = JSON.stringify(backupPayload, null, 2)
    const encryptedData = encrypt(rawJson)

    // Rekod ke jejak Audit Log
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'DOWNLOAD_ENCRYPTED_BACKUP',
      category: 'SETTINGS',
      details: `Admin memuat turun sandaran pangkalan data terenkripsi AES-256`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      ipAddress: clientIp,
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `barbershop_backup_${timestamp}.enc`

    return new Response(encryptedData, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Backup download error:', error)
    return NextResponse.json({ error: 'Ralat menghasilkan sandaran' }, { status: 500 })
  }
}
