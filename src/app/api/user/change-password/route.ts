// src/app/api/user/change-password/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Sila masukkan kata laluan semasa anda'),
  newPassword: z.string().min(6, 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara'),
})

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Sila log masuk terlebih dahulu' }, { status: 401 })
    }

    const body = await request.json()
    const validated = changePasswordSchema.parse(body)

    // Dapatkan data user dari database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Akaun pengguna tidak sah' }, { status: 404 })
    }

    // 🛡️ Sahkan kata laluan semasa betul
    const isPasswordValid = await bcrypt.compare(validated.currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Kata laluan semasa anda tidak tepat' }, { status: 400 })
    }

    // Enkripsi kata laluan baru
    const hashedNewPassword = await bcrypt.hash(validated.newPassword, 12)

    // Kemaskini dalam pangkalan data
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    })

    return NextResponse.json({ message: 'Kata laluan berjaya dikemaskini!' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Ralat pelayan semasa menukar kata laluan' }, { status: 500 })
  }
}
