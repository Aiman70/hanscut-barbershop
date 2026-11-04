// scripts/restore-db.js
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ENCRYPTION_SECRET = process.env.BACKUP_KEY || process.env.NEXTAUTH_SECRET || 'BarbershopEncryptedBackupKey2026!'
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest()

function decrypt(text) {
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift(), 'hex')
  const encryptedText = Buffer.from(parts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

const targetFile = process.argv[2]
if (!targetFile) {
  console.log('Penggunaan: node scripts/restore-db.js <nama-fail-atau-path-ke-backup.enc>')
  console.log('Contoh: node scripts/restore-db.js backups/backup_2026-11-03T11-20-00.enc')
  process.exit(1)
}

const filePath = path.isAbsolute(targetFile) ? targetFile : path.join(__dirname, '..', targetFile)

if (!fs.existsSync(filePath)) {
  console.error(`❌ Fail tidak dijumpai: ${filePath}`)
  process.exit(1)
}

try {
  console.log(`🔓 Menyahsulitkan fail sandaran: ${path.basename(filePath)}...`)
  const encryptedContent = fs.readFileSync(filePath, 'utf8')
  const decryptedJson = decrypt(encryptedContent)
  const parsed = JSON.parse(decryptedJson)

  const outputDecryptedPath = filePath.replace('.enc', '_decrypted.json')
  fs.writeFileSync(outputDecryptedPath, JSON.stringify(parsed, null, 2), 'utf8')

  console.log('✅ Nyahsulit berjaya!')
  console.log(`📅 Tarikh Sandaran: ${parsed.meta.timestamp}`)
  console.log(`👥 Pengguna: ${parsed.data.users?.length || 0}`)
  console.log(`📅 Tempahan: ${parsed.data.bookings?.length || 0}`)
  console.log(`💈 Servis: ${parsed.data.services?.length || 0}`)
  console.log(`📁 Fail JSON telah diekstrak ke: ${outputDecryptedPath}`)
} catch (err) {
  console.error('❌ Gagal menyahsulit fail. Pastikan kunci enkripsi sepadan.', err.message)
}
