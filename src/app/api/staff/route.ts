import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { recordAuditLog } from '@/lib/audit'
import { format } from 'date-fns'
import { getMalaysiaDate } from '@/lib/utils'

// Paksa Next.js sentiasa tarik data terkini dari database tanpa cache
export const dynamic = 'force-dynamic'

// 💈 Fungsi semakan waktu operasi sebenar Hanscut Barbershop
// • Sabtu hingga Khamis: 3.00 Petang (15:00) - 11.00 Malam (23:00)
// • Jumaat (Malam Sahaja): 8.30 Malam (20:30) - 11.00 Malam (23:00)
async function checkShopOperatingStatus() {
  const now = getMalaysiaDate()
  const dateStr = format(now, 'yyyy-MM-dd')
  const dayOfWeek = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const db = prisma as any
  const [settings, closedDate] = await Promise.all([
    db.shopSettings?.findUnique({ where: { id: 'default' } }).catch(() => null),
    db.closedDate?.findUnique({ where: { date: dateStr } }).catch(() => null),
  ])

  const isEmergency = !!settings?.isEmergencyClose
  const isHoliday = !!closedDate

  const isFriday = dayOfWeek === 5
  const openMinutes = isFriday ? 20 * 60 + 30 : 15 * 60 // 20:30 (Jumaat) atau 15:00 (Hari lain)
  const closeMinutes = 23 * 60 // 23:00 (11.00 PM)

  const isOutsideHours = currentMinutes < openMinutes || currentMinutes >= closeMinutes
  const isShopOperating = !isEmergency && !isHoliday && !isOutsideHours

  let reason = ''
  let statusBadge = '🟢 Kedai Beroperasi'

  if (isEmergency) {
    reason = settings?.noticeMessage || 'Kedai Ditutup Sementara (Kecemasan)'
    statusBadge = '🔴 Kedai Ditutup (Kecemasan)'
  } else if (isHoliday) {
    reason = closedDate?.reason || 'Kedai Ditutup Hari Ini (Cuti Khas)'
    statusBadge = '🔴 Kedai Ditutup (Cuti Khas)'
  } else if (isOutsideHours) {
    const nextOpen = isFriday ? '8.30 Malam' : '3.00 Petang'
    if (currentMinutes < openMinutes) {
      reason = `Di luar waktu operasi kedai (Buka jam ${nextOpen} nanti)`
      statusBadge = `🕒 Buka Jam ${nextOpen} Nanti`
    } else {
      reason = 'Kedai telah tamat waktu operasi malam ini (Tutup jam 11.00 PM)'
      statusBadge = '🌙 Kedai Ditutup Malam Ini'
    }
  }

  return {
    isShopOperating,
    isEmergency,
    isHoliday,
    isOutsideHours,
    reason,
    statusBadge,
  }
}

// 1. Ambil semua senarai barber dengan Logik Auto-Off jika kedai tidak beroperasi
export async function GET() {
  try {
    const [barbers, shopStatus] = await Promise.all([
      prisma.barber.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
            },
          },
        },
      }),
      checkShopOperatingStatus(),
    ])

    // Selaraskan status ketersediaan setiap barber:
    // Jika kedai TIDAK BEROPERASI (luar waktu 3pm-11pm / Jumaat 8.30pm-11pm / cuti kecemasan),
    // status ketersediaan staf akan AUTO-OFF secara automatik!
    const updatedBarbers = barbers.map((barber) => {
      const isAutoOff = !shopStatus.isShopOperating

      return {
        ...barber,
        // Status ketersediaan efektif (auto-off bila kedai tutup)
        isAvailable: isAutoOff ? false : barber.isAvailable,
        // Status manual asal (sama ada barber asalnya bercuti atau bertugas)
        manualAvailability: barber.isAvailable,
        // Petunjuk auto-off
        isAutoOff,
        autoOffReason: isAutoOff ? shopStatus.reason : null,
        shopStatus,
      }
    })

    return NextResponse.json(updatedBarbers)
  } catch (error) {
    console.error('Staff GET error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// 2. Tambah Barber Baru (Admin Sahaja)
const barberSchema = z.object({
  name: z.string().min(2, 'Nama mesti sekurang-kurangnya 2 aksara'),
  email: z.string().email('Email tidak sah'),
  password: z.string().min(6, 'Password mesti sekurang-kurangnya 6 aksara'),
  phone: z.string().optional(),
  speciality: z.string().optional(),
  bio: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userRole = (session?.user as { role?: string } | undefined)?.role

    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin dibenarkan menambah barber' }, { status: 403 })
    }

    const body = await request.json()
    const validated = barberSchema.parse(body)

    // Semak jika email sudah wujud
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email ini sudah didaftarkan' }, { status: 400 })
    }

    // Encrypt password barber
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    // Cipta User & Barber Profile serentak
    const newBarberUser = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        phone: validated.phone,
        role: 'BARBER',
        barberProfile: {
          create: {
            speciality: validated.speciality || 'All-Round Barber',
            bio: validated.bio || 'Professional barber',
            isAvailable: true,
          },
        },
      },
      include: {
        barberProfile: true,
      },
    })

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await recordAuditLog({
      action: 'CREATE_STAFF',
      category: 'STAFF',
      details: `Menambah akaun staff/barber baru: ${validated.name} (${validated.email}, Kepakaran: ${validated.speciality || 'All-Round'})`,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: userRole,
      ipAddress: clientIp,
    })

    return NextResponse.json({ message: 'Barber berjaya ditambah!', barber: newBarberUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Data tidak sah' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
