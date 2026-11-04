// src/lib/otp-store.ts
import crypto from 'crypto'

interface OtpRecord {
  otp: string
  expiresAt: number
  attempts: number
  lastRequestedAt: number
}

// In-Memory Secure OTP Store (Kalis tamat tempoh & kalis brute-force)
const otpStore = new Map<string, OtpRecord>()

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 Minit
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000 // 60 Saat antara setiap permintaan
const MAX_OTP_ATTEMPTS = 5 // Maksimum 5 kali tekaan salah

export function generateSecureOtp(email: string): { otp: string; waitSeconds?: number } {
  const emailKey = email.trim().toLowerCase()
  const now = Date.now()
  const existing = otpStore.get(emailKey)

  // 1. Semak sekatan laju (Rate Limit: 60 saat)
  if (existing && now - existing.lastRequestedAt < RATE_LIMIT_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (now - existing.lastRequestedAt)) / 1000)
    return { otp: '', waitSeconds: remainingSeconds }
  }

  // 2. Jana nombor 6-digit selamat menggunakan kriptografi
  const otp = crypto.randomInt(100000, 999999).toString()

  otpStore.set(emailKey, {
    otp,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    lastRequestedAt: now,
  })

  return { otp }
}

export function verifyAndConsumeOtp(email: string, userEnteredOtp: string): { valid: boolean; error?: string } {
  const emailKey = email.trim().toLowerCase()
  const record = otpStore.get(emailKey)
  const now = Date.now()

  if (!record) {
    return { valid: false, error: 'Tiada permohonan OTP dijumpai untuk emel ini. Sila klik minta kod baru.' }
  }

  // 1. Semakan Masa Luput
  if (now > record.expiresAt) {
    otpStore.delete(emailKey)
    return { valid: false, error: 'Kod OTP ini telah tamat tempoh (melebihi 10 minit). Sila minta kod baru.' }
  }

  // 2. Semakan Had Percubaan Salah (Anti-Brute Force)
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(emailKey)
    return { valid: false, error: 'Terlalu banyak percubaan kod OTP yang salah. Kod ini telah dibatalkan demi keselamatan.' }
  }

  // 3. Semakan Kesahihan Kod
  if (record.otp !== userEnteredOtp.trim()) {
    record.attempts += 1
    const baki = MAX_OTP_ATTEMPTS - record.attempts
    return { valid: false, error: `Kod OTP salah! Baki percubaan yang tinggal: ${baki}` }
  }

  // 4. Lulus -> Padam kod daripada memori (Single-use security)
  otpStore.delete(emailKey)
  return { valid: true }
}
