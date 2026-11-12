// src/lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Hantar emel menggunakan Resend API (HTTPS) sebagai keutamaan utama kerana
 * sangat pantas dan kalis sekatan pelayan serverless Vercel.
 * Jika Resend tidak dikonfigurasi, sistem akan fallback ke Nodemailer SMTP secara automatik.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY

  // 1. Cuba hantar melalui Resend API (HTTPS)
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'Hanscut Barbershop <onboarding@resend.dev>'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log(`[RESEND] ✅ Emel berjaya dihantar ke ${to} (ID: ${data?.id})`)
        return { success: true, provider: 'resend', id: data?.id }
      } else {
        const errText = await res.text()
        console.warn(`[RESEND WARNING] Resend HTTP ${res.status}: ${errText}`)
      }
    } catch (resendErr: any) {
      console.warn('[RESEND ERROR] Gagal hantar via Resend, mencuba Nodemailer:', resendErr?.message)
    }
  }

  // 2. Fallback kepada Nodemailer SMTP jika ada konfigurasi
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `Hanscut Barbershop <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      })
      console.log(`[NODEMAILER] ✅ Emel berjaya dihantar ke ${to} melalui SMTP`)
      return { success: true, provider: 'nodemailer' }
    } catch (smtpErr: any) {
      console.error('[NODEMAILER ERROR] Gagal melalui SMTP:', smtpErr?.message)
      throw smtpErr
    }
  }

  console.warn('[EMAIL] Tiada konfigurasi emel aktif yang berjaya dihantar.')
  return { success: false }
}

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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0c; color: #f4f4f5; padding: 20px; }
        .card { background: #121215; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px; }
        .header { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 24px; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: 800; color: #f59e0b; margin: 0; }
        .details { background: #18181c; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.05); }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .price { color: #f59e0b; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; padding-top: 24px; color: #71717a; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo">💈 Hanscut Barbershop</h1>
          <p style="color: #22c55e; font-weight: 600; margin-top: 8px;">✅ Tempahan Disahkan</p>
        </div>
        <p>Assalamualaikum, <strong>${data.customerName}</strong>!</p>
        <p>Tempahan anda telah direkodkan. Berikut adalah butiran temujanji anda:</p>
        
        <div class="details">
          <div class="detail-row">
            <span style="color: #a1a1aa;">ID Tempahan</span>
            <strong>#${data.bookingId.slice(-8).toUpperCase()}</strong>
          </div>
          <div class="detail-row">
            <span style="color: #a1a1aa;">Servis</span>
            <strong>${data.serviceName}</strong>
          </div>
          <div class="detail-row">
            <span style="color: #a1a1aa;">Barber</span>
            <strong>${data.barberName}</strong>
          </div>
          <div class="detail-row">
            <span style="color: #a1a1aa;">Tarikh</span>
            <strong>${data.date}</strong>
          </div>
          <div class="detail-row">
            <span style="color: #a1a1aa;">Masa</span>
            <strong>${data.time}</strong>
          </div>
          <div class="detail-row">
            <span style="color: #a1a1aa;">Jumlah Bayaran</span>
            <span class="price">RM ${data.totalPrice.toFixed(2)}</span>
          </div>
        </div>
        
        <p style="font-size: 13px; color: #a1a1aa;">⚠️ Sila tiba 5 minit sebelum masa slot anda. Terima kasih atas sokongan anda!</p>
        <div class="footer">
          <p>© 2026 Hanscut Barbershop. Semua hak terpelihara.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to: data.customerEmail,
    subject: `✅ Tempahan Berjaya: ${data.serviceName} (${data.date})`,
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0c; color: #f4f4f5; padding: 20px; }
        .card { background: #121215; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px; }
        .header { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 24px; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: 800; color: #ef4444; margin: 0; }
        .footer { text-align: center; padding-top: 24px; color: #71717a; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo">💈 Hanscut Barbershop</h1>
          <p style="color: #ef4444; font-weight: 600; margin-top: 8px;">Tempahan Dibatalkan</p>
        </div>
        <p>Tempahan anda (<strong>#${data.bookingId.slice(-8).toUpperCase()}</strong>) telah dibatalkan.</p>
        <p>Servis: <strong>${data.serviceName}</strong><br>Tarikh: <strong>${data.date} jam ${data.time}</strong></p>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 20px;">Anda boleh membuat tempahan baharu pada bila-bila masa melalui laman web kami.</p>
        <div class="footer">
          <p>© 2026 Hanscut Barbershop.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to: data.customerEmail,
    subject: `❌ Tempahan Dibatalkan: #${data.bookingId.slice(-8).toUpperCase()}`,
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0a0a0c; color: #f4f4f5; padding: 20px; }
        .card { background: #121215; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; }
        .header { background: #18181c; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 28px 20px; text-align: center; }
        .logo { font-size: 26px; font-weight: 900; color: #f59e0b; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; color: #d4d4d8; line-height: 1.6; }
        .otp-container { background: #0a0a0c; border: 2px dashed #f59e0b; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #fbbf24; font-family: 'Courier New', Courier, monospace; margin: 0; }
        .expiry { color: #f59e0b; font-size: 12px; font-weight: 600; margin-top: 10px; }
        .alert-box { background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #fbbf24; }
        .footer { text-align: center; padding: 20px; color: #71717a; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo">💈 Hanscut Barbershop</h1>
          <p style="color: #a1a1aa; font-size: 13px; margin: 6px 0 0 0;">Pengesahan Lupa Kata Laluan</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; color: #ffffff;">Assalamualaikum, <strong>${data.name || 'Pelanggan'}</strong>!</p>
          <p>Kami telah menerima permintaan untuk menetapkan semula kata laluan bagi akaun Hanscut Barbershop anda. Sila gunakan kod OTP di bawah untuk meneruskan:</p>
          
          <div class="otp-container">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #a1a1aa; margin-bottom: 8px;">KOD OTP 6-DIGIT ANDA</p>
            <p class="otp-code">${data.otp}</p>
            <p class="expiry">⏱️ Sah selama 10 minit sahaja</p>
          </div>
          
          <div class="alert-box">
            <strong>⚠️ Penting:</strong> Jangan kongsikan kod ini kepada sesiapa termasuk pihak staf kami. Jika anda tidak meminta penetapan ini, sila abaikan emel ini.
          </div>
          
          <p style="font-size: 13px; color: #a1a1aa; margin-top: 24px;">Terima kasih,<br><strong style="color: #ffffff;">Pasukan Hanscut Barbershop</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Hanscut Barbershop Booking System.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to: data.email,
    subject: `🔐 Kod OTP Lupa Kata Laluan: ${data.otp}`,
    html,
  })
}
