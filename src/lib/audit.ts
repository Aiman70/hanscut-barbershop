// src/lib/audit.ts
import { prisma } from '@/lib/prisma'

interface LogAuditParams {
  action: string
  category: 'SETTINGS' | 'STAFF' | 'SERVICE' | 'BOOKING' | 'AUTH'
  details: string
  userId?: string | null
  userEmail?: string | null
  userRole?: string | null
  ipAddress?: string | null
}

const db = prisma as any

export async function recordAuditLog({
  action,
  category,
  details,
  userId,
  userEmail,
  userRole,
  ipAddress,
}: LogAuditParams) {
  try {
    if (!db.auditLog) return null
    return await db.auditLog.create({
      data: {
        action,
        category,
        details,
        userId: userId || null,
        userEmail: userEmail || null,
        userRole: userRole || null,
        ipAddress: ipAddress || null,
      },
    })
  } catch (error) {
    console.error('[AUDIT ERROR] Gagal merekod jejak audit:', error)
    return null
  }
}
