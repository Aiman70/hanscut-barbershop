// scripts/update-hanscut-data.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function syncHanscutData() {
  console.log('====================================================')
  console.log('💈 SYNCING OFFICIAL HANSCUT BARBERSHOP DATA')
  console.log('====================================================')

  try {
    // 1. WAKTU OPERASI (BUSINESS HOURS)
    // SABTU HINGGA KHAMIS: BUKA JAM 3 PETANG - 11 MALAM (15:00 - 23:00)
    // JUMAAT (MALAM SAHAJA): 8.30 MALAM - 11 MALAM (20:30 - 23:00)
    const hanscutHours = [
      { dayOfWeek: 0, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Ahad
      { dayOfWeek: 1, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Isnin
      { dayOfWeek: 2, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Selasa
      { dayOfWeek: 3, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Rabu
      { dayOfWeek: 4, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Khamis
      { dayOfWeek: 5, openTime: '20:30', closeTime: '23:00', isClosed: false }, // Jumaat (Malam Sahaja)
      { dayOfWeek: 6, openTime: '15:00', closeTime: '23:00', isClosed: false }, // Sabtu
    ]

    console.log('[1/3] Mengemaskini Waktu Operasi Hanscut Barbershop...')
    for (const h of hanscutHours) {
      const existing = await prisma.businessHours.findFirst({
        where: { dayOfWeek: h.dayOfWeek },
      })

      if (existing) {
        await prisma.businessHours.update({
          where: { id: existing.id },
          data: {
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          },
        })
      } else {
        await prisma.businessHours.create({ data: h })
      }
    }
    console.log('✅ Waktu Operasi Hanscut Berjaya Dikemaskini!')

    // 2. NYAHAKTIFKAN SERVIS LAMA SEBELUMNYA
    console.log('[2/3] Menyusun semula senarai servis...')
    await prisma.service.updateMany({
      data: { isActive: false },
    })

    // 3. SENARAI SERVIS & HARGA RASMI HANSCUT BARBERSHOP
    const officialServices = [
      // Kategori Potongan Rambut & Cukur
      {
        name: 'Gunting Kanak-Kanak',
        description: 'Potongan rambut kemas untuk kanak-kanak (RM8 - RM10)',
        duration: 25,
        price: 10,
        isActive: true,
      },
      {
        name: 'Gunting Remaja',
        description: 'Gaya rambut moden & kemas untuk remaja (RM10 - RM15)',
        duration: 30,
        price: 12,
        isActive: true,
      },
      {
        name: 'Gunting Dewasa',
        description: 'Potongan rambut klasik, fade & modern style (RM13 - RM15)',
        duration: 30,
        price: 15,
        isActive: true,
      },
      {
        name: 'Cuci Rambut',
        description: 'Cuci rambut bersih & menyegarkan kulit kepala',
        duration: 15,
        price: 8,
        isActive: true,
      },
      {
        name: 'Gunting + Cuci (Pakej Kombo)',
        description: 'Pakej lengkap potong rambut dan cuci kepala sekaligus',
        duration: 45,
        price: 18,
        isActive: true,
      },
      {
        name: 'Cukur Jebeng / Jambang',
        description: 'Kemas atau cukur jebeng & jambang kemas rapi',
        duration: 15,
        price: 5,
        isActive: true,
      },
      {
        name: 'Cukur Rambut (Botak/Shave)',
        description: 'Cukur licin rambut kepala dengan pisau cukur & tuala',
        duration: 30,
        price: 15,
        isActive: true,
      },

      // Kategori Rawatan & Warna Rambut
      {
        name: 'Rebonding Rambut',
        description: 'Meluruskan rambut secara tahan lama & berkilau (RM60 ke atas)',
        duration: 90,
        price: 60,
        isActive: true,
      },
      {
        name: 'Keratin Treatment',
        description: 'Rawatan premium keratin untuk rambut sihat, lembut & licin',
        duration: 90,
        price: 90,
        isActive: true,
      },
      {
        name: 'Relaxing Rambut',
        description: 'Melembutkan rambut keriting agar mudah diurus (RM40 ke atas)',
        duration: 60,
        price: 40,
        isActive: true,
      },
      {
        name: 'Colour Per Head (Warna Rambut)',
        description: 'Pewarnaan rambut penuh satu kepala (RM50 ke atas)',
        duration: 60,
        price: 50,
        isActive: true,
      },
      {
        name: 'Highlight Rambut',
        description: 'Teknik highlight jalur warna moden & bergaya (RM50 ke atas)',
        duration: 60,
        price: 50,
        isActive: true,
      },
    ]

    console.log('[3/3] Memasukkan senarai servis rasmi ke pangkalan data...')
    for (const service of officialServices) {
      const existing = await prisma.service.findFirst({
        where: { name: service.name },
      })

      if (existing) {
        await prisma.service.update({
          where: { id: existing.id },
          data: service,
        })
      } else {
        await prisma.service.create({
          data: service,
        })
      }
    }

    // Rekod Audit Log jika jadual wujud
    try {
      if (prisma.auditLog) {
        await prisma.auditLog.create({
          data: {
            action: 'SYNC_OFFICIAL_PRICING_HOURS',
            category: 'SERVICE',
            details: 'Kemaskini rasmi waktu operasi Hanscut Barbershop (3pm-11pm / Jumaat 8.30pm-11pm) dan 12 senarai servis baru.',
            userEmail: 'admin@barbershop.com',
            userRole: 'ADMIN',
          },
        })
      }
    } catch (_) {}

    console.log('✅ Semua 12 Servis Rasmi Hanscut Barbershop Berjaya Dimasukkan!')
    console.log('====================================================')
    console.log('🎉 SYNC SELESAI DENGAN JAYANYA!')
    console.log('#REZEKI DI KONGSI BERSAMA')
    console.log('====================================================')
  } catch (error) {
    console.error('❌ Ralat semasa sync:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncHanscutData()
