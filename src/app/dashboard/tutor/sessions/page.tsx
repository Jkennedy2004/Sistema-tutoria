'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { TutorSidebar } from '../../../../components/dashboard/TutorSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, Calendar, Clock, User, MapPin, Plus, Filter, Search, Star, Edit, Trash2, Video, Building, Home, BookOpen, FileText, LogOut, Accessibility, Globe } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'
import Link from 'next/link'

interface Session {
  id: string
  student_name: string | null
  subject_name: string
  subject_id: string
  title: string
  description: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  meeting_url: string
  meeting_location: string
  session_type: 'presencial' | 'virtual'
  faculty: string
  classroom: string
  notes: string
  student_rating: number
  student_review: string
}

interface TutorSubject {
  id: string
  subject_id: string
  subject_name: string
}

export default function TutorSessionsPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [sessions, setSessions] = useState<Session[]>([])
  const [tutorSubjects, setTutorSubjects] = useState<TutorSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  
  // Form states
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [sessionType, setSessionType] = useState<'presencial' | 'virtual'>('presencial')
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [duration, setDuration] = useState<string>('60')
  
  // Presencial fields
  const [faculty, setFaculty] = useState<string>('')
  const [classroom, setClassroom] = useState<string>('')
  
  // Virtual fields
  const [meetingUrl, setMeetingUrl] = useState<string>('')

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mis Sesiones',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      addSession: 'Agregar Sesión',
      editSession: 'Editar Sesión',
      stats: {
        total: 'Total Sesiones',
        completed: 'Completadas',
        scheduled: 'Programadas',
        cancelled: 'Canceladas'
      },
      sessions: 'Sesiones de Tutoría',
      noSessions: 'No hay sesiones disponibles',
      loading: 'Cargando...',
      filters: {
        all: 'Todas',
        scheduled: 'Programadas',
        inProgress: 'En Progreso',
        completed: 'Completadas',
        cancelled: 'Canceladas'
      },
      search: 'Buscar sesiones...',
      actions: {
        join: 'Unirse',
        start: 'Iniciar',
        cancel: 'Cancelar',
        complete: 'Completar',
        viewDetails: 'Ver Detalles',
        addNotes: 'Agregar Notas',
        edit: 'Editar',
        delete: 'Eliminar',
        save: 'Guardar'
      },
      form: {
        selectSubject: 'Seleccionar materia',
        title: 'Título de la sesión',
        description: 'Descripción',
        sessionType: 'Tipo de sesión',
        presencial: 'Presencial',
        virtual: 'Virtual',
        date: 'Fecha',
        time: 'Hora',
        duration: 'Duración (minutos)',
        faculty: 'Facultad',
        classroom: 'Aula',
        meetingUrl: 'URL de la reunión',
        save: 'Guardar',
        cancel: 'Cancelar'
      },
      messages: {
        sessionCreated: 'Sesión creada correctamente',
        sessionUpdated: 'Sesión actualizada correctamente',
        errorCreating: 'Error al crear la sesión',
        errorUpdating: 'Error al actualizar la sesión',
        confirmDelete: '¿Estás seguro de que quieres eliminar esta sesión?'
      }
    },
    en: {
      title: 'My Sessions',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      addSession: 'Add Session',
      editSession: 'Edit Session',
      stats: {
        total: 'Total Sessions',
        completed: 'Completed',
        scheduled: 'Scheduled',
        cancelled: 'Cancelled'
      },
      sessions: 'Tutoring Sessions',
      noSessions: 'No sessions available',
      loading: 'Loading...',
      filters: {
        all: 'All',
        scheduled: 'Scheduled',
        inProgress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      search: 'Search sessions...',
      actions: {
        join: 'Join',
        start: 'Start',
        cancel: 'Cancel',
        complete: 'Complete',
        viewDetails: 'View Details',
        addNotes: 'Add Notes',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save'
      },
      form: {
        selectSubject: 'Select subject',
        title: 'Session title',
        description: 'Description',
        sessionType: 'Session type',
        presencial: 'In-person',
        virtual: 'Virtual',
        date: 'Date',
        time: 'Time',
        duration: 'Duration (minutes)',
        faculty: 'Faculty',
        classroom: 'Classroom',
        meetingUrl: 'Meeting URL',
        save: 'Save',
        cancel: 'Cancel'
      },
      messages: {
        sessionCreated: 'Session created successfully',
        sessionUpdated: 'Session updated successfully',
        errorCreating: 'Error creating session',
        errorUpdating: 'Error updating session',
        confirmDelete: 'Are you sure you want to delete this session?'
      }
    }
  }

  const currentContent = content[language]

  const handleLogout = async () => {
    await logout()
  }

  // Función para cargar sesiones del tutor
  const loadSessions = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      let query = supabase
        .from('session_details')
        .select('*')
        .eq('tutor_id', user.id)
        .order('start_time', { ascending: false })

      // Aplicar filtros
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      // Filtrar por término de búsqueda
      let filteredData = data || []
      if (searchTerm) {
        filteredData = filteredData.filter(session =>
          session.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setSessions(filteredData)

    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar materias del tutor
  const loadTutorSubjects = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('tutor_subjects')
        .select(`
          id,
          subject_id,
          subjects (
            id,
            name
          )
        `)
        .eq('tutor_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      const transformedData = data?.map((item: any) => ({
        id: item.id,
        subject_id: item.subject_id,
        subject_name: item.subjects.name
      })) || []

      setTutorSubjects(transformedData)
    } catch (error) {
      console.error('Error loading tutor subjects:', error)
    }
  }

  useEffect(() => {
    loadSessions()
    loadTutorSubjects()
  }, [user?.id, filter, searchTerm])

  // Función para abrir modal de edición
  const handleEditSession = (session: Session) => {
    setEditingSession(session)
    setSelectedSubject(session.subject_id)
    setTitle(session.title)
    setDescription(session.description || '')
    setSessionType(session.session_type || 'presencial')
    
    // Parsear fecha y hora
    const sessionDate = new Date(session.start_time)
    setDate(sessionDate.toISOString().split('T')[0])
    setTime(sessionDate.toTimeString().slice(0, 5))
    setDuration(session.duration_minutes.toString())
    
    // Campos específicos del tipo
    if (session.session_type === 'presencial') {
      setFaculty(session.faculty || '')
      setClassroom(session.classroom || '')
      setMeetingUrl('')
    } else {
      setMeetingUrl(session.meeting_url || '')
      setFaculty('')
      setClassroom('')
    }
    
    setShowEditModal(true)
  }

  // Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingSession(null)
    setSelectedSubject('')
    setTitle('')
    setDescription('')
    setSessionType('presencial')
    setDate('')
    setTime('')
    setDuration('60')
    setFaculty('')
    setClassroom('')
    setMeetingUrl('')
  }

  // Función para guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editingSession || !selectedSubject || !title || !date || !time || !duration) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    try {
      const startTime = new Date(`${date}T${time}`)
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000)

      const updateData: any = {
        subject_id: selectedSubject,
        title: title,
        description: description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: parseInt(duration),
        session_type: sessionType,
        updated_at: new Date().toISOString()
      }

      // Agregar campos específicos según el tipo
      if (sessionType === 'presencial') {
        updateData.faculty = faculty
        updateData.classroom = classroom
        updateData.meeting_url = null
      } else {
        updateData.meeting_url = meetingUrl
        updateData.faculty = null
        updateData.classroom = null
      }

      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', editingSession.id)

      if (error) {
        console.error('Error updating session:', error)
        alert(currentContent.messages.errorUpdating)
        return
      }

      alert(currentContent.messages.sessionUpdated)
      handleCloseEditModal()
      await loadSessions()

    } catch (error) {
      console.error('Error in handleSaveEdit:', error)
      alert(currentContent.messages.errorUpdating)
    }
  }

  // Función para agregar sesión
  const handleAddSession = async () => {
    if (!selectedSubject || !title || !date || !time || !duration) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    if (sessionType === 'presencial' && (!faculty || !classroom)) {
      alert('Para sesiones presenciales, debes especificar facultad y aula')
      return
    }

    if (sessionType === 'virtual' && !meetingUrl) {
      alert('Para sesiones virtuales, debes especificar la URL de la reunión')
      return
    }

    try {
      const startTime = new Date(`${date}T${time}`)
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000)

      const sessionData: any = {
        tutor_id: user?.id,
        subject_id: selectedSubject,
        title: title,
        description: description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: parseInt(duration),
        status: 'scheduled',
        session_type: sessionType
      }

      // Agregar campos específicos según el tipo
      if (sessionType === 'presencial') {
        sessionData.faculty = faculty
        sessionData.classroom = classroom
      } else {
        sessionData.meeting_url = meetingUrl
      }

      const { error } = await supabase
        .from('sessions')
        .insert(sessionData)

      if (error) {
        console.error('Error creating session:', error)
        alert(currentContent.messages.errorCreating)
        return
      }

      alert(currentContent.messages.sessionCreated)
      setShowAddModal(false)
      // Limpiar formulario
      setSelectedSubject('')
      setTitle('')
      setDescription('')
      setSessionType('presencial')
      setDate('')
      setTime('')
      setDuration('60')
      setFaculty('')
      setClassroom('')
      setMeetingUrl('')
      await loadSessions()

    } catch (error) {
      console.error('Error in handleAddSession:', error)
      alert(currentContent.messages.errorCreating)
    }
  }

  // Función para eliminar sesión
  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm(currentContent.messages.confirmDelete)) {
      try {
        const { error } = await supabase
          .from('sessions')
          .delete()
          .eq('id', sessionId)

        if (error) {
          console.error('Error deleting session:', error)
        } else {
          setSessions(sessions.filter(session => session.id !== sessionId))
        }
      } catch (error) {
        console.error('Error deleting session:', error)
      }
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)

      if (error) {
        console.error('Error completing session:', error)
      } else {
        setSessions(sessions.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'completed' }
            : session
        ))
      }
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const handleCancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId)

      if (error) {
        console.error('Error cancelling session:', error)
      } else {
        setSessions(sessions.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'cancelled' }
            : session
        ))
      }
    } catch (error) {
      console.error('Error cancelling session:', error)
    }
  }

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

  const getSessionStats = () => {
    const total = sessions.length
    const completed = sessions.filter(s => s.status === 'completed').length
    const scheduled = sessions.filter(s => s.status === 'scheduled').length
    const cancelled = sessions.filter(s => s.status === 'cancelled').length

    return { total, completed, scheduled, cancelled }
  }

  const stats = getSessionStats()

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
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  aria-label={currentContent.addSession}
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentContent.addSession}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
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
                        <Calendar className="w-6 h-6 text-blue-600" />
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
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.completed}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.scheduled}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.scheduled}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.cancelled}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.cancelled}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder={currentContent.search}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="all">{currentContent.filters.all}</option>
                        <option value="scheduled">{currentContent.filters.scheduled}</option>
                        <option value="in_progress">{currentContent.filters.inProgress}</option>
                        <option value="completed">{currentContent.filters.completed}</option>
                        <option value="cancelled">{currentContent.filters.cancelled}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sessions List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{currentContent.sessions}</h3>
                  </div>
                  <div className="p-6">
                    {sessions.length > 0 ? (
                      <div className="space-y-4">
                        {sessions.map((session) => (
                          <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="text-lg font-medium text-gray-900">{session.title}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                    {getStatusText(session.status)}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    session.session_type === 'presencial' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {session.session_type === 'presencial' ? 'Presencial' : 'Virtual'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4" />
                                    <span>{session.student_name || 'Sin asignar'}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(session.start_time)}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{session.duration_minutes} min</span>
                                  </div>
                                </div>
                                {session.description && (
                                  <p className="mt-2 text-sm text-gray-500">{session.description}</p>
                                )}
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {session.session_type === 'presencial' ? (
                                      <>
                                        <Building className="w-4 h-4" />
                                        <span className="text-sm text-gray-600">
                                          {session.faculty} - {session.classroom}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Video className="w-4 h-4" />
                                        <span className="text-sm text-gray-600">Virtual</span>
                                      </>
                                    )}
                                  </div>
                                  {session.student_rating && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-sm text-gray-600">Rating:</span>
                                      <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < session.student_rating
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                {session.status === 'scheduled' && (
                                  <>
                                    <button
                                      onClick={() => handleCompleteSession(session.id)}
                                      className="p-2 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                      aria-label={currentContent.actions.complete}
                                      title={currentContent.actions.complete}
                                    >
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                        <span className="text-xs font-medium">{currentContent.actions.complete}</span>
                                      </div>
                                    </button>
                                    <button
                                      onClick={() => handleCancelSession(session.id)}
                                      className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                      aria-label={currentContent.actions.cancel}
                                      title={currentContent.actions.cancel}
                                    >
                                      <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                        <span className="text-xs font-medium">{currentContent.actions.cancel}</span>
                                      </div>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleEditSession(session)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  aria-label={currentContent.actions.edit}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(session.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  aria-label={currentContent.actions.delete}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{currentContent.noSessions}</p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{currentContent.addSession}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Bottom Navigation for Mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="flex items-center justify-around py-2">
            <Link
              href="/dashboard/tutor"
              className="flex flex-col items-center px-3 py-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </Link>
            <Link
              href="/dashboard/tutor/sessions"
              className="flex flex-col items-center px-3 py-2 text-green-600"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs mt-1">Sesiones</span>
            </Link>
            <Link
              href="/dashboard/tutor/subjects"
              className="flex flex-col items-center px-3 py-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs mt-1">Materias</span>
            </Link>
            <Link
              href="/dashboard/tutor/resources"
              className="flex flex-col items-center px-3 py-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs mt-1">Recursos</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center px-3 py-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs mt-1">Salir</span>
            </button>
          </div>
        </div>

        {/* Add Session Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{currentContent.addSession}</h3>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.selectSubject}
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">{currentContent.form.selectSubject}</option>
                    {tutorSubjects.map(subject => (
                      <option key={subject.id} value={subject.subject_id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.title}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Título de la sesión"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.description}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descripción de la sesión..."
                  />
                </div>

                {/* Session Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.sessionType}
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="presencial"
                        checked={sessionType === 'presencial'}
                        onChange={(e) => setSessionType(e.target.value as 'presencial' | 'virtual')}
                        className="mr-2"
                      />
                      {currentContent.form.presencial}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="virtual"
                        checked={sessionType === 'virtual'}
                        onChange={(e) => setSessionType(e.target.value as 'presencial' | 'virtual')}
                        className="mr-2"
                      />
                      {currentContent.form.virtual}
                    </label>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.date}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.time}
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.duration}
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1.5 horas</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>

                {/* Presencial Fields */}
                {sessionType === 'presencial' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentContent.form.faculty}
                      </label>
                      <input
                        type="text"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Ej: Facultad de Ingeniería"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentContent.form.classroom}
                      </label>
                      <input
                        type="text"
                        value={classroom}
                        onChange={(e) => setClassroom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Ej: Aula 101"
                      />
                    </div>
                  </>
                )}

                {/* Virtual Fields */}
                {sessionType === 'virtual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.meetingUrl}
                    </label>
                    <input
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {currentContent.form.cancel}
                </button>
                <button
                  onClick={handleAddSession}
                  disabled={!selectedSubject || !title || !date || !time}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentContent.form.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Session Modal */}
        {showEditModal && editingSession && (
          <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{currentContent.editSession}</h3>
                <p className="text-sm text-gray-600 mt-1">{editingSession.title}</p>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.selectSubject}
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">{currentContent.form.selectSubject}</option>
                    {tutorSubjects.map(subject => (
                      <option key={subject.id} value={subject.subject_id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.title}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Título de la sesión"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.description}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descripción de la sesión..."
                  />
                </div>

                {/* Session Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.sessionType}
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="presencial"
                        checked={sessionType === 'presencial'}
                        onChange={(e) => setSessionType(e.target.value as 'presencial' | 'virtual')}
                        className="mr-2"
                      />
                      {currentContent.form.presencial}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="virtual"
                        checked={sessionType === 'virtual'}
                        onChange={(e) => setSessionType(e.target.value as 'presencial' | 'virtual')}
                        className="mr-2"
                      />
                      {currentContent.form.virtual}
                    </label>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.date}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.time}
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.duration}
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1.5 horas</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>

                {/* Presencial Fields */}
                {sessionType === 'presencial' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentContent.form.faculty}
                      </label>
                      <input
                        type="text"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Ej: Facultad de Ingeniería"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentContent.form.classroom}
                      </label>
                      <input
                        type="text"
                        value={classroom}
                        onChange={(e) => setClassroom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Ej: Aula 101"
                      />
                    </div>
                  </>
                )}

                {/* Virtual Fields */}
                {sessionType === 'virtual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.meetingUrl}
                    </label>
                    <input
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {currentContent.form.cancel}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {currentContent.actions.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 