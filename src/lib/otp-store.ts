// src/lib/otp-store.ts
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const db = prisma as any

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 Minit sah
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000 // 60 Saat antara setiap permintaan
const MAX_OTP_ATTEMPTS = 5 // Maksimum 5 kali tekaan salah

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex')
}

/**
 * Jana kod OTP 6-digit selamat dan simpan dalam PostgreSQL (Neon DB).
 * Ini memastikan kod kalis serverless Vercel dan tidak hilang bila bertukar pelayan.
 */
export async function generateSecureOtp(email: string): Promise<{ otp: string; waitSeconds?: number }> {
  const emailKey = email.trim().toLowerCase()
  const now = Date.now()

  // 1. Semak sekatan laju (Rate Limit: 60 saat) dari Database
  try {
    if (db.auditLog) {
      const latestOtpLog = await db.auditLog.findFirst({
        where: {
          category: 'AUTH',
          action: 'PASSWORD_RESET_OTP',
          userEmail: emailKey,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (latestOtpLog) {
        const timeSinceCreated = now - new Date(latestOtpLog.createdAt).getTime()
        if (timeSinceCreated < RATE_LIMIT_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil((RATE_LIMIT_COOLDOWN_MS - timeSinceCreated) / 1000)
          return { otp: '', waitSeconds: remainingSeconds }
        }
      }
    }
  } catch (err) {
    console.warn('[OTP STORE] Ralat semasa semak rate limit DB:', err)
  }

  // 2. Jana nombor 6-digit selamat menggunakan kriptografi
  const otp = crypto.randomInt(100000, 999999).toString()
  const hashed = hashOtp(otp)

  // 3. Simpan ke dalam Database (Neon PostgreSQL)
  try {
    if (db.auditLog) {
      await db.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_OTP',
          category: 'AUTH',
          details: JSON.stringify({
            hash: hashed,
            expiresAt: now + OTP_EXPIRY_MS,
            attempts: 0,
          }),
          userEmail: emailKey,
        },
      })
    }
  } catch (dbErr) {
    console.error('[OTP STORE ERROR] Gagal menyimpan OTP ke Database:', dbErr)
  }

  return { otp }
}

/**
 * Sahkan kod OTP daripada pengguna dan tandakan sebagai telah digunakan.
 */
export async function verifyAndConsumeOtp(
  email: string,
  userEnteredOtp: string
): Promise<{ valid: boolean; error?: string }> {
  const emailKey = email.trim().toLowerCase()
  const now = Date.now()

  try {
    if (!db.auditLog) {
      return { valid: false, error: 'Sistem pangkalan data tidak tersedia.' }
    }

    const latestOtpLog = await db.auditLog.findFirst({
      where: {
        category: 'AUTH',
        action: 'PASSWORD_RESET_OTP',
        userEmail: emailKey,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!latestOtpLog) {
      return {
        valid: false,
        error: 'Tiada permohonan OTP dijumpai untuk emel ini. Sila minta kod baru.',
      }
    }

    let record: { hash: string; expiresAt: number; attempts: number }
    try {
      record = JSON.parse(latestOtpLog.details)
    } catch {
      return { valid: false, error: 'Format data OTP rosak. Sila minta kod baru.' }
    }

    // 1. Semakan Masa Luput (10 minit)
    if (now > record.expiresAt) {
      await db.auditLog.update({
        where: { id: latestOtpLog.id },
        data: { action: 'PASSWORD_RESET_OTP_EXPIRED' },
      })
      return { valid: false, error: 'Kod OTP ini telah tamat tempoh (melebihi 10 minit). Sila minta kod baru.' }
    }

    // 2. Semakan Had Percubaan Salah (Anti-Brute Force)
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await db.auditLog.update({
        where: { id: latestOtpLog.id },
        data: { action: 'PASSWORD_RESET_OTP_BLOCKED' },
      })
      return { valid: false, error: 'Terlalu banyak percubaan kod OTP yang salah. Kod ini telah dibatalkan demi keselamatan.' }
    }

    // 3. Semakan Kesahihan Kod melalui SHA-256 Hash
    const enteredHash = hashOtp(userEnteredOtp)
    if (record.hash !== enteredHash) {
      record.attempts += 1
      await db.auditLog.update({
        where: { id: latestOtpLog.id },
        data: { details: JSON.stringify(record) },
      })
      const baki = MAX_OTP_ATTEMPTS - record.attempts
      return { valid: false, error: `Kod OTP salah! Baki percubaan yang tinggal: ${baki}` }
    }

    // 4. Lulus -> Tandakan OTP sebagai telah digunakan (Single-use security)
    await db.auditLog.update({
      where: { id: latestOtpLog.id },
      data: { action: 'PASSWORD_RESET_OTP_CONSUMED' },
    })

    return { valid: true }
  } catch (err) {
    console.error('[OTP STORE ERROR] Ralat semasa mengesahkan OTP:', err)
    return { valid: false, error: 'Ralat pelayan semasa mengesahkan kod OTP.' }
  }
}
