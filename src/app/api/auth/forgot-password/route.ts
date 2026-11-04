// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateSecureOtp } from '@/lib/otp-store'
import { sendPasswordResetOtpEmail } from '@/lib/email'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  email: z.string().trim().email('Format emel tidak sah').toLowerCase(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = requestSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Perlindungan 'User Enumeration':
    // Jangan beritahu penggodam sama ada emel wujud atau tidak
    if (!user) {
      return NextResponse.json({
        message: 'Jika emel ini berdaftar dalam sistem kami, kod OTP telah dihantar ke inbox anda.',
      })
    }

    // Jana kod OTP 6-digit
    const { otp, waitSeconds } = generateSecureOtp(email)

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
      details: `Permintaan kod OTP lupa kata laluan dihantar untuk emel: ${email}`,
      userEmail: email,
      ipAddress: clientIp,
    })

    // Hantar emel melalui Gmail SMTP
    let emailSent = false
    try {
      await sendPasswordResetOtpEmail({
        name: user.name || 'Pelanggan',
        email: user.email,
        otp,
      })
      emailSent = true
      console.log(`[EMAIL] ✅ Kod OTP berjaya dihantar ke Gmail: ${email}`)
    } catch (mailError: any) {
      console.error('[EMAIL ERROR] Gagal menghantar emel melalui SMTP:', mailError?.message || mailError)
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Kod OTP 6-digit telah berjaya dihantar ke inbox Gmail anda!'
        : 'Kod OTP telah dijana dan dihantar ke emel anda.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
