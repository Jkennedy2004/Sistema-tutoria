'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, User, Star, BookOpen, MapPin, Search, Filter, Accessibility, MessageSquare, Calendar, Phone, Mail } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'
import { AdvancedFilters } from '../../../../components/messaging/AdvancedFilters'

interface Tutor {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  education_level?: string
  bio?: string
  avatar_url?: string
  total_subjects: number
  total_sessions: number
  completed_sessions: number
  average_rating: number
  subjects: string[]
}

export default function StudentTutorsPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [subjects, setSubjects] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    loadTutors()
    loadSubjects()
  }, [])

  const loadTutors = async () => {
    try {
      if (!user?.id) return

      // First, get the subjects the student is registered for
      const { data: studentSubjects, error: studentSubjectsError } = await supabase
        .from('student_subjects')
        .select(`
          subject_id,
          subjects (
            id,
            name
          )
        `)
        .eq('student_id', user.id)
        .eq('is_active', true)

      if (studentSubjectsError) {
        console.error('Error loading student subjects:', studentSubjectsError)
        return
      }

      // If student has no registered subjects, show all tutors (or empty list)
      const studentSubjectIds = studentSubjects?.map(ss => (ss.subjects as any)?.id).filter(Boolean) || []
      
      if (studentSubjectIds.length === 0) {
        console.log('Student has no registered subjects, showing all tutors')
        // You can choose to show all tutors or none - I'll show all for now
      }

      // Get tutors from tutor_stats view
      const { data: tutorStats, error: statsError } = await supabase
        .from('tutor_stats')
        .select('*')

      if (statsError) {
        console.error('Error loading tutor stats:', statsError)
        return
      }

      // Get tutor subjects - filter by student's subjects if they have any
      let tutorSubjectsQuery = supabase
        .from('tutor_subjects')
        .select(`
          tutor_id,
          subjects (
            id,
            name
          )
        `)
        .eq('is_active', true)

      if (studentSubjectIds.length > 0) {
        tutorSubjectsQuery = tutorSubjectsQuery.in('subject_id', studentSubjectIds)
      }

      const { data: tutorSubjects, error: subjectsError } = await tutorSubjectsQuery

      if (subjectsError) {
        console.error('Error loading tutor subjects:', subjectsError)
        return
      }

      // Get tutor profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'tutor')

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        return
      }

      // Combine data
      const tutorsData = tutorStats?.map(stat => {
        const profile = profiles?.find(p => p.id === stat.tutor_id)
        const tutorSubjectList = tutorSubjects?.filter(ts => ts.tutor_id === stat.tutor_id)
        const subjectNames = tutorSubjectList?.map(ts => (ts.subjects as any)?.name).filter(Boolean) || []

        return {
          id: stat.tutor_id,
          name: profile?.name || stat.tutor_name,
          email: profile?.email || stat.tutor_email,
          phone: profile?.phone,
          location: profile?.location,
          education_level: profile?.education_level,
          bio: profile?.bio,
          avatar_url: profile?.avatar_url,
          total_subjects: stat.total_subjects || 0,
          total_sessions: stat.total_sessions || 0,
          completed_sessions: stat.completed_sessions || 0,
          average_rating: stat.average_rating || 0,
          subjects: subjectNames
        }
      }).filter(tutor => tutor.subjects.length > 0) || [] // Only show tutors with matching subjects

      setTutors(tutorsData)
    } catch (error) {
      console.error('Error loading tutors:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('name')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error loading subjects:', error)
        return
      }

      setSubjects(data?.map(s => s.name) || [])
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  // Filter handlers
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters)
  }

  const handleClearFilters = () => {
    setActiveFilters({})
  }

  // Advanced filters configuration for tutors
  const advancedFilters = [
    {
      id: 'subject',
      title: 'Materia',
      type: 'select' as const,
      icon: <BookOpen className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar materia',
      options: [
        { id: 'all', label: 'Todas las materias', value: 'all' },
        ...subjects.map(subject => ({
          id: subject,
          label: subject,
          value: subject
        }))
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
      id: 'experience',
      title: 'Experiencia',
      type: 'select' as const,
      icon: <User className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar nivel de experiencia',
      options: [
        { id: 'all', label: 'Cualquier experiencia', value: 'all' },
        { id: 'expert', label: 'Experto', value: 'expert' },
        { id: 'advanced', label: 'Avanzado', value: 'advanced' },
        { id: 'intermediate', label: 'Intermedio', value: 'intermediate' },
        { id: 'beginner', label: 'Principiante', value: 'beginner' }
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
        { id: '50', label: '50+ sesiones', value: '50' },
        { id: '25', label: '25+ sesiones', value: '25' },
        { id: '10', label: '10+ sesiones', value: '10' },
        { id: '5', label: '5+ sesiones', value: '5' }
      ]
    },
    {
      id: 'location',
      title: 'Ubicación',
      type: 'search' as const,
      icon: <MapPin className="w-4 h-4 text-gray-500" />,
      placeholder: 'Buscar por ubicación...',
      options: tutors
        .filter(tutor => tutor.location)
        .map(tutor => ({
          id: tutor.id,
          label: tutor.location || '',
          value: tutor.location || ''
        }))
    },
    {
      id: 'availability',
      title: 'Disponibilidad',
      type: 'select' as const,
      icon: <Calendar className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar disponibilidad',
      options: [
        { id: 'all', label: 'Cualquier disponibilidad', value: 'all' },
        { id: 'morning', label: 'Mañana', value: 'morning' },
        { id: 'afternoon', label: 'Tarde', value: 'afternoon' },
        { id: 'evening', label: 'Noche', value: 'evening' },
        { id: 'weekend', label: 'Fin de semana', value: 'weekend' }
      ]
    }
  ]


  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Buscar Tutores',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...',
      noTutors: 'No se encontraron tutores',
      noSubjects: 'No tienes materias registradas',
      searchPlaceholder: 'Buscar tutores por nombre o materia...',
      filterAll: 'Todas las materias',

      actions: {
        contact: 'Contactar',
        requestSession: 'Solicitar Sesión',
        viewProfile: 'Ver Perfil'
      },
      stats: {
        subjects: 'Materias',
        sessions: 'Sesiones',
        completed: 'Completadas',
        rating: 'Calificación',
        noRating: 'Sin calificaciones'
      },
      location: 'Ubicación',
      education: 'Educación',
      bio: 'Biografía',
      noBio: 'Sin biografía disponible',
      filters: {
        title: 'Filtros Avanzados',
        clearAll: 'Limpiar Todo',
        apply: 'Aplicar',
        saveFilters: 'Guardar Filtros',
        savedFilters: 'Filtros Guardados',
        noResults: 'No se encontraron tutores',
        resultsFound: 'tutores de',
        loading: 'Cargando...',
        searchPlaceholder: 'Buscar tutores...',
        dateFrom: 'Desde',
        dateTo: 'Hasta',
        status: {
          all: 'Todos',
          available: 'Disponibles',
          busy: 'Ocupados',
          offline: 'Desconectados'
        },
        rating: {
          all: 'Todas',
          excellent: 'Excelente',
          good: 'Bueno',
          average: 'Promedio'
        },
        experience: {
          all: 'Todas',
          expert: 'Experto',
          advanced: 'Avanzado',
          intermediate: 'Intermedio',
          beginner: 'Principiante'
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
        noResults: 'No se encontraron tutores',
        noResultsDescription: 'Intenta ajustar los filtros para encontrar más tutores',
        tryDifferentFilters: 'Probar filtros diferentes'
      },
      registerSubjects: 'Registrarse en Materias'
    },
    en: {
      title: 'Search Tutors',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...',
      noTutors: 'No tutors found',
      noSubjects: 'You have no registered subjects',
      searchPlaceholder: 'Search tutors by name or subject...',
      filterAll: 'All subjects',

      actions: {
        contact: 'Contact',
        requestSession: 'Request Session',
        viewProfile: 'View Profile'
      },
      stats: {
        subjects: 'Subjects',
        sessions: 'Sessions',
        completed: 'Completed',
        rating: 'Rating',
        noRating: 'No ratings'
      },
      location: 'Location',
      education: 'Education',
      bio: 'Bio',
      noBio: 'No bio available',
      filters: {
        title: 'Advanced Filters',
        clearAll: 'Clear All',
        apply: 'Apply',
        saveFilters: 'Save Filters',
        savedFilters: 'Saved Filters',
        noResults: 'No tutors found',
        resultsFound: 'tutors of',
        loading: 'Loading...',
        searchPlaceholder: 'Search tutors...',
        dateFrom: 'From',
        dateTo: 'To',
        status: {
          all: 'All',
          available: 'Available',
          busy: 'Busy',
          offline: 'Offline'
        },
        rating: {
          all: 'All',
          excellent: 'Excellent',
          good: 'Good',
          average: 'Average'
        },
        experience: {
          all: 'All',
          expert: 'Expert',
          advanced: 'Advanced',
          intermediate: 'Intermediate',
          beginner: 'Beginner'
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
        noResults: 'No tutors found',
        noResultsDescription: 'Try adjusting the filters to find more tutors',
        tryDifferentFilters: 'Try different filters'
      },
      registerSubjects: 'Register for Subjects'
    }
  }

  const currentContent = content[language]

  const filteredTutors = tutors.filter(tutor => {
    // Basic search filter
    const matchesSearch = tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutor.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Basic filter
    const matchesFilter = filterSubject === 'all' || tutor.subjects.includes(filterSubject)
    
    // Advanced filters
    let matchesAdvancedFilters = true
    
    // Subject filter
    if (activeFilters.subject && activeFilters.subject !== 'all') {
      matchesAdvancedFilters = matchesAdvancedFilters && tutor.subjects.includes(activeFilters.subject)
    }
    
    // Rating filter
    if (activeFilters.rating && activeFilters.rating !== 'all') {
      const minRating = parseFloat(activeFilters.rating)
      matchesAdvancedFilters = matchesAdvancedFilters && tutor.average_rating >= minRating
    }
    
    // Experience filter (based on completed sessions)
    if (activeFilters.experience && activeFilters.experience !== 'all') {
      const sessionCount = tutor.completed_sessions
      switch (activeFilters.experience) {
        case 'expert':
          matchesAdvancedFilters = matchesAdvancedFilters && sessionCount >= 100
          break
        case 'advanced':
          matchesAdvancedFilters = matchesAdvancedFilters && sessionCount >= 50
          break
        case 'intermediate':
          matchesAdvancedFilters = matchesAdvancedFilters && sessionCount >= 20
          break
        case 'beginner':
          matchesAdvancedFilters = matchesAdvancedFilters && sessionCount >= 5
          break
      }
    }
    
    // Sessions filter
    if (activeFilters.sessions && activeFilters.sessions !== 'all') {
      const minSessions = parseInt(activeFilters.sessions)
      matchesAdvancedFilters = matchesAdvancedFilters && tutor.completed_sessions >= minSessions
    }
    
    // Location filter
    if (activeFilters.location) {
      matchesAdvancedFilters = matchesAdvancedFilters && 
        tutor.location?.toLowerCase().includes(activeFilters.location.toLowerCase())
    }
    
    // Availability filter (placeholder - would need availability data)
    if (activeFilters.availability && activeFilters.availability !== 'all') {
      // This would need availability data from the database
      // For now, we'll skip this filter
      matchesAdvancedFilters = matchesAdvancedFilters && true
    }
    
    return matchesSearch && matchesFilter && matchesAdvancedFilters
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
            {/* Advanced Filters */}
            <div className="mb-6">
              <AdvancedFilters
                filters={advancedFilters}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                resultsCount={filteredTutors.length}
                totalCount={tutors.length}
                loading={loading}
                userType="student"
                content={currentContent}
              />
            </div>

            {/* Basic Search */}
            <div className="mb-6">
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

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">{currentContent.loading}</div>
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="text-center py-12">
                {subjects.length === 0 ? (
                  <>
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{currentContent.noSubjects}</h3>
                                         <p className="text-gray-500 mb-4">
                       {language === 'es' 
                         ? 'Ve a "Mis Materias" en el sidebar para registrarte en materias' 
                         : 'Go to "My Subjects" in the sidebar to register for subjects'
                       }
                     </p>
                     <Link
                       href="/dashboard/student/subjects"
                       className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block"
                     >
                       {currentContent.registerSubjects}
                     </Link>
                  </>
                ) : (
                  <>
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{currentContent.noTutors}</h3>
                    <p className="text-gray-500">Intenta ajustar tus filtros de búsqueda</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTutors.map((tutor) => (
                  <div key={tutor.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    {/* Tutor Header */}
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {tutor.avatar_url ? (
                          <img 
                            src={tutor.avatar_url} 
                            alt={tutor.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{tutor.name}</h3>
                        <div className="flex items-center space-x-1 mt-1">
                          {tutor.average_rating > 0 ? (
                            <>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= Math.round(tutor.average_rating) 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-600 ml-1">
                                ({tutor.average_rating.toFixed(1)})
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">{currentContent.stats.noRating}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tutor Info */}
                    <div className="space-y-3 mb-4">
                      {tutor.location && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{tutor.location}</span>
                        </div>
                      )}
                      
                      {tutor.education_level && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <BookOpen className="w-4 h-4" />
                          <span>{tutor.education_level}</span>
                        </div>
                      )}

                      {tutor.bio && (
                        <p className="text-sm text-gray-600 line-clamp-3">{tutor.bio}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{tutor.total_subjects}</div>
                        <div className="text-xs text-gray-500">{currentContent.stats.subjects}</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{tutor.total_sessions}</div>
                        <div className="text-xs text-gray-500">{currentContent.stats.sessions}</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{tutor.completed_sessions}</div>
                        <div className="text-xs text-gray-500">{currentContent.stats.completed}</div>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{currentContent.stats.subjects}:</h4>
                      <div className="flex flex-wrap gap-1">
                        {tutor.subjects.slice(0, 3).map((subject) => (
                          <span
                            key={subject}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {subject}
                          </span>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{tutor.subjects.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Navigate to request session page
                          window.location.href = `/dashboard/student/request-session?tutor=${tutor.id}`
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{currentContent.actions.requestSession}</span>
                      </button>
                      <button
                        onClick={() => {
                          // Open contact modal or navigate to messages
                          window.location.href = `/dashboard/student/messages?tutor=${tutor.id}`
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        title={currentContent.actions.contact}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
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