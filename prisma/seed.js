// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Buat admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barbershop.com' },
    update: {},
    create: {
      name: 'Admin BarberShop',
      email: 'admin@barbershop.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '0123456789',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Buat barber 1 (Ali)
  const barber1Password = await bcrypt.hash('barber123', 12)
  const barber1User = await prisma.user.upsert({
    where: { email: 'ali@barbershop.com' },
    update: {},
    create: {
      name: 'Ali Hassan',
      email: 'ali@barbershop.com',
      password: barber1Password,
      role: 'BARBER',
      phone: '0111234567',
    },
  })

  await prisma.barber.upsert({
    where: { userId: barber1User.id },
    update: {},
    create: {
      userId: barber1User.id,
      bio: 'Pakar potong rambut dengan 5 tahun pengalaman',
      speciality: 'Fade & Classic Cut',
      isAvailable: true,
    },
  })

  // Buat barber 2 (Razif)
  const barber2User = await prisma.user.upsert({
    where: { email: 'razif@barbershop.com' },
    update: {},
    create: {
      name: 'Razif Aiman',
      email: 'razif@barbershop.com',
      password: barber1Password,
      role: 'BARBER',
      phone: '0129876543',
    },
  })

  await prisma.barber.upsert({
    where: { userId: barber2User.id },
    update: {},
    create: {
      userId: barber2User.id,
      bio: 'Specialist beard trim dan skin fade',
      speciality: 'Beard Trim & Skin Fade',
      isAvailable: true,
    },
  })

  console.log('✅ Barbers created: ali & razif')

  // Buat services Hanscut Barbershop
  const services = [
    { name: 'Gunting Kanak-Kanak', description: 'Potongan rambut kemas untuk kanak-kanak (RM8 - RM10)', duration: 25, price: 10, isActive: true },
    { name: 'Gunting Remaja', description: 'Gaya rambut moden & kemas untuk remaja (RM10 - RM15)', duration: 30, price: 12, isActive: true },
    { name: 'Gunting Dewasa', description: 'Potongan rambut klasik, fade & modern style (RM13 - RM15)', duration: 30, price: 15, isActive: true },
    { name: 'Cuci Rambut', description: 'Cuci rambut bersih & menyegarkan kulit kepala', duration: 15, price: 8, isActive: true },
    { name: 'Gunting + Cuci (Pakej Kombo)', description: 'Pakej lengkap potong rambut dan cuci kepala sekaligus', duration: 45, price: 18, isActive: true },
    { name: 'Cukur Jebeng / Jambang', description: 'Kemas atau cukur jebeng & jambang kemas rapi', duration: 15, price: 5, isActive: true },
    { name: 'Cukur Rambut (Botak/Shave)', description: 'Cukur licin rambut kepala dengan pisau cukur & tuala', duration: 30, price: 15, isActive: true },
    { name: 'Rebonding Rambut', description: 'Meluruskan rambut secara tahan lama & berkilau (RM60 ke atas)', duration: 90, price: 60, isActive: true },
    { name: 'Keratin Treatment', description: 'Rawatan premium keratin untuk rambut sihat, lembut & licin', duration: 90, price: 90, isActive: true },
    { name: 'Relaxing Rambut', description: 'Melembutkan rambut keriting agar mudah diurus (RM40 ke atas)', duration: 60, price: 40, isActive: true },
    { name: 'Colour Per Head (Warna Rambut)', description: 'Pewarnaan rambut penuh satu kepala (RM50 ke atas)', duration: 60, price: 50, isActive: true },
    { name: 'Highlight Rambut', description: 'Teknik highlight jalur warna moden & bergaya (RM50 ke atas)', duration: 60, price: 50, isActive: true },
  ]

  for (const service of services) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } })
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: service })
    } else {
      await prisma.service.create({ data: service })
    }
  }
  console.log('✅ Services created/updated')

  // Buat business hours (Sabtu-Khamis 3pm-11pm, Jumaat 8.30pm-11pm)
  const businessHours = [
    { dayOfWeek: 0, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Ahad
    { dayOfWeek: 1, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Isnin
    { dayOfWeek: 2, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Selasa
    { dayOfWeek: 3, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Rabu
    { dayOfWeek: 4, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Khamis
    { dayOfWeek: 5, openTime: '20:30', closeTime: '23:00', isClosed: false }, // Jumaat (Malam Sahaja)
    { dayOfWeek: 6, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Sabtu
  ]

  for (const hours of businessHours) {
    const existing = await prisma.businessHours.findFirst({ where: { dayOfWeek: hours.dayOfWeek } })
    if (existing) {
      await prisma.businessHours.update({ where: { id: existing.id }, data: hours })
    } else {
      await prisma.businessHours.create({ data: hours })
    }
  }
  console.log('✅ Business hours Hanscut Barbershop created/updated')
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
