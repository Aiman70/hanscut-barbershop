# BarberShop Booking System

Sistem tempahan barbershop online dibina dengan Next.js 14, PostgreSQL, dan Prisma.

## 🚀 Setup & Installation

### 1. Install Node.js
Muat turun dan install dari: https://nodejs.org (LTS version)

### 2. Install PostgreSQL
Muat turun dari: https://www.postgresql.org/download/

### 3. Clone/Setup Projek

```bash
# Masuk ke folder projek
cd barbershop-booking

# Install dependencies
npm install

# Salin environment file
cp .env.example .env
```

### 4. Setup Database

Edit fail `.env` dengan credentials PostgreSQL anda:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/barbershop_db"
NEXTAUTH_SECRET="generate-secret-dengan-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

```bash
# Generate Prisma client
npm run db:generate

# Push schema ke database
npm run db:push

# Seed data awal (admin, barbers, services)
npm run db:seed
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka browser: http://localhost:3000

---

## 👤 Akaun Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@barbershop.com | admin123 |
| Barber | ali@barbershop.com | barber123 |
| Barber | razif@barbershop.com | barber123 |

---

## 📁 Struktur Projek

```
barbershop-booking/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Data awal
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login & Register pages
│   │   ├── (customer)/    # Booking & My Appointments
│   │   ├── (admin)/       # Dashboard, Staff, Services
│   │   └── api/           # API routes
│   ├── components/
│   │   └── ui/            # UI components
│   ├── lib/
│   │   ├── auth.ts        # NextAuth config
│   │   ├── email.ts       # Email notifications
│   │   ├── prisma.ts      # Prisma client
│   │   └── utils.ts       # Helper functions
│   └── types/             # TypeScript types
└── middleware.ts           # Route protection
```

---

## ✨ Fitur

### Untuk Pelanggan
- 🔐 Daftar & log masuk
- ✂️ Pilih servis (potong rambut, beard trim, dll)
- 👨 Pilih barber pilihan
- 📅 Pilih tarikh & slot masa
- 📧 Email pengesahan automatik
- 📋 Semak & batalkan tempahan

### Untuk Admin
- 📊 Dashboard dengan statistik
- 📋 Semak & urus semua tempahan
- ✅ Sahkan / batalkan / selesaikan tempahan
- ✂️ Tambah & edit servis
- 👨‍💼 Semak senarai staff

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **Email**: Nodemailer
- **UI**: Radix UI, Lucide Icons

---

## 📧 Setup Email (Gmail)

1. Pergi ke Google Account Settings
2. Security → 2-Step Verification (aktifkan)
3. App Passwords → Jana password untuk "Mail"
4. Guna password tu dalam `.env`:

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="email-korang@gmail.com"
EMAIL_PASS="xxxx xxxx xxxx xxxx"  # App password dari Google
```
