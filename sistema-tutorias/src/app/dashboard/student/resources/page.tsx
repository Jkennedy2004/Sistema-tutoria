'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, BookOpen, Download, Eye, Search, Filter, Accessibility, User, FileText, Calendar } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'
import { AdvancedFilters } from '../../../../components/messaging/AdvancedFilters'

interface Resource {
  id: string
  title: string
  description: string
  file_url: string
  file_name: string
  file_type: string
  is_public: boolean
  created_at: string
  tutor_name: string
  subject_name: string
}

export default function StudentResourcesPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [subjects, setSubjects] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    loadResources()
    loadSubjects()
  }, [])

  const loadResources = async () => {
    try {
      if (!user?.id) return

      console.log('🔍 Cargando recursos para estudiante:', user.id)

      // Primero, obtener las materias en las que está registrado el estudiante
      const { data: studentSubjects, error: subjectsError } = await supabase
        .from('student_subjects')
        .select('subject_id')
        .eq('student_id', user.id)

      if (subjectsError) {
        console.error('Error loading student subjects:', subjectsError)
        return
      }

      const registeredSubjectIds = studentSubjects?.map(s => s.subject_id) || []
      console.log('📚 Materias registradas:', registeredSubjectIds)

      if (registeredSubjectIds.length === 0) {
        console.log('⚠️ Estudiante no tiene materias registradas')
        setResources([])
        setLoading(false)
        return
      }

      // Obtener recursos públicos que correspondan a las materias registradas
      const { data, error } = await supabase
        .from('study_resources')
        .select(`
          *,
          subjects (
            id,
            name
          ),
          profiles (
            name
          )
        `)
        .eq('is_public', true)
        .in('subject_id', registeredSubjectIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading resources:', error)
        return
      }

      console.log('📊 Recursos encontrados:', data?.length || 0)

      // Transform data
      const transformedResources = data?.map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        file_url: resource.file_url,
        file_name: resource.file_name || 'Archivo',
        file_type: resource.file_type,
        is_public: resource.is_public,
        created_at: resource.created_at,
        tutor_name: (resource.profiles as any)?.name || 'Tutor',
        subject_name: (resource.subjects as any)?.name || 'Sin materia'
      })) || []

      setResources(transformedResources)
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('name')
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

  // Advanced filters configuration for resources
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
      id: 'file_type',
      title: 'Tipo de Archivo',
      type: 'multiselect' as const,
      icon: <FileText className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar tipos',
      options: [
        { id: 'pdf', label: 'PDF', value: 'pdf' },
        { id: 'doc', label: 'Documento Word', value: 'doc' },
        { id: 'docx', label: 'Documento Word', value: 'docx' },
        { id: 'ppt', label: 'Presentación', value: 'ppt' },
        { id: 'pptx', label: 'Presentación', value: 'pptx' },
        { id: 'image', label: 'Imagen', value: 'image' },
        { id: 'video', label: 'Video', value: 'video' },
        { id: 'other', label: 'Otros', value: 'other' }
      ]
    },
    {
      id: 'tutor',
      title: 'Tutor',
      type: 'search' as const,
      icon: <User className="w-4 h-4 text-gray-500" />,
      placeholder: 'Buscar por tutor...',
      options: resources
        .filter(resource => resource.tutor_name)
        .map(resource => ({
          id: resource.id,
          label: resource.tutor_name,
          value: resource.tutor_name
        }))
    },
    {
      id: 'date',
      title: 'Fecha de Publicación',
      type: 'date' as const,
      icon: <Calendar className="w-4 h-4 text-gray-500" />
    },
    {
      id: 'size',
      title: 'Tamaño',
      type: 'select' as const,
      icon: <FileText className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar tamaño',
      options: [
        { id: 'all', label: 'Cualquier tamaño', value: 'all' },
        { id: 'small', label: 'Pequeño (< 1MB)', value: 'small' },
        { id: 'medium', label: 'Mediano (1-10MB)', value: 'medium' },
        { id: 'large', label: 'Grande (> 10MB)', value: 'large' }
      ]
    },
    {
      id: 'popularity',
      title: 'Popularidad',
      type: 'select' as const,
      icon: <Eye className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar popularidad',
      options: [
        { id: 'all', label: 'Cualquier popularidad', value: 'all' },
        { id: 'high', label: 'Muy popular', value: 'high' },
        { id: 'medium', label: 'Popular', value: 'medium' },
        { id: 'low', label: 'Poco popular', value: 'low' }
      ]
    }
  ]

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await fetch(resource.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resource.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Recursos de Estudio',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...',
      noResources: 'No hay recursos disponibles',
      searchPlaceholder: 'Buscar recursos...',
      filterAll: 'Todas las materias',
      actions: {
        download: 'Descargar',
        view: 'Ver',
        preview: 'Vista Previa'
      },
      stats: {
        total: 'Total de Recursos',
        subjects: 'Materias',
        tutors: 'Tutores'
      },
      tutor: 'Tutor',
      subject: 'Materia',
      date: 'Fecha',
      fileType: 'Tipo de archivo',
      description: 'Descripción',
      filters: {
        title: 'Filtros Avanzados',
        clearAll: 'Limpiar Todo',
        apply: 'Aplicar',
        saveFilters: 'Guardar Filtros',
        savedFilters: 'Filtros Guardados',
        noResults: 'No se encontraron recursos',
        resultsFound: 'recursos de',
        loading: 'Cargando...',
        searchPlaceholder: 'Buscar recursos...',
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
        noResults: 'No se encontraron recursos',
        noResultsDescription: 'Intenta ajustar los filtros para encontrar más recursos',
        tryDifferentFilters: 'Probar filtros diferentes'
      }
    },
    en: {
      title: 'Study Resources',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...',
      noResources: 'No resources available',
      searchPlaceholder: 'Search resources...',
      filterAll: 'All subjects',
      actions: {
        download: 'Download',
        view: 'View',
        preview: 'Preview'
      },
      stats: {
        total: 'Total Resources',
        subjects: 'Subjects',
        tutors: 'Tutors'
      },
      tutor: 'Tutor',
      subject: 'Subject',
      date: 'Date',
      fileType: 'File type',
      description: 'Description',
      filters: {
        title: 'Advanced Filters',
        clearAll: 'Clear All',
        apply: 'Apply',
        saveFilters: 'Save Filters',
        savedFilters: 'Saved Filters',
        noResults: 'No resources found',
        resultsFound: 'resources of',
        loading: 'Loading...',
        searchPlaceholder: 'Search resources...',
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
        noResults: 'No resources found',
        noResultsDescription: 'Try adjusting your filters to find more resources',
        tryDifferentFilters: 'Try different filters'
      }
    }
  }

  const currentContent = content[language]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('doc') || fileType.includes('docx')) return '📝'
    if (fileType.includes('ppt') || fileType.includes('pptx')) return '📊'
    if (fileType.includes('xls') || fileType.includes('xlsx')) return '📈'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎥'
    return '📁'
  }

  const filteredResources = resources.filter(resource => {
    // Basic search filter
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tutor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Basic filter
    const matchesFilter = filterSubject === 'all' || resource.subject_name === filterSubject
    
    // Advanced filters
    let matchesAdvancedFilters = true
    
    // Subject filter
    if (activeFilters.subject && activeFilters.subject !== 'all') {
      matchesAdvancedFilters = matchesAdvancedFilters && resource.subject_name === activeFilters.subject
    }
    
    // File type filter
    if (activeFilters.file_type && activeFilters.file_type.length > 0) {
      const resourceFileType = resource.file_type.toLowerCase()
      const matchesFileType = activeFilters.file_type.some((type: string) => {
        if (type === 'pdf') return resourceFileType.includes('pdf')
        if (type === 'doc' || type === 'docx') return resourceFileType.includes('doc')
        if (type === 'ppt' || type === 'pptx') return resourceFileType.includes('ppt')
        if (type === 'image') return resourceFileType.includes('image') || resourceFileType.includes('jpg') || resourceFileType.includes('png')
        if (type === 'video') return resourceFileType.includes('video') || resourceFileType.includes('mp4')
        if (type === 'other') return !['pdf', 'doc', 'docx', 'ppt', 'pptx', 'image', 'video'].some(t => resourceFileType.includes(t))
        return false
      })
      matchesAdvancedFilters = matchesAdvancedFilters && matchesFileType
    }
    
    // Tutor filter
    if (activeFilters.tutor) {
      matchesAdvancedFilters = matchesAdvancedFilters && 
        resource.tutor_name.toLowerCase().includes(activeFilters.tutor.toLowerCase())
    }
    
    // Date filter
    if (activeFilters.date_from || activeFilters.date_to) {
      const resourceDate = new Date(resource.created_at)
      if (activeFilters.date_from) {
        matchesAdvancedFilters = matchesAdvancedFilters && 
          resourceDate >= new Date(activeFilters.date_from)
      }
      if (activeFilters.date_to) {
        matchesAdvancedFilters = matchesAdvancedFilters && 
          resourceDate <= new Date(activeFilters.date_to)
      }
    }
    
    // Size filter (placeholder - would need file size data)
    if (activeFilters.size && activeFilters.size !== 'all') {
      // This would need file size data from the database
      // For now, we'll skip this filter
      matchesAdvancedFilters = matchesAdvancedFilters && true
    }
    
    // Popularity filter (placeholder - would need download/view data)
    if (activeFilters.popularity && activeFilters.popularity !== 'all') {
      // This would need popularity data from the database
      // For now, we'll skip this filter
      matchesAdvancedFilters = matchesAdvancedFilters && true
    }
    
    return matchesSearch && matchesFilter && matchesAdvancedFilters
  })

  const uniqueSubjects = [...new Set(resources.map(r => r.subject_name))].sort()
  const uniqueTutors = [...new Set(resources.map(r => r.tutor_name))]

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
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{currentContent.stats.total}</p>
                    <p className="text-2xl font-semibold text-gray-900">{resources.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{currentContent.stats.subjects}</p>
                    <p className="text-2xl font-semibold text-gray-900">{uniqueSubjects.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{currentContent.stats.tutors}</p>
                    <p className="text-2xl font-semibold text-gray-900">{uniqueTutors.length}</p>
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
                resultsCount={filteredResources.length}
                totalCount={resources.length}
                loading={loading}
                userType="student"
                content={{
                  filters: {
                    title: 'Filtros Avanzados',
                    clearAll: 'Limpiar Todo',
                    apply: 'Aplicar',
                    saveFilters: 'Guardar Filtros',
                    savedFilters: 'Filtros Guardados',
                    noResults: 'No se encontraron recursos',
                    resultsFound: 'recursos encontrados',
                    loading: 'Cargando...',
                    searchPlaceholder: 'Buscar recursos...',
                    dateFrom: 'Desde',
                    dateTo: 'Hasta',
                    status: {
                      all: 'Todos',
                      read: 'Leídos',
                      unread: 'No leídos',
                      sent: 'Enviados',
                      received: 'Recibidos',
                      edited: 'Editados'
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
                    noResults: 'No se encontraron recursos',
                    noResultsDescription: 'Intenta ajustar los filtros para encontrar más recursos',
                    tryDifferentFilters: 'Probar filtros diferentes'
                  }
                }}
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
            ) : resources.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'es' ? 'No tienes materias registradas' : 'You have no registered subjects'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {language === 'es' 
                    ? 'Regístrate en materias para ver los recursos de estudio disponibles' 
                    : 'Register for subjects to see available study resources'
                  }
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard/student/subjects'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {language === 'es' ? 'Registrarse en Materias' : 'Register for Subjects'}
                </button>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{currentContent.noResources}</h3>
                <p className="text-gray-500">No se encontraron recursos que coincidan con tu búsqueda</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((resource) => (
                  <div key={resource.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    {/* Resource Header */}
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="text-3xl">{getFileIcon(resource.file_type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{resource.title}</h3>
                        <p className="text-sm text-gray-500">{resource.file_name}</p>
                      </div>
                    </div>

                    {/* Resource Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{resource.tutor_name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>{resource.subject_name}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(resource.created_at)}</span>
                      </div>

                      {resource.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">{resource.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(resource)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>{currentContent.actions.download}</span>
                      </button>
                      <button
                        onClick={() => window.open(resource.file_url, '_blank')}
                        className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        title={currentContent.actions.preview}
                      >
                        <Eye className="w-4 h-4" />
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