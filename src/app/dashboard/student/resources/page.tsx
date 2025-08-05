'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, BookOpen, Download, Eye, Search, Filter, Accessibility, Globe, User, FileText, Calendar } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'

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

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    loadResources()
    loadSubjects()
  }, [])

  const loadResources = async () => {
    try {
      // Get public resources with tutor and subject information
      const { data, error } = await supabase
        .from('study_resources')
        .select(`
          *,
          tutor_subjects (
            subjects (
              name
            )
          ),
          profiles (
            name
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading resources:', error)
        return
      }

      // Transform data
      const transformedResources = data?.map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        file_url: resource.file_url,
        file_name: resource.file_name,
        file_type: resource.file_type,
        is_public: resource.is_public,
        created_at: resource.created_at,
        tutor_name: (resource.profiles as any)?.name || 'Tutor',
        subject_name: (resource.tutor_subjects as any)?.subjects?.name || 'Sin materia'
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
      description: 'Descripción'
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
      description: 'Description'
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
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tutor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterSubject === 'all' || resource.subject_name === filterSubject
    
    return matchesSearch && matchesFilter
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
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{currentContent.filterAll}</option>
                  {uniqueSubjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">{currentContent.loading}</div>
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