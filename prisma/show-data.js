const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n================== 👥 SENARAI USERS ==================')
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true }
  })
  console.table(users)

  console.log('\n================== ✂️ SENARAI SERVICES ==================')
  const services = await prisma.service.findMany({
    select: { id: true, name: true, price: true, duration: true }
  })
  console.table(services)

  console.log('\n================== 📅 SENARAI BOOKINGS ==================')
  const bookings = await prisma.booking.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      service: { select: { name: true } },
    }
  })
  if (bookings.length === 0) {
    console.log('Tiada booking dibuat lagi setakat ini.')
  } else {
    console.table(bookings.map(b => ({
      ID: b.id.slice(-6),
      Pelanggan: b.customer.name,
      Servis: b.service.name,
      Tarikh: b.date.toISOString().split('T')[0],
      Masa: b.startTime,
      Status: b.status,
      Harga: `RM ${b.totalPrice}`
    })))
  }
}

main().finally(() => prisma.$disconnect())
