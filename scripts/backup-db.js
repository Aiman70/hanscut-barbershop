// scripts/backup-db.js
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Kunci Enkripsi AES-256
const ENCRYPTION_SECRET = process.env.BACKUP_KEY || process.env.NEXTAUTH_SECRET || 'BarbershopEncryptedBackupKey2026!'
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest() // 32 bytes key

function encrypt(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

async function runBackup() {
  console.log('====================================================')
  console.log('🔒 BARBERSHOP ENCRYPTED DATABASE BACKUP UTILITY')
  console.log('====================================================')
  console.log(`[1/4] Menyambung ke pangkalan data PostgreSQL...`)

  try {
    const backupData = {
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        generatedBy: 'Automated Security Backup Script',
      },
      data: {
        users: await prisma.user.findMany(),
        barbers: await prisma.barber.findMany(),
        services: await prisma.service.findMany(),
        bookings: await prisma.booking.findMany(),
        businessHours: await prisma.businessHours.findMany(),
        shopSettings: await prisma.shopSettings.findMany().catch(() => []),
        closedDates: await prisma.closedDate.findMany().catch(() => []),
        auditLogs: await prisma.auditLog ? await prisma.auditLog.findMany().catch(() => []) : [],
      },
    }

    const totalRecords = Object.values(backupData.data).reduce((acc, curr) => acc + (curr?.length || 0), 0)
    console.log(`[2/4] Ekstraksi data berjaya! Jumlah rekod: ${totalRecords} item.`)

    // Pastikan folder backups wujud
    const backupDir = path.join(__dirname, '..', 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Nama fail mengikut timestamp tempatan
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const rawJson = JSON.stringify(backupData, null, 2)

    console.log(`[3/4] Menjalankan penyulitan AES-256-CBC dengan IV rawak...`)
    const encryptedData = encrypt(rawJson)

    const backupFilePath = path.join(backupDir, `backup_${dateStr}.enc`)
    fs.writeFileSync(backupFilePath, encryptedData, 'utf8')

    console.log(`[4/4] ✅ Sandaran pangkalan data berjaya disulitkan & disimpan!`)
    console.log(`📁 Lokasi Fail: ${backupFilePath}`)
    console.log(`📊 Saiz Fail Disulitkan: ${(fs.statSync(backupFilePath).size / 1024).toFixed(2)} KB`)

    // Polisi Pengekalan (Retention Policy): Padam fail melebihi 14 hari
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.enc'))
    if (files.length > 14) {
      files.sort()
      const filesToDelete = files.slice(0, files.length - 14)
      for (const oldFile of filesToDelete) {
        fs.unlinkSync(path.join(backupDir, oldFile))
        console.log(`🧹 Auto-cleanup: Memadam fail sandaran lama (${oldFile})`)
      }
    }

    console.log('====================================================')
    console.log('🎉 Operasi sandaran selesai dengan jayanya.')
  } catch (error) {
    console.error('❌ Ralat semasa menjalankan sandaran:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runBackup()
