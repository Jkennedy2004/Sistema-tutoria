'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, Calendar, Clock, MapPin, Video, User, Search, Filter, Accessibility, Globe, Check, X, Star } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'

interface Session {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  session_type: string
  meeting_url?: string
  meeting_location?: string
  faculty?: string
  classroom?: string
  tutor_name: string
  tutor_email: string
  subject_name: string
  student_rating?: number
  student_review?: string
}

export default function StudentTutoringPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      if (!user?.id) return

      const { data, error } = await supabase
        .from('session_details')
        .select('*')
        .eq('student_id', user.id)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error loading sessions:', error)
        return
      }

      setSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'scheduled' })
        .eq('id', sessionId)

      if (error) {
        console.error('Error accepting session:', error)
        return
      }

      await loadSessions()
    } catch (error) {
      console.error('Error accepting session:', error)
    }
  }

  const handleRejectSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId)

      if (error) {
        console.error('Error rejecting session:', error)
        return
      }

      await loadSessions()
    } catch (error) {
      console.error('Error rejecting session:', error)
    }
  }

  const handleRateSession = async (sessionId: string, rating: number, review: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          student_rating: rating,
          student_review: review
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error rating session:', error)
        return
      }

      await loadSessions()
    } catch (error) {
      console.error('Error rating session:', error)
    }
  }

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mis Tutorías',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...',
      noSessions: 'No hay sesiones programadas',
      searchPlaceholder: 'Buscar sesiones...',
      filterAll: 'Todas',
      filterScheduled: 'Programadas',
      filterCompleted: 'Completadas',
      filterCancelled: 'Canceladas',
      status: {
        scheduled: 'Programada',
        in_progress: 'En Progreso',
        completed: 'Completada',
        cancelled: 'Cancelada'
      },
      sessionType: {
        presencial: 'Presencial',
        virtual: 'Virtual'
      },
      actions: {
        accept: 'Aceptar',
        reject: 'Rechazar',
        rate: 'Calificar',
        join: 'Unirse',
        view: 'Ver Detalles'
      },
      location: 'Ubicación',
      meeting: 'Reunión',
      tutor: 'Tutor',
      subject: 'Materia',
      duration: 'Duración',
      rating: 'Calificación',
      review: 'Reseña'
    },
    en: {
      title: 'My Tutoring',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...',
      noSessions: 'No scheduled sessions',
      searchPlaceholder: 'Search sessions...',
      filterAll: 'All',
      filterScheduled: 'Scheduled',
      filterCompleted: 'Completed',
      filterCancelled: 'Cancelled',
      status: {
        scheduled: 'Scheduled',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      sessionType: {
        presencial: 'In-Person',
        virtual: 'Virtual'
      },
      actions: {
        accept: 'Accept',
        reject: 'Reject',
        rate: 'Rate',
        join: 'Join',
        view: 'View Details'
      },
      location: 'Location',
      meeting: 'Meeting',
      tutor: 'Tutor',
      subject: 'Subject',
      duration: 'Duration',
      rating: 'Rating',
      review: 'Review'
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

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.tutor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || session.status === filter
    
    return matchesSearch && matchesFilter
  })

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

        {/* Language Indicator */}
        <div className="fixed top-4 left-4 z-40 flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-lg">
          <Globe className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {language === 'es' ? 'Español' : 'English'}
          </span>
        </div>

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
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={currentContent.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{currentContent.filterAll}</option>
                  <option value="scheduled">{currentContent.filterScheduled}</option>
                  <option value="completed">{currentContent.filterCompleted}</option>
                  <option value="cancelled">{currentContent.filterCancelled}</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">{currentContent.loading}</div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{currentContent.noSessions}</h3>
                <p className="text-gray-500">Busca tutores y programa sesiones para comenzar</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {currentContent.status[session.status as keyof typeof currentContent.status]}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {currentContent.sessionType[session.session_type as keyof typeof currentContent.sessionType]}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{session.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDateTime(session.start_time)} ({session.duration_minutes} min)
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {session.tutor_name} - {session.subject_name}
                            </span>
                          </div>
                          
                          {session.session_type === 'presencial' ? (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {session.faculty} - {session.classroom}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {session.meeting_url ? 'Enlace disponible' : 'Enlace pendiente'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Rating for completed sessions */}
                        {session.status === 'completed' && (
                          <div className="mb-4">
                            {session.student_rating ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">{currentContent.rating}:</span>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= (session.student_rating || 0) 
                                          ? 'text-yellow-400 fill-current' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                {session.student_review && (
                                  <span className="text-sm text-gray-600 ml-2">"{session.student_review}"</span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const rating = prompt('Califica la sesión (1-5):')
                                  const review = prompt('Escribe una reseña (opcional):')
                                  if (rating && parseInt(rating) >= 1 && parseInt(rating) <= 5) {
                                    handleRateSession(session.id, parseInt(rating), review || '')
                                  }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {currentContent.actions.rate}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        {session.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleAcceptSession(session.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              <span className="text-sm">{currentContent.actions.accept}</span>
                            </button>
                            <button
                              onClick={() => handleRejectSession(session.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span className="text-sm">{currentContent.actions.reject}</span>
                            </button>
                          </>
                        )}
                        
                        {session.status === 'scheduled' && session.session_type === 'virtual' && session.meeting_url && (
                          <a
                            href={session.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            <Video className="w-4 h-4" />
                            <span className="text-sm">{currentContent.actions.join}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
} 