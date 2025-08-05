'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { TutorSidebar } from '../../../../components/dashboard/TutorSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, Users, User, Mail, Phone, Calendar, Star, Accessibility, Globe, MessageSquare } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'

interface Student {
  id: string
  name: string
  email: string
  avatar_url: string
  total_sessions: number
  completed_sessions: number
  average_rating: number
  last_session: string
  subjects: string[]
}

export default function TutorStudentsPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mis Estudiantes',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      noStudents: 'No tienes estudiantes asignados',
      loading: 'Cargando...',
      stats: {
        total: 'Total Estudiantes',
        active: 'Estudiantes Activos',
        sessions: 'Sesiones Totales',
        rating: 'Rating Promedio'
      },
      student: {
        sessions: 'sesiones',
        completed: 'completadas',
        rating: 'rating',
        lastSession: 'Última sesión',
        contact: 'Contactar',
        viewProfile: 'Ver Perfil'
      }
    },
    en: {
      title: 'My Students',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      noStudents: 'You have no assigned students',
      loading: 'Loading...',
      stats: {
        total: 'Total Students',
        active: 'Active Students',
        sessions: 'Total Sessions',
        rating: 'Average Rating'
      },
      student: {
        sessions: 'sessions',
        completed: 'completed',
        rating: 'rating',
        lastSession: 'Last session',
        contact: 'Contact',
        viewProfile: 'View Profile'
      }
    }
  }

  const currentContent = content[language]

  const handleLogout = async () => {
    await logout()
  }

  // Función para cargar estudiantes del tutor
  const loadStudents = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Obtener estudiantes únicos que han tenido sesiones con el tutor
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('session_details')
        .select('student_id, student_name, student_email')
        .eq('tutor_id', user.id)
        .not('student_id', 'is', null)

      if (sessionsError) throw sessionsError

      // Agrupar por estudiante y obtener estadísticas
      const studentMap = new Map<string, Student>()
      
      sessionsData?.forEach(session => {
        if (!studentMap.has(session.student_id)) {
          studentMap.set(session.student_id, {
            id: session.student_id,
            name: session.student_name,
            email: session.student_email,
            avatar_url: '',
            total_sessions: 0,
            completed_sessions: 0,
            average_rating: 0,
            last_session: '',
            subjects: []
          })
        }
        
        const student = studentMap.get(session.student_id)!
        student.total_sessions++
        
        // Obtener más detalles de las sesiones para cada estudiante
        loadStudentDetails(session.student_id, student)
      })

      // Convertir map a array
      const studentsArray = Array.from(studentMap.values())
      setStudents(studentsArray)

    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar detalles específicos de cada estudiante
  const loadStudentDetails = async (studentId: string, student: Student) => {
    try {
      // Obtener sesiones completadas y ratings
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('session_details')
        .select('status, student_rating, subject_name, start_time')
        .eq('tutor_id', user?.id)
        .eq('student_id', studentId)

      if (sessionsError) throw sessionsError

      const completedSessions = sessionsData?.filter(s => s.status === 'completed') || []
      const ratedSessions = sessionsData?.filter(s => s.student_rating) || []
      
      // Calcular estadísticas
      student.completed_sessions = completedSessions.length
      student.average_rating = ratedSessions.length > 0 
        ? ratedSessions.reduce((sum, s) => sum + (s.student_rating || 0), 0) / ratedSessions.length
        : 0
      
      // Obtener última sesión
      const sortedSessions = sessionsData?.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      ) || []
      student.last_session = sortedSessions[0]?.start_time || ''
      
      // Obtener materias únicas
      const subjects = new Set(sessionsData?.map(s => s.subject_name) || [])
      student.subjects = Array.from(subjects)

    } catch (error) {
      console.error('Error loading student details:', error)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [user?.id])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStats = () => {
    const total = students.length
    const active = students.filter(s => s.total_sessions > 0).length
    const totalSessions = students.reduce((sum, s) => sum + s.total_sessions, 0)
    const averageRating = students.length > 0 
      ? students.reduce((sum, s) => sum + s.average_rating, 0) / students.length
      : 0

    return { total, active, sessions: totalSessions, rating: Math.round(averageRating * 10) / 10 }
  }

  const stats = getStats()

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
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.total}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.active}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.sessions}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.sessions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Star className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.rating}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.rating}/5</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{currentContent.title}</h3>
                  </div>
                  <div className="p-6">
                    {students.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map((student) => (
                          <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                                  <p className="text-sm text-gray-600">{student.email}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{currentContent.student.sessions}:</span>
                                <span className="font-medium">{student.total_sessions}</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{currentContent.student.completed}:</span>
                                <span className="font-medium">{student.completed_sessions}</span>
                              </div>
                              
                              {student.average_rating > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">{currentContent.student.rating}:</span>
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="ml-1 font-medium">{student.average_rating.toFixed(1)}</span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{currentContent.student.lastSession}:</span>
                                <span className="font-medium">{formatDate(student.last_session)}</span>
                              </div>
                              
                              {student.subjects.length > 0 && (
                                <div className="pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Materias:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {student.subjects.slice(0, 3).map((subject, index) => (
                                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                        {subject}
                                      </span>
                                    ))}
                                    {student.subjects.length > 3 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                        +{student.subjects.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex space-x-2 pt-2">
                                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                                  <MessageSquare className="w-4 h-4" />
                                  <span>{currentContent.student.contact}</span>
                                </button>
                                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm">
                                  <Mail className="w-4 h-4" />
                                  <span>{currentContent.student.viewProfile}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">{currentContent.noStudents}</p>
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