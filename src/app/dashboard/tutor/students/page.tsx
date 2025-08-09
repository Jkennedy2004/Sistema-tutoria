'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { TutorSidebar } from '../../../../components/dashboard/TutorSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, Users, User, Mail, Phone, Calendar, Star, Accessibility, MessageSquare } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'
import { AdvancedFilters } from '../../../../components/messaging/AdvancedFilters'

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
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})

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
      },
      filters: {
        title: 'Filtros Avanzados',
        clearAll: 'Limpiar Todo',
        apply: 'Aplicar',
        saveFilters: 'Guardar Filtros',
        savedFilters: 'Filtros Guardados',
        noResults: 'No se encontraron estudiantes',
        resultsFound: 'estudiantes de',
        loading: 'Cargando...',
        searchPlaceholder: 'Buscar estudiantes...',
        dateFrom: 'Desde',
        dateTo: 'Hasta',
        status: {
          all: 'Todos',
          available: 'Disponibles',
          busy: 'Ocupados',
          offline: 'Desconectados'
        },
        priority: {
          all: 'Todas',
          high: 'Alta',
          normal: 'Normal',
          low: 'Baja'
        },
        type: {
          all: 'Todos',
          text: 'Texto',
          file: 'Archivo',
          image: 'Imagen'
        }
      },
      messages: {
        noResults: 'No se encontraron estudiantes',
        noResultsDescription: 'Intenta ajustar los filtros para encontrar más estudiantes',
        tryDifferentFilters: 'Probar filtros diferentes'
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
      },
      filters: {
        title: 'Advanced Filters',
        clearAll: 'Clear All',
        apply: 'Apply',
        saveFilters: 'Save Filters',
        savedFilters: 'Saved Filters',
        noResults: 'No students found',
        resultsFound: 'students of',
        loading: 'Loading...',
        searchPlaceholder: 'Search students...',
        dateFrom: 'From',
        dateTo: 'To',
        status: {
          all: 'All',
          available: 'Available',
          busy: 'Busy',
          offline: 'Offline'
        },
        priority: {
          all: 'All',
          high: 'High',
          normal: 'Normal',
          low: 'Low'
        },
        type: {
          all: 'All',
          text: 'Text',
          file: 'File',
          image: 'Image'
        }
      },
      messages: {
        noResults: 'No students found',
        noResultsDescription: 'Try adjusting the filters to find more students',
        tryDifferentFilters: 'Try different filters'
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

      if (sessionsError) {
        console.error('Error loading sessions data:', sessionsError)
        return
      }

      // Obtener detalles completos de cada estudiante
      const uniqueStudents = [...new Set(sessionsData?.map(s => s.student_id))].filter(Boolean)
      
      if (uniqueStudents.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const studentsData = await Promise.all(
        uniqueStudents.map(async (studentId) => {
          // Obtener información del perfil del estudiante
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', studentId)
            .single()

          if (profileError) {
            console.error('Error loading student profile:', profileError)
            return null
          }

          // Obtener estadísticas de sesiones del estudiante
          const { data: sessionStats, error: statsError } = await supabase
            .from('session_details')
            .select('*')
            .eq('tutor_id', user.id)
            .eq('student_id', studentId)

          if (statsError) {
            console.error('Error loading session stats:', profileError)
            return null
          }

          const totalSessions = sessionStats?.length || 0
          const completedSessions = sessionStats?.filter(s => s.status === 'completed').length || 0
          const lastSession = sessionStats?.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0]?.start_time

          // Obtener materias del estudiante
          const { data: studentSubjects, error: subjectsError } = await supabase
            .from('student_subjects')
            .select(`
              subjects (
                name
              )
            `)
            .eq('student_id', studentId)
            .eq('is_active', true)

          if (subjectsError) {
            console.error('Error loading student subjects:', subjectsError)
          }

          const subjects = studentSubjects?.map(ss => (ss.subjects as any)?.name).filter(Boolean) || []

          return {
            id: studentId,
            name: profileData?.name || 'Estudiante',
            email: profileData?.email || '',
            avatar_url: profileData?.avatar_url || '',
            total_sessions: totalSessions,
            completed_sessions: completedSessions,
            average_rating: 0, // Placeholder - would need rating data
            last_session: lastSession || '',
            subjects: subjects
          }
        })
      )

      const validStudents = studentsData.filter(Boolean) as Student[]
      setStudents(validStudents)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter handlers
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters)
  }

  const handleClearFilters = () => {
    setActiveFilters({})
  }

  // Advanced filters configuration for students
  const advancedFilters = [
    {
      id: 'status',
      title: 'Estado',
      type: 'select' as const,
      icon: <User className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar estado',
      options: [
        { id: 'all', label: 'Todos los estados', value: 'all' },
        { id: 'active', label: 'Activo', value: 'active' },
        { id: 'inactive', label: 'Inactivo', value: 'inactive' },
        { id: 'new', label: 'Nuevo', value: 'new' }
      ]
    },
    {
      id: 'subject',
      title: 'Materia',
      type: 'select' as const,
      icon: <Calendar className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar materia',
      options: [
        { id: 'all', label: 'Todas las materias', value: 'all' },
        ...Array.from(new Set(students.flatMap(s => s.subjects))).map(subject => ({
          id: subject,
          label: subject,
          value: subject
        }))
      ]
    },
    {
      id: 'sessions',
      title: 'Sesiones Completadas',
      type: 'select' as const,
      icon: <Calendar className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar mínimo de sesiones',
      options: [
        { id: 'all', label: 'Cualquier cantidad', value: 'all' },
        { id: '10', label: '10+ sesiones', value: '10' },
        { id: '5', label: '5+ sesiones', value: '5' },
        { id: '1', label: '1+ sesión', value: '1' }
      ]
    },
    {
      id: 'rating',
      title: 'Calificación',
      type: 'select' as const,
      icon: <Star className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar calificación mínima',
      options: [
        { id: 'all', label: 'Cualquier calificación', value: 'all' },
        { id: '4', label: '4+ estrellas', value: '4' },
        { id: '3', label: '3+ estrellas', value: '3' },
        { id: '2', label: '2+ estrellas', value: '2' },
        { id: '1', label: '1+ estrella', value: '1' }
      ]
    },
    {
      id: 'last_activity',
      title: 'Última Actividad',
      type: 'select' as const,
      icon: <Calendar className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar período',
      options: [
        { id: 'all', label: 'Cualquier período', value: 'all' },
        { id: 'week', label: 'Última semana', value: 'week' },
        { id: 'month', label: 'Último mes', value: 'month' },
        { id: 'quarter', label: 'Último trimestre', value: 'quarter' },
        { id: 'year', label: 'Último año', value: 'year' }
      ]
    },
    {
      id: 'progress',
      title: 'Progreso',
      type: 'select' as const,
      icon: <Users className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar nivel de progreso',
      options: [
        { id: 'all', label: 'Cualquier progreso', value: 'all' },
        { id: 'beginner', label: 'Principiante', value: 'beginner' },
        { id: 'intermediate', label: 'Intermedio', value: 'intermediate' },
        { id: 'advanced', label: 'Avanzado', value: 'advanced' }
      ]
    }
  ]

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
    const sessions = students.reduce((sum, s) => sum + s.total_sessions, 0)
    const rating = students.length > 0 
      ? students.reduce((sum, s) => sum + s.average_rating, 0) / students.length 
      : 0

    return { total, active, sessions, rating }
  }

  const stats = getStats()

  const filteredStudents = students.filter(student => {
    // Basic search filter
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Advanced filters
    let matchesAdvancedFilters = true
    
    // Status filter
    if (activeFilters.status && activeFilters.status !== 'all') {
      switch (activeFilters.status) {
        case 'active':
          matchesAdvancedFilters = matchesAdvancedFilters && student.total_sessions > 0
          break
        case 'inactive':
          matchesAdvancedFilters = matchesAdvancedFilters && student.total_sessions === 0
          break
        case 'new':
          // Consider new if last session is within last 30 days
          const lastSessionDate = student.last_session ? new Date(student.last_session) : null
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          matchesAdvancedFilters = matchesAdvancedFilters && 
            (!lastSessionDate || lastSessionDate > thirtyDaysAgo)
          break
      }
    }
    
    // Subject filter
    if (activeFilters.subject && activeFilters.subject !== 'all') {
      matchesAdvancedFilters = matchesAdvancedFilters && 
        student.subjects.includes(activeFilters.subject)
    }
    
    // Sessions filter
    if (activeFilters.sessions && activeFilters.sessions !== 'all') {
      const minSessions = parseInt(activeFilters.sessions)
      matchesAdvancedFilters = matchesAdvancedFilters && 
        student.completed_sessions >= minSessions
    }
    
    // Rating filter
    if (activeFilters.rating && activeFilters.rating !== 'all') {
      const minRating = parseFloat(activeFilters.rating)
      matchesAdvancedFilters = matchesAdvancedFilters && 
        student.average_rating >= minRating
    }
    
    // Last activity filter
    if (activeFilters.last_activity && activeFilters.last_activity !== 'all') {
      const lastSessionDate = student.last_session ? new Date(student.last_session) : null
      const now = new Date()
      
      if (lastSessionDate) {
        switch (activeFilters.last_activity) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesAdvancedFilters = matchesAdvancedFilters && lastSessionDate > weekAgo
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesAdvancedFilters = matchesAdvancedFilters && lastSessionDate > monthAgo
            break
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            matchesAdvancedFilters = matchesAdvancedFilters && lastSessionDate > quarterAgo
            break
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            matchesAdvancedFilters = matchesAdvancedFilters && lastSessionDate > yearAgo
            break
        }
      } else {
        matchesAdvancedFilters = false
      }
    }
    
    // Progress filter
    if (activeFilters.progress && activeFilters.progress !== 'all') {
      const completedSessions = student.completed_sessions
      switch (activeFilters.progress) {
        case 'beginner':
          matchesAdvancedFilters = matchesAdvancedFilters && completedSessions < 5
          break
        case 'intermediate':
          matchesAdvancedFilters = matchesAdvancedFilters && completedSessions >= 5 && completedSessions < 20
          break
        case 'advanced':
          matchesAdvancedFilters = matchesAdvancedFilters && completedSessions >= 20
          break
      }
    }
    
    return matchesSearch && matchesAdvancedFilters
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

                {/* Advanced Filters */}
                <div className="mb-6">
                  <AdvancedFilters
                    filters={advancedFilters}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    resultsCount={filteredStudents.length}
                    totalCount={students.length}
                    loading={loading}
                    userType="tutor"
                    content={currentContent}
                  />
                </div>

                {/* Students List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{currentContent.title}</h3>
                  </div>
                  <div className="p-6">
                    {filteredStudents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map((student) => (
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