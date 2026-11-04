// src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { verifyAndConsumeOtp } from '@/lib/otp-store'
import { recordAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const resetSchema = z.object({
  email: z.string().trim().email('Format emel tidak sah').toLowerCase(),
  otp: z.string().trim().length(6, 'Kod OTP mestilah 6 digit'),
  newPassword: z.string().min(6, 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, otp, newPassword } = resetSchema.parse(body)

    // 1. Sahkan kod OTP
    const verification = verifyAndConsumeOtp(email, otp)
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 400 })
    }

    // 2. Cari pengguna
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Akaun pengguna tidak dijumpai' }, { status: 404 })
    }

    // 3. Enkripsi kata laluan baru menggunakan bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // 4. Kemaskini kata laluan dalam pangkalan data
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // 5. Rekod Audit Log
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'RESET_PASSWORD_SUCCESS',
      category: 'AUTH',
      details: `Kata laluan berjaya ditukar melalui pengesahan OTP Gmail untuk akaun: ${email}`,
      userId: user.id,
      userEmail: email,
      userRole: user.role,
      ipAddress: clientIp,
    })

    return NextResponse.json({
      success: true,
      message: 'Kata laluan anda telah berjaya ditukar! Sila log masuk dengan kata laluan baru.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Ralat pelayan semasa menetapkan kata laluan' }, { status: 500 })
  }
}
