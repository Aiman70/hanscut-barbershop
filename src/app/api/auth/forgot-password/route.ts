// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateSecureOtp } from '@/lib/otp-store'
import { sendPasswordResetOtpEmail } from '@/lib/email'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  email: z.string().trim().min(3, 'Sila masukkan emel atau nombor telefon yang sah'),
})

// Helper untuk lindungi privasi emel (contoh: aiman@gmail.com -> a***n@gmail.com)
function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  if (user.length <= 2) return `${user[0]}*@${domain}`
  return `${user[0]}${'*'.repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}@${domain}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email: inputIdentifier } = requestSchema.parse(body)

    let user = null
    const isEmail = inputIdentifier.includes('@')

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: inputIdentifier.toLowerCase() },
      })
    } else {
      // Input ialah nombor telefon
      const cleanPhone = inputIdentifier.replace(/[\s\-\+]/g, '')
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: `+6${cleanPhone}` },
            { phone: `6${cleanPhone}` },
            { phone: cleanPhone.startsWith('6') ? cleanPhone.slice(1) : cleanPhone },
            { phone: cleanPhone.startsWith('0') ? `+60${cleanPhone.slice(1)}` : cleanPhone },
            { phone: cleanPhone.startsWith('60') ? `+${cleanPhone}` : cleanPhone },
          ],
        },
      })
    }

    // Perlindungan 'User Enumeration':
    // Jangan buka ruang godam, tetapi berikan maklum balas yang selamat
    if (!user || !user.email) {
      return NextResponse.json({
        success: true,
        message: 'Jika akaun ini berdaftar dalam sistem kami, kod OTP telah dihantar ke emel anda.',
      })
    }

    const targetEmail = user.email.toLowerCase()

    // Jana kod OTP 6-digit & simpan dalam PostgreSQL (Neon DB)
    const { otp, waitSeconds } = await generateSecureOtp(targetEmail)

    if (waitSeconds) {
      return NextResponse.json(
        { error: `Sila tunggu ${waitSeconds} saat sebelum meminta kod OTP baru.` },
        { status: 429 }
      )
    }

    // Rekod Audit Log
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'REQUEST_PASSWORD_RESET',
      category: 'AUTH',
      details: `Permintaan kod OTP lupa kata laluan untuk akaun: ${targetEmail}`,
      userEmail: targetEmail,
      ipAddress: clientIp,
    })

    // Hantar emel melalui Resend (atau fallback SMTP)
    try {
      await sendPasswordResetOtpEmail({
        name: user.name || 'Pelanggan',
        email: targetEmail,
        otp,
      })
      console.log(`[EMAIL] ✅ Kod OTP berjaya dihantar ke: ${targetEmail}`)
    } catch (mailError: any) {
      console.error('[EMAIL ERROR] Gagal menghantar emel:', mailError?.message || mailError)
    }

    const masked = maskEmail(targetEmail)

    return NextResponse.json({
      success: true,
      email: targetEmail, // Memudahkan frontend meneruskan langkah 2 pengesahan
      maskedEmail: masked,
      message: `Kod OTP 6-digit telah dihantar ke emel: ${masked}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
