'use client'

import { useAuth } from '../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      // Redirigir según el tipo de usuario
      if (user.userType === 'student') {
        router.push('/dashboard/student')
      } else if (user.userType === 'tutor') {
        router.push('/dashboard/tutor')
      } else {
        // Por defecto, redirigir a estudiante
        router.push('/dashboard/student')
      }
    }
  }, [user, router])

  // Mostrar loading mientras redirige
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
} 