'use client'

import { useAuth } from '../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { LogOut, User, Mail } from 'lucide-react'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Bienvenido al Dashboard
              </h2>
              
              {user && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      <strong>Nombre:</strong> {user.name || 'No especificado'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      <strong>Email:</strong> {user.email}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <strong>ID de Usuario:</strong> {user.id}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <strong>Miembro desde:</strong> {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              )}
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Funcionalidades del Dashboard
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Gestión de Tutorías</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      Programa y gestiona tus sesiones de tutoría
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Progreso Académico</h4>
                    <p className="text-green-700 text-sm mt-1">
                      Revisa tu progreso y calificaciones
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Recursos</h4>
                    <p className="text-purple-700 text-sm mt-1">
                      Accede a materiales de estudio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 