import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'ADMIN' | 'BARBER' | 'CUSTOMER'
    } & DefaultSession['user']
  }

  interface User {
    role?: 'ADMIN' | 'BARBER' | 'CUSTOMER'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'ADMIN' | 'BARBER' | 'CUSTOMER'
  }
}
