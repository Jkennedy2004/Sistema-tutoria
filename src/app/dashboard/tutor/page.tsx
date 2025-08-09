'use client'

import { useAuth } from '../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import { TutorSidebar } from '../../../components/dashboard/TutorSidebar'
import { AccessibilityPanel } from '../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, Calendar, Users, Star, TrendingUp, BookOpen, Accessibility } from 'lucide-react'
import { useAccessibilityContext } from '../../../lib/accessibilityContext'
import { supabase } from '../../../lib/supabase/client'

interface TutorStats {
  totalSessions: number
  completedSessions: number
  totalStudents: number
  averageRating: number
  upcomingSessions: number
}

interface RecentSession {
  id: string
  student_name: string
  subject_name: string
  start_time: string
  status: string
}

export default function TutorDashboardPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [stats, setStats] = useState<TutorStats>({
    totalSessions: 0,
    completedSessions: 0,
    totalStudents: 0,
    averageRating: 0,
    upcomingSessions: 0
  })
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Dashboard Tutor',
      welcome: '¡Bienvenido a tu Dashboard de Tutor!',
      description: 'Aquí puedes gestionar tus sesiones y administrar tus estudiantes.',
      stats: {
        totalSessions: 'Total de Sesiones',
        completedSessions: 'Sesiones Completadas',
        totalStudents: 'Total de Estudiantes',
        averageRating: 'Calificación Promedio',
        upcomingSessions: 'Próximas Sesiones'
      },
      recentSessions: 'Sesiones Recientes',
      noSessions: 'No hay sesiones recientes',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...'
    },
    en: {
      title: 'Tutor Dashboard',
      welcome: 'Welcome to your Tutor Dashboard!',
      description: 'Here you can manage your sessions and manage your students.',
      stats: {
        totalSessions: 'Total Sessions',
        completedSessions: 'Completed Sessions',
        totalStudents: 'Total Students',
        averageRating: 'Average Rating',
        upcomingSessions: 'Upcoming Sessions'
      },
      recentSessions: 'Recent Sessions',
      noSessions: 'No recent sessions',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...'
    }
  }

  const currentContent = content[language]

  const handleLogout = async () => {
    await logout()
  }

  // Función para cargar estadísticas del tutor
  const loadTutorStats = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Obtener estadísticas de sesiones usando la vista session_details
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('session_details')
        .select('*')
        .eq('tutor_id', user.id)

      if (sessionsError) throw sessionsError

      // Calcular estadísticas
      const totalSessions = sessionsData?.length || 0
      const completedSessions = sessionsData?.filter(s => s.status === 'completed').length || 0
      const totalStudents = new Set(sessionsData?.map(s => s.student_id)).size
      const upcomingSessions = sessionsData?.filter(s => s.status === 'scheduled').length || 0

      // Calcular rating promedio
      const ratedSessions = sessionsData?.filter(s => s.student_rating) || []
      const averageRating = ratedSessions.length > 0 
        ? ratedSessions.reduce((sum, s) => sum + (s.student_rating || 0), 0) / ratedSessions.length
        : 0

      setStats({
        totalSessions,
        completedSessions,
        totalStudents,
        averageRating: Math.round(averageRating * 10) / 10,
        upcomingSessions
      })

      // Obtener sesiones recientes
      const { data: recentSessionsData, error: recentError } = await supabase
        .from('session_details')
        .select('id, student_name, subject_name, start_time, status')
        .eq('tutor_id', user.id)
        .order('start_time', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      setRecentSessions(recentSessionsData || [])

    } catch (error) {
      console.error('Error loading tutor stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTutorStats()
  }, [user?.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada'
      case 'scheduled':
        return 'Programada'
      case 'in_progress':
        return 'En Progreso'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Accessibility Button */}
        <button
          onClick={() => setIsAccessibilityOpen(true)}
          className="accessibility-btn"
          aria-label="Abrir panel de accesibilidad"
        >
          <Accessibility className="w-6 h-6" />
        </button>



        {/* Accessibility Panel */}
        <AccessibilityPanel 
          isOpen={isAccessibilityOpen}
          onClose={() => setIsAccessibilityOpen(false)}
        />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <TutorSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isDesktopSidebarOpen={desktopSidebarOpen}
          onToggleDesktopSidebar={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
        />

        {/* Main content */}
        <div className={`transition-all duration-300 ease-in-out ${desktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-16'}`}>
          {/* Top header */}
          <div className="sticky top-0 z-10 bg-white shadow">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  type="button"
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menú"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="ml-2 text-2xl font-bold text-gray-900">{currentContent.title}</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                  <span>{currentContent.welcomeUser}</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main className="p-4 sm:p-6 lg:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">{currentContent.loading}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {currentContent.welcome}
                  </h2>
                  <p className="text-gray-600">
                    {currentContent.description}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.totalSessions}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.totalSessions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.completedSessions}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.completedSessions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.totalStudents}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <Star className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.averageRating}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.averageRating}/5</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-pink-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-pink-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.upcomingSessions}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.upcomingSessions}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{currentContent.recentSessions}</h3>
                  </div>
                  <div className="p-6">
                    {recentSessions.length > 0 ? (
                      <div className="space-y-4">
                        {recentSessions.map((session) => (
                          <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="text-lg font-medium text-gray-900">{session.student_name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                    {getStatusText(session.status)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{session.subject_name}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(session.start_time)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{currentContent.noSessions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
} 