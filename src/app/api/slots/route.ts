// src/app/api/slots/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTimeSlots, getMalaysiaDate } from '@/lib/utils'
import { parseISO, format } from 'date-fns'

export const dynamic = 'force-dynamic'

// 💈 JADUAL OPERASI RASMI HANSCUT BARBERSHOP:
// • SABTU HINGGA KHAMIS: 3.00 PETANG - 11.00 MALAM (15:00 - 23:00)
// • JUMAAT (MALAM SAHAJA): 8.30 MALAM - 11.00 MALAM (20:30 - 23:00)
const OFFICIAL_HANSCUT_HOURS: Record<
  number,
  { openTime: string; closeTime: string; isClosed: boolean; label: string }
> = {
  0: { openTime: '15:00', closeTime: '23:00', isClosed: false, label: 'Ahad' },
  1: { openTime: '15:00', closeTime: '23:00', isClosed: false, label: 'Isnin' },
  2: { openTime: '15:00', closeTime: '23:00', isClosed: false, label: 'Selasa' },
  3: { openTime: '15:00', closeTime: '23:00', isClosed: false, label: 'Rabu' },
  4: { openTime: '15:00', closeTime: '23:00', isClosed: false, label: 'Khamis' },
  5: { openTime: '20:30', closeTime: '23:00', isClosed: false, label: 'Jumaat (Malam Sahaja)' },
  6: { openTime: '15:00', closeTime: '23:00', isClosed: false, label: 'Sabtu' },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const barberId = searchParams.get('barberId')
    const date = searchParams.get('date') // Format: "YYYY-MM-DD"
    const duration = searchParams.get('duration')

    if (!barberId || !date || !duration) {
      return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 })
    }

    const durationNum = parseInt(duration)
    if (isNaN(durationNum) || durationNum < 10 || durationNum > 360) {
      return NextResponse.json({ error: 'Parameter duration tidak sah' }, { status: 400 })
    }

    // 🛑 1. SEMAKAN PENUTUPAN KEDAI KHAS (CLOSED DATE / EMERGENCY CLOSE)
    const db = prisma as any
    const [emergencySetting, specificClosedDate] = await Promise.all([
      db.shopSettings?.findUnique({ where: { id: 'default' } }).catch(() => null),
      db.closedDate?.findUnique({ where: { date } }).catch(() => null),
    ])

    const dailyLimit = emergencySetting?.dailyQuota || 20

    // Jika admin aktifkan tutup kecemasan atau tarikh ini ditetapkan cuti khas
    if (emergencySetting?.isEmergencyClose || specificClosedDate) {
      const reason =
        specificClosedDate?.reason ||
        emergencySetting?.noticeMessage ||
        'Kedai ditutup atas urusan cuti khas / kecemasan.'
      return NextResponse.json({
        slots: [],
        isClosedToday: true,
        closeReason: reason,
        message: `⚠️ KEDAI DITUTUP: ${reason}`,
      })
    }

    // 🕒 2. WAKTU OPERASI RASMI HANSCUT BARBERSHOP
    const selectedDate = parseISO(date)
    const dayOfWeek = selectedDate.getDay()
    const hanscutSchedule = OFFICIAL_HANSCUT_HOURS[dayOfWeek] || {
      openTime: '15:00',
      closeTime: '23:00',
      isClosed: false,
      label: 'Operasi Biasa',
    }

    // 3. Semak Kuota Harian Dinamik daripada Tetapan Admin
    const startOfDay = new Date(date + 'T00:00:00.000Z')
    const endOfDay = new Date(date + 'T23:59:59.999Z')

    const totalBookingsToday = await prisma.booking.count({
      where: {
        date: { gte: startOfDay, lt: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    if (totalBookingsToday >= dailyLimit) {
      return NextResponse.json({
        slots: [],
        isClosedToday: false,
        isFull: true,
        totalBookingsToday,
        maxBookings: dailyLimit,
        message: `🔴 Kuota tempahan untuk tarikh ini telah penuh (${totalBookingsToday}/${dailyLimit} orang). Sila pilih tarikh lain.`,
      })
    }

    // 4. Jana semua slot masa bermula TEPAT waktu buka rasmi:
    // • Sabtu-Khamis: Slot pertama bermula tepat jam 15:00 (3.00 PM)
    // • Jumaat: Slot pertama bermula tepat jam 20:30 (8.30 PM)
    const BUFFER_MINUTES = 10
    const allSlots = generateTimeSlots(
      hanscutSchedule.openTime,
      hanscutSchedule.closeTime,
      durationNum,
      BUFFER_MINUTES
    )

    // 5. Semak tempahan sedia ada untuk Barber yang dipilih
    const existingBookings = await prisma.booking.findMany({
      where: {
        barberId,
        date: { gte: startOfDay, lt: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    const myNow = getMalaysiaDate()
    const todayStr = format(myNow, 'yyyy-MM-dd')
    const currentMinutes = myNow.getHours() * 60 + myNow.getMinutes()

    const slots = allSlots.map((time) => {
      const [hour, min] = time.split(':').map(Number)
      const slotStart = hour * 60 + min
      const slotEnd = slotStart + durationNum

      const isBooked = existingBookings.some((booking) => {
        const [bStartHour, bStartMin] = booking.startTime.split(':').map(Number)
        const [bEndHour, bEndMin] = booking.endTime.split(':').map(Number)
        const bookingStart = bStartHour * 60 + bStartMin
        const bookingEnd = bEndHour * 60 + bEndMin
        const bookingEndWithBuffer = bookingEnd + BUFFER_MINUTES
        // Slot tidak tersedia jika bertindih dengan masa servis + 10 minit rehat
        return slotStart < bookingEndWithBuffer && slotEnd > bookingStart
      })

      // Semakan slot lepas menggunakan zon masa Malaysia dengan 15 minit grace period
      let isPast = false
      if (date < todayStr) {
        isPast = true
      } else if (date === todayStr) {
        // Jika hari ini: slot lepas jika masa slot + 15 minit < masa sekarang di Malaysia
        isPast = (slotStart + 15) < currentMinutes
      }

      return {
        time,
        available: !isBooked && !isPast,
        isBooked,
        isPast,
      }
    })

    return NextResponse.json({
      slots,
      isClosedToday: false,
      isFull: false,
      totalBookingsToday,
      maxBookings: dailyLimit,
      operatingHours: {
        openTime: hanscutSchedule.openTime,
        closeTime: hanscutSchedule.closeTime,
        label: hanscutSchedule.label,
      },
    })
  } catch (error) {
    console.error('Slots error:', error)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
