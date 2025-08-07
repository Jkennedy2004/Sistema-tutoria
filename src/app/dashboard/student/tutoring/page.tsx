'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, Calendar, Clock, MapPin, Video, User, Search, Filter, Accessibility, Check, X, Star } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'

interface AvailableSession {
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
  notes?: string
  created_at: string
  updated_at: string
  // Tutor information
  tutor_id: string
  tutor_name: string
  tutor_email: string
  tutor_phone?: string
  tutor_location?: string
  tutor_education_level?: string
  tutor_bio?: string
  tutor_avatar_url?: string
  // Subject information
  subject_id: string
  subject_name: string
  subject_description?: string
  // Participant information
  participant_count: number
  is_joined: boolean
}

export default function StudentTutoringPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    loadAvailableSessions()
  }, [])

  const loadAvailableSessions = async () => {
    try {
      if (!user?.id) return

      const { data, error } = await supabase
        .from('available_sessions')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error loading available sessions:', error)
        return
      }

      setAvailableSessions(data || [])
    } catch (error) {
      console.error('Error loading available sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSession = async (sessionId: string) => {
    try {
      if (!user?.id) return

      // Primero verificar si ya existe un registro para este estudiante y sesión
      const { data: existingParticipant, error: checkError } = await supabase
        .from('session_participants')
        .select('id, status')
        .eq('session_id', sessionId)
        .eq('student_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // Error diferente a "no encontrado"
        console.error('Error checking existing participation:', checkError)
        alert(language === 'es' ? 'Error al verificar participación' : 'Error checking participation')
        return
      }

      let error
      if (existingParticipant) {
        // Si ya existe, actualizar el estado a 'joined'
        const { error: updateError } = await supabase
          .from('session_participants')
          .update({ 
            status: 'joined',
            joined_at: new Date().toISOString()
          })
          .eq('id', existingParticipant.id)
        error = updateError
      } else {
        // Si no existe, crear nuevo registro
        const { error: insertError } = await supabase
          .from('session_participants')
          .insert({
            session_id: sessionId,
            student_id: user.id,
            status: 'joined'
          })
        error = insertError
      }

      if (error) {
        console.error('Error joining session:', error)
        alert(language === 'es' ? 'Error al unirse a la sesión' : 'Error joining session')
        return
      }

      alert(language === 'es' ? 'Te has unido a la sesión exitosamente' : 'Successfully joined the session')
      await loadAvailableSessions()
    } catch (error) {
      console.error('Error joining session:', error)
      alert(language === 'es' ? 'Error al unirse a la sesión' : 'Error joining session')
    }
  }

  const handleLeaveSession = async (sessionId: string) => {
    try {
      if (!user?.id) return

      const { error } = await supabase
        .from('session_participants')
        .update({ status: 'left' })
        .eq('session_id', sessionId)
        .eq('student_id', user.id)

      if (error) {
        console.error('Error leaving session:', error)
        alert(language === 'es' ? 'Error al salir de la sesión' : 'Error leaving session')
        return
      }

      alert(language === 'es' ? 'Has salido de la sesión exitosamente' : 'Successfully left the session')
      await loadAvailableSessions()
    } catch (error) {
      console.error('Error leaving session:', error)
      alert(language === 'es' ? 'Error al salir de la sesión' : 'Error leaving session')
    }
  }



  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Sesiones Disponibles',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...',
      noSessions: 'No hay sesiones disponibles',
      searchPlaceholder: 'Buscar sesiones...',
      filterAll: 'Todas',
      filterVirtual: 'Virtual',
      filterPresencial: 'Presencial',
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
        join: 'Unirse',
        leave: 'Salir',
        contact: 'Contactar',
        view: 'Ver Detalles'
      },
      sessionInfo: {
        status: 'Estado',
        type: 'Tipo',
        duration: 'Duración',
        location: 'Ubicación',
        subject: 'Materia',
        tutor: 'Tutor',
        participants: 'Participantes',
        startTime: 'Hora de inicio',
        endTime: 'Hora de fin'
      },
      tutorInfo: {
        name: 'Nombre',
        email: 'Email',
        phone: 'Teléfono',
        location: 'Ubicación',
        education: 'Educación',
        bio: 'Biografía'
      },
      location: 'Ubicación',
      meeting: 'Reunión',
      tutor: 'Tutor',
      subject: 'Materia',
      duration: 'Duración'
    },
    en: {
      title: 'Available Sessions',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...',
      noSessions: 'No available sessions',
      searchPlaceholder: 'Search sessions...',
      filterAll: 'All',
      filterVirtual: 'Virtual',
      filterPresencial: 'In Person',
      status: {
        scheduled: 'Scheduled',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      sessionType: {
        presencial: 'In Person',
        virtual: 'Virtual'
      },
      actions: {
        join: 'Join',
        leave: 'Leave',
        contact: 'Contact',
        view: 'View Details'
      },
      sessionInfo: {
        status: 'Status',
        type: 'Type',
        duration: 'Duration',
        location: 'Location',
        subject: 'Subject',
        tutor: 'Tutor',
        participants: 'Participants',
        startTime: 'Start Time',
        endTime: 'End Time'
      },
      tutorInfo: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        education: 'Education',
        bio: 'Bio'
      },
      location: 'Location',
      meeting: 'Meeting',
      tutor: 'Tutor',
      subject: 'Subject',
      duration: 'Duration'
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

  const filteredSessions = availableSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.tutor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || session.session_type === filter
    
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
                  <option value="virtual">{currentContent.filterVirtual}</option>
                  <option value="presencial">{currentContent.filterPresencial}</option>
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
                    {/* Session Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {currentContent.sessionType[session.session_type as keyof typeof currentContent.sessionType]}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {session.participant_count} {currentContent.sessionInfo.participants}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{session.description}</p>
                      </div>
                      
                      {/* Join/Leave Button */}
                      <div className="ml-4">
                        {session.is_joined ? (
                          <button
                            onClick={() => handleLeaveSession(session.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            {currentContent.actions.leave}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinSession(session.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            {currentContent.actions.join}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Session Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>{currentContent.sessionInfo.startTime}:</strong> {formatDateTime(session.start_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>{currentContent.sessionInfo.endTime}:</strong> {formatDateTime(session.end_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>{currentContent.sessionInfo.duration}:</strong> {session.duration_minutes} min
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <strong>{currentContent.sessionInfo.subject}:</strong> {session.subject_name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {session.session_type === 'presencial' ? (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              <strong>{currentContent.sessionInfo.location}:</strong> {session.faculty} - {session.classroom}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Video className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              <strong>{currentContent.sessionInfo.location}:</strong> {session.meeting_url ? 'Enlace disponible' : 'Enlace pendiente'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tutor Information */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">{currentContent.tutorInfo.name}: {session.tutor_name}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              <strong>{currentContent.tutorInfo.email}:</strong> {session.tutor_email}
                            </span>
                          </div>
                          
                          {session.tutor_phone && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                <strong>{currentContent.tutorInfo.phone}:</strong> {session.tutor_phone}
                              </span>
                            </div>
                          )}
                          
                          {session.tutor_location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                <strong>{currentContent.tutorInfo.location}:</strong> {session.tutor_location}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {session.tutor_education_level && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                <strong>{currentContent.tutorInfo.education}:</strong> {session.tutor_education_level}
                              </span>
                            </div>
                          )}
                          
                          {session.tutor_bio && (
                            <div className="flex items-start space-x-2">
                              <span className="text-sm text-gray-600">
                                <strong>{currentContent.tutorInfo.bio}:</strong> {session.tutor_bio}
                              </span>
                            </div>
                          )}
                        </div>
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