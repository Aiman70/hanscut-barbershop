// src/lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

interface BookingEmailData {
  customerName: string
  customerEmail: string
  serviceName: string
  barberName: string
  date: string
  time: string
  totalPrice: number
  bookingId: string
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .details { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💈 Hanscut Barbershop</h1>
        <p>Tempahan Berjaya!</p>
      </div>
      <div class="content">
        <p>Assalamualaikum, <strong>${data.customerName}</strong>!</p>
        <p>Tempahan anda telah berjaya dibuat. Berikut adalah butiran tempahan:</p>
        
        <div class="details">
          <div class="detail-row">
            <span>ID Tempahan</span>
            <strong>#${data.bookingId.slice(-8).toUpperCase()}</strong>
          </div>
          <div class="detail-row">
            <span>Servis</span>
            <strong>${data.serviceName}</strong>
          </div>
          <div class="detail-row">
            <span>Barber</span>
            <strong>${data.barberName}</strong>
          </div>
          <div class="detail-row">
            <span>Tarikh</span>
            <strong>${data.date}</strong>
          </div>
          <div class="detail-row">
            <span>Masa</span>
            <strong>${data.time}</strong>
          </div>
          <div class="detail-row">
            <span>Jumlah</span>
            <strong>RM ${data.totalPrice.toFixed(2)}</strong>
          </div>
        </div>
        
        <p>⚠️ Sila tiba 5 minit awal. Jika perlu batalkan, sila buat 2 jam sebelum temujanji.</p>
        
        <p>Jumpa nanti! 💈</p>
      </div>
      <div class="footer">
        <p>© 2024 Hanscut Barbershop. Semua hak terpelihara.</p>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: data.customerEmail,
    subject: `✅ Tempahan Berjaya - ${data.serviceName} pada ${data.date}`,
    html,
  })
}

export async function sendBookingCancellationEmail(data: BookingEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💈 Hanscut Barbershop</h1>
        <p>Tempahan Dibatalkan</p>
      </div>
      <div class="content">
        <p>Tempahan anda (#${data.bookingId.slice(-8).toUpperCase()}) telah dibatalkan.</p>
        <p>Servis: <strong>${data.serviceName}</strong></p>
        <p>Tarikh: <strong>${data.date} ${data.time}</strong></p>
        <p>Terima kasih kerana menggunakan perkhidmatan kami.</p>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: data.customerEmail,
    subject: `❌ Tempahan Dibatalkan - ${data.serviceName}`,
    html,
  })
}

interface ResetOtpEmailData {
  name: string
  email: string
  otp: string
}

export async function sendPasswordResetOtpEmail(data: ResetOtpEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0b0f19; color: #ffffff; padding: 20px; }
        .card { background: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #1f2937, #111827); border-bottom: 1px solid #374151; padding: 32px 20px; text-align: center; }
        .logo { font-size: 28px; font-weight: 900; color: #f59e0b; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; color: #d1d5db; line-height: 1.6; }
        .otp-container { background: #030712; border: 2px dashed #f59e0b; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #fbbf24; font-family: 'Courier New', Courier, monospace; margin: 0; }
        .expiry { color: #ef4444; font-size: 13px; font-weight: bold; margin-top: 10px; }
        .alert-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #fca5a5; }
        .footer { text-align: center; padding: 24px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo">💈 Hanscut Barbershop</h1>
          <p style="color: #9ca3af; font-size: 14px; margin: 6px 0 0 0;">Pengesahan Lupa Kata Laluan</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #f3f4f6;">Assalamualaikum, <strong>${data.name || 'Pelanggan'}</strong>!</p>
          <p>Kami telah menerima permintaan untuk menetapkan semula kata laluan bagi akaun Hanscut Barbershop anda. Sila gunakan kod OTP di bawah untuk meneruskan:</p>
          
          <div class="otp-container">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 8px;">KOD OTP 6-DIGIT ANDA</p>
            <p class="otp-code">${data.otp}</p>
            <p class="expiry">⏱️ Sah selama 10 minit sahaja</p>
          </div>
          
          <div class="alert-box">
            <strong>⚠️ Penting:</strong> Jangan sesekali kongsikan kod ini kepada sesiapa termasuk pihak staf kami. Jika anda tidak meminta penetapan kata laluan ini, sila abaikan emel ini.
          </div>
          
          <p style="font-size: 14px; color: #9ca3af;">Terima kasih,<br><strong>Pasukan Keselamatan Hanscut Barbershop</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Hanscut Barbershop Booking System. Emel ini dijana secara automatik.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `Hanscut Barbershop <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: `🔐 Kod OTP Lupa Kata Laluan: ${data.otp}`,
    html,
  })
}
