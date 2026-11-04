// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 🛡️ SECURITY UPGRADE: In-Memory Rate Limiter (Anti-Bot Flood)
// Menyekat cubaan pendaftaran lebih daripada 5 kali per IP dalam tempoh 1 minit
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama mestilah sekurang-kurangnya 2 aksara').max(100, 'Nama terlalu panjang'),
  email: z.string().trim().email('Format email tidak sah').toLowerCase(),
  password: z.string().min(6, 'Kata laluan mestilah sekurang-kurangnya 6 aksara').max(128, 'Kata laluan terlalu panjang'),
  phone: z.string().trim().regex(/^[0-9+ -]{7,15}$/, 'Nombor telefon tidak sah').optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    // 1. Semakan Rate Limit IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
    const now = Date.now()
    const record = rateLimitMap.get(clientIp) || { count: 0, lastReset: now }

    if (now - record.lastReset > 60000) {
      // Reset kiraan selepas 1 minit
      record.count = 1
      record.lastReset = now
    } else {
      record.count += 1
    }
    rateLimitMap.set(clientIp, record)

    if (record.count > 5) {
      return NextResponse.json(
        { error: 'Terlalu banyak percubaan pendaftaran. Sila tunggu 1 minit.' },
        { status: 429 }
      )
    }

    // 2. Validasi & Sanitasi Data
    const body = await request.json()
    const validated = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email ini sudah didaftarkan.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12)

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        phone: validated.phone || null,
        role: 'CUSTOMER', // Sentiasa pastikan role dikunci kepada CUSTOMER
      },
    })

    return NextResponse.json({
      message: 'Akaun berjaya dibuat!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
