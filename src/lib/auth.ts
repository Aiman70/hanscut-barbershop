// src/lib/auth.ts
import NextAuth, { CredentialsSignin } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// 🛡️ SECURITY UPGRADE: Anti-Brute Force Protection
// Kunci akaun selama 5 minit jika gagal 5 kali berturut-turut
class AccountLockedError extends CredentialsSignin {
  code = 'account_locked'
}

interface AttemptRecord {
  count: number
  lockUntil: number
}

const loginAttempts = new Map<string, AttemptRecord>()
const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 5 * 60 * 1000 // 5 Minit

function registerFailedAttempt(emailKey: string, now: number) {
  const record = loginAttempts.get(emailKey)
  const isExpired = record && record.lockUntil > 0 && record.lockUntil <= now
  const count = (isExpired ? 0 : (record?.count || 0)) + 1

  if (count >= MAX_ATTEMPTS) {
    const lockUntil = now + LOCK_DURATION_MS
    loginAttempts.set(emailKey, { count, lockUntil })
    console.warn(`[SECURITY ⚠️] Akaun ${emailKey} disekat selama 5 minit kerana melebihi ${MAX_ATTEMPTS} kali cubaan gagal.`)
    throw new AccountLockedError()
  } else {
    loginAttempts.set(emailKey, { count, lockUntil: 0 })
    console.warn(`[SECURITY ⚠️] Percubaan log masuk gagal ${count}/${MAX_ATTEMPTS} untuk akaun: ${emailKey}`)
  }
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const emailKey = (credentials.email as string).trim().toLowerCase()
        const now = Date.now()
        const record = loginAttempts.get(emailKey)

        // 1. Semak sekiranya akaun sedang dikunci akibat brute-force
        if (record && record.lockUntil > now) {
          const remainingMinutes = Math.ceil((record.lockUntil - now) / 60000)
          console.warn(`[SECURITY 🛑] Log masuk disekat untuk ${emailKey}. Baki sekatan: ${remainingMinutes} minit.`)
          throw new AccountLockedError()
        }

        // 2. Cari pengguna dalam pangkalan data
        const user = await prisma.user.findUnique({
          where: { email: emailKey },
        })

        if (!user || !user.password) {
          registerFailedAttempt(emailKey, now)
          return null
        }

        // 3. Semak kesahihan kata laluan menggunakan bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          registerFailedAttempt(emailKey, now)
          return null
        }

        // 4. Log masuk berjaya -> Padam rekod cubaan gagal
        loginAttempts.delete(emailKey)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
      }
      return session
    },
  },
})
