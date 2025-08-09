'use client'

import { useAuth } from '../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, Calendar, Users, Star, TrendingUp, BookOpen, Accessibility, X } from 'lucide-react'
import { useAccessibilityContext } from '../../../lib/accessibilityContext'
import { supabase } from '../../../lib/supabase/client'

interface Session {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  tutor_name: string
  subject_name: string
}

interface StudentStats {
  total_sessions: number
  completed_sessions: number
  average_rating: number
  next_session?: Session
}

export default function StudentDashboardPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [stats, setStats] = useState<StudentStats>({
    total_sessions: 0,
    completed_sessions: 0,
    average_rating: 0
  })
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    loadStudentStats()
  }, [])

  const loadStudentStats = async () => {
    try {
      if (!user?.id) return

      // Get student sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('session_details')
        .select('*')
        .eq('student_id', user.id)
        .order('start_time', { ascending: true })

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError)
        return
      }

      const totalSessions = sessions?.length || 0
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
      const nextSession = sessions?.find(s => s.status === 'scheduled' && new Date(s.start_time) > new Date())
      
      // Calculate average rating
      const ratedSessions = sessions?.filter(s => s.student_rating && s.student_rating > 0) || []
      const averageRating = ratedSessions.length > 0 
        ? ratedSessions.reduce((sum, s) => sum + (s.student_rating || 0), 0) / ratedSessions.length
        : 0

      setStats({
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        average_rating: Math.round(averageRating * 10) / 10,
        next_session: nextSession
      })
    } catch (error) {
      console.error('Error loading student stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Dashboard Estudiante',
      welcome: '¡Bienvenido a tu Dashboard de Estudiante!',
      description: 'Aquí puedes gestionar tus tutorías, revisar tu progreso académico y acceder a recursos de estudio.',
      nextTutoring: 'Próxima Tutoría',
      noNextTutoring: 'No hay tutorías programadas',
      completedTutoring: 'Tutorías Completadas',
      totalSessions: 'Total de Sesiones',
      average: 'Promedio de Calificación',
      noRating: 'Sin calificaciones',
      recentActivity: 'Actividad Reciente',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...'
    },
    en: {
      title: 'Student Dashboard',
      welcome: 'Welcome to your Student Dashboard!',
      description: 'Here you can manage your tutoring sessions, review your academic progress and access study resources.',
      nextTutoring: 'Next Tutoring',
      noNextTutoring: 'No scheduled tutoring',
      completedTutoring: 'Completed Tutoring',
      totalSessions: 'Total Sessions',
      average: 'Average Rating',
      noRating: 'No ratings',
      recentActivity: 'Recent Activity',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...'
    }
  }

  const currentContent = content[language]

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <StudentSidebar 
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
                <div className="text-lg text-gray-600">{currentContent.loading}</div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.nextTutoring}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.next_session 
                            ? formatDateTime(stats.next_session.start_time)
                            : currentContent.noNextTutoring
                          }
                        </p>
                        {stats.next_session && (
                          <p className="text-sm text-gray-500">
                            {stats.next_session.tutor_name} - {stats.next_session.subject_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.completedTutoring}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.completed_sessions}</p>
                        <p className="text-sm text-gray-500">{currentContent.totalSessions}: {stats.total_sessions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Star className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.average}</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {stats.average_rating > 0 ? stats.average_rating : currentContent.noRating}
                        </p>
                        {stats.average_rating > 0 && (
                          <div className="flex items-center mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(stats.average_rating) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{currentContent.recentActivity}</h3>
                  </div>
                  <div className="p-6">
                    {stats.total_sessions > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm text-gray-600">
                            {stats.completed_sessions} {currentContent.completedTutoring.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm text-gray-600">
                            {stats.total_sessions - stats.completed_sessions} sesiones programadas
                          </span>
                        </div>
                        {stats.average_rating > 0 && (
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm text-gray-600">
                              Promedio de calificación: {stats.average_rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No hay actividad reciente</p>
                        <p className="text-sm text-gray-400 mt-2">Comienza buscando tutores y programando sesiones</p>
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