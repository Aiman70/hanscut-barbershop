const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function removeWaizAsBarber() {
  console.log('🔍 Mencari pengguna Waiz...')

  // Cari user bernama Waiz atau email waiz
  const waizUser = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'waiz', mode: 'insensitive' } },
        { email: { contains: 'waiz', mode: 'insensitive' } }
      ]
    },
    include: { barberProfile: true }
  })

  if (!waizUser) {
    console.log('❌ Pengguna Waiz tidak dijumpai dalam pangkalan data.')
    return
  }

  console.log(`✅ Jumpa: ${waizUser.name} (${waizUser.email})`)

  // 1. Padam rekod Barber profile
  if (waizUser.barberProfile) {
    await prisma.barber.delete({
      where: { id: waizUser.barberProfile.id }
    })
    console.log('🗑️ Rekod Barber untuk Waiz berjaya dipadamkan!')
  }

  // 2. Turunkan role User daripada BARBER kepada CUSTOMER
  await prisma.user.update({
    where: { id: waizUser.id },
    data: { role: 'CUSTOMER' }
  })
  console.log('👤 Peranan (Role) Waiz berjaya ditukar menjadi CUSTOMER biasa.')

  console.log('\n🎉 Selesai! Waiz bukan lagi seorang barber.')
}

removeWaizAsBarber()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
