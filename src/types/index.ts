// src/types/index.ts
export interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'CUSTOMER' | 'ADMIN' | 'BARBER'
  createdAt: Date
}

export interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  isActive: boolean
}

export interface Barber {
  id: string
  userId: string
  bio: string | null
  speciality: string | null
  isAvailable: boolean
  user: {
    name: string | null
    email: string
    image: string | null
  }
}

export interface Booking {
  id: string
  customerId: string
  barberId: string
  serviceId: string
  date: Date
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  notes: string | null
  totalPrice: number
  customer: {
    name: string | null
    email: string
    phone: string | null
  }
  barber: {
    user: {
      name: string | null
    }
  }
  service: {
    name: string
    duration: number
  }
  createdAt: Date
}

export interface BookingFormData {
  serviceId: string
  barberId: string
  date: Date
  startTime: string
  notes?: string
}

export interface TimeSlot {
  time: string
  available: boolean
}

export interface DashboardStats {
  totalBookings: number
  todayBookings: number
  pendingBookings: number
  totalRevenue: number
  monthlyRevenue: number
}
