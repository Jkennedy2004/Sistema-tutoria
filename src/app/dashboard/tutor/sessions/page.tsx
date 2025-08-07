'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { TutorSidebar } from '../../../../components/dashboard/TutorSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, Calendar, Clock, User, MapPin, Plus, Filter, Search, Star, Edit, Trash2, Video, Building, Home, BookOpen, FileText, LogOut, Accessibility, Users, Mail, Phone, Check, X } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'
import Link from 'next/link'
import { AdvancedFilters } from '../../../../components/messaging/AdvancedFilters'

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
  notes?: string
  created_at: string
  updated_at: string
  // Subject information
  subject_id: string
  subject_name: string
  subject_description?: string
  // Participant count
  participant_count: number
}

interface TutorSubject {
  id: string
  subject_id: string
  subject_name: string
}

interface SessionParticipant {
  id: string
  session_id: string
  student_id: string
  joined_at: string
  status: string
  created_at: string
  updated_at: string
  // Session information
  session_title: string
  start_time: string
  end_time: string
  session_type: string
  // Student information
  student_name: string
  student_email: string
  student_phone?: string
  student_avatar_url?: string
  // Tutor information
  tutor_id: string
  tutor_name: string
}

export default function TutorSessionsPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [sessions, setSessions] = useState<Session[]>([])
  const [tutorSubjects, setTutorSubjects] = useState<TutorSubject[]>([])
  const [participants, setParticipants] = useState<SessionParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  
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

  const handleLogout = async () => {
    await logout()
  }

  // Función para cargar sesiones del tutor
  const loadSessions = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      let query = supabase
        .from('sessions')
        .select(`
          *,
          subjects (
            id,
            name,
            description
          )
        `)
        .eq('tutor_id', user.id)
        .order('start_time', { ascending: false })

      // Aplicar filtros
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      // Get participant count for each session
      const sessionsWithParticipants = await Promise.all(
        data?.map(async (session) => {
          const { count } = await supabase
            .from('session_participants')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('status', 'joined')

          return {
            ...session,
            subject_name: (session.subjects as any)?.name || '',
            subject_description: (session.subjects as any)?.description || '',
            participant_count: count || 0
          }
        }) || []
      )

      // Filtrar por término de búsqueda
      let filteredData = sessionsWithParticipants
      if (searchTerm) {
        filteredData = filteredData.filter(session =>
          session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  useEffect(() => {
    if (selectedSession) {
      loadSessionParticipants(selectedSession)
    }
  }, [selectedSession])

  const loadSessionParticipants = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('session_participants_view')
        .select('*')
        .eq('session_id', sessionId)

      if (error) {
        console.error('Error loading session participants:', error)
        return
      }

      setParticipants(data || [])
    } catch (error) {
      console.error('Error loading session participants:', error)
    }
  }

  // Filter handlers
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters)
  }

  const handleClearFilters = () => {
    setActiveFilters({})
  }

  // Advanced filters configuration for sessions
  const advancedFilters = [
    {
      id: 'status',
      title: 'Estado',
      type: 'select' as const,
      icon: <Calendar className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar estado',
      options: [
        { id: 'all', label: 'Todos los estados', value: 'all' },
        { id: 'scheduled', label: 'Programada', value: 'scheduled' },
        { id: 'in_progress', label: 'En progreso', value: 'in_progress' },
        { id: 'completed', label: 'Completada', value: 'completed' },
        { id: 'cancelled', label: 'Cancelada', value: 'cancelled' }
      ]
    },
    {
      id: 'subject',
      title: 'Materia',
      type: 'select' as const,
      icon: <BookOpen className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar materia',
      options: [
        { id: 'all', label: 'Todas las materias', value: 'all' },
        ...tutorSubjects.map(subject => ({
          id: subject.subject_id,
          label: subject.subject_name,
          value: subject.subject_name
        }))
      ]
    },
    {
      id: 'session_type',
      title: 'Tipo de Sesión',
      type: 'select' as const,
      icon: <Video className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar tipo',
      options: [
        { id: 'all', label: 'Todos los tipos', value: 'all' },
        { id: 'presencial', label: 'Presencial', value: 'presencial' },
        { id: 'virtual', label: 'Virtual', value: 'virtual' }
      ]
    },
    {
      id: 'date',
      title: 'Fecha',
      type: 'date' as const,
      icon: <Calendar className="w-4 h-4 text-gray-500" />
    },
    {
      id: 'duration',
      title: 'Duración',
      type: 'select' as const,
      icon: <Clock className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar duración',
      options: [
        { id: 'all', label: 'Cualquier duración', value: 'all' },
        { id: 'short', label: 'Corta (< 30 min)', value: 'short' },
        { id: 'medium', label: 'Media (30-90 min)', value: 'medium' },
        { id: 'long', label: 'Larga (> 90 min)', value: 'long' }
      ]
    },
    {
      id: 'participants',
      title: 'Participantes',
      type: 'select' as const,
      icon: <Users className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar participantes',
      options: [
        { id: 'all', label: 'Cualquier cantidad', value: 'all' },
        { id: 'low', label: 'Pocos (1-3)', value: 'low' },
        { id: 'medium', label: 'Medios (4-8)', value: 'medium' },
        { id: 'high', label: 'Muchos (9+)', value: 'high' }
      ]
    }
  ]

  // Función para abrir modal de edición
  const handleEditSession = (session: Session) => {
    setEditingSession(session)
    setSelectedSubject(session.subject_id)
    setTitle(session.title)
    setDescription(session.description || '')
    setSessionType(session.session_type as 'presencial' | 'virtual')
    
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
      searchPlaceholder: 'Buscar sesiones...',
      filterAll: 'Todas',
      filterVirtual: 'Virtual',
      filterPresencial: 'Presencial',
      actions: {
        join: 'Unirse',
        start: 'Iniciar',
        cancel: 'Cancelar',
        complete: 'Completar',
        viewDetails: 'Ver Detalles',
        addNotes: 'Agregar Notas',
        edit: 'Editar',
        delete: 'Eliminar',
        save: 'Guardar',
        viewParticipants: 'Ver Participantes'
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
      },
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
      sessionInfo: {
        status: 'Estado',
        type: 'Tipo',
        duration: 'Duración',
        location: 'Ubicación',
        subject: 'Materia',
        participants: 'Participantes',
        startTime: 'Hora de inicio',
        endTime: 'Hora de fin',
        noParticipants: 'No hay participantes aún'
      },
      studentInfo: {
        name: 'Nombre',
        email: 'Email',
        phone: 'Teléfono',
        joinedAt: 'Se unió el'
      },
      location: 'Ubicación',
      meeting: 'Reunión',
      subject: 'Materia',
      duration: 'Duración',
      noParticipants: 'No hay participantes aún',
      viewParticipants: 'Ver Participantes',
      filters: {
        title: 'Filtros Avanzados',
        clearAll: 'Limpiar Todo',
        apply: 'Aplicar',
        saveFilters: 'Guardar Filtros',
        savedFilters: 'Filtros Guardados',
        noResults: 'No se encontraron sesiones',
        resultsFound: 'sesiones de',
        loading: 'Cargando...',
        searchPlaceholder: 'Buscar sesiones...',
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
        noResults: 'No se encontraron sesiones',
        noResultsDescription: 'Intenta ajustar los filtros para encontrar más sesiones',
        tryDifferentFilters: 'Probar filtros diferentes'
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
      searchPlaceholder: 'Search sessions...',
      filterAll: 'All',
      filterVirtual: 'Virtual',
      filterPresencial: 'In Person',
      actions: {
        join: 'Join',
        start: 'Start',
        cancel: 'Cancel',
        complete: 'Complete',
        viewDetails: 'View Details',
        addNotes: 'Add Notes',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        viewParticipants: 'View Participants'
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
      },
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
      sessionInfo: {
        status: 'Status',
        type: 'Type',
        duration: 'Duration',
        location: 'Location',
        subject: 'Subject',
        participants: 'Participants',
        startTime: 'Start Time',
        endTime: 'End Time',
        noParticipants: 'No participants yet'
      },
      studentInfo: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        joinedAt: 'Joined at'
      },
      location: 'Location',
      meeting: 'Meeting',
      subject: 'Subject',
      duration: 'Duration',
      noParticipants: 'No participants yet',
      viewParticipants: 'View Participants',
      filters: {
        title: 'Advanced Filters',
        clearAll: 'Clear All',
        apply: 'Apply Filters',
        saveFilters: 'Save Filters',
        savedFilters: 'Saved Filters',
        noResults: 'No sessions found',
        resultsFound: 'sessions of',
        loading: 'Loading...',
        searchPlaceholder: 'Search sessions...',
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
        noResults: 'No sessions found',
        noResultsDescription: 'Try adjusting filters to find more sessions',
        tryDifferentFilters: 'Try different filters'
      }
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

  const filteredSessions = sessions.filter(session => {
    // Basic search filter
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Basic filter
    const matchesFilter = filter === 'all' || session.session_type === filter
    
    // Advanced filters
    let matchesAdvancedFilters = true
    
    // Status filter
    if (activeFilters.status && activeFilters.status !== 'all') {
      matchesAdvancedFilters = matchesAdvancedFilters && session.status === activeFilters.status
    }
    
    // Subject filter
    if (activeFilters.subject && activeFilters.subject !== 'all') {
      matchesAdvancedFilters = matchesAdvancedFilters && session.subject_name === activeFilters.subject
    }
    
    // Session type filter
    if (activeFilters.session_type && activeFilters.session_type !== 'all') {
      matchesAdvancedFilters = matchesAdvancedFilters && session.session_type === activeFilters.session_type
    }
    
    // Date filter
    if (activeFilters.date_from || activeFilters.date_to) {
      const sessionDate = new Date(session.start_time)
      if (activeFilters.date_from) {
        matchesAdvancedFilters = matchesAdvancedFilters && 
          sessionDate >= new Date(activeFilters.date_from)
      }
      if (activeFilters.date_to) {
        matchesAdvancedFilters = matchesAdvancedFilters && 
          sessionDate <= new Date(activeFilters.date_to)
      }
    }
    
    // Duration filter
    if (activeFilters.duration && activeFilters.duration !== 'all') {
      const duration = session.duration_minutes
      switch (activeFilters.duration) {
        case 'short':
          matchesAdvancedFilters = matchesAdvancedFilters && duration < 30
          break
        case 'medium':
          matchesAdvancedFilters = matchesAdvancedFilters && duration >= 30 && duration <= 90
          break
        case 'long':
          matchesAdvancedFilters = matchesAdvancedFilters && duration > 90
          break
      }
    }
    
    // Participants filter
    if (activeFilters.participants && activeFilters.participants !== 'all') {
      const participantCount = session.participant_count
      switch (activeFilters.participants) {
        case 'low':
          matchesAdvancedFilters = matchesAdvancedFilters && participantCount >= 1 && participantCount <= 3
          break
        case 'medium':
          matchesAdvancedFilters = matchesAdvancedFilters && participantCount >= 4 && participantCount <= 8
          break
        case 'high':
          matchesAdvancedFilters = matchesAdvancedFilters && participantCount >= 9
          break
      }
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

                {/* Advanced Filters */}
                <div className="mb-6">
                  <AdvancedFilters
                    filters={advancedFilters}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    resultsCount={filteredSessions.length}
                    totalCount={sessions.length}
                    loading={loading}
                    userType="tutor"
                    content={currentContent}
                  />
                </div>

                {/* Basic Search and Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
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

                    {/* Basic Filters */}
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
                    {filteredSessions.length > 0 ? (
                      <div className="space-y-4">
                        {filteredSessions.map((session) => (
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
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {session.participant_count} {currentContent.sessionInfo.participants}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(session.start_time)}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{session.duration_minutes} min</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4" />
                                    <span>{session.subject_name}</span>
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
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2 ml-4">
                                <div className="flex space-x-2">
                                  {/* Mostrar botones de Completar/Cancelar para sesiones programadas */}
                                  {session.status === 'scheduled' && (
                                    <>
                                      <button
                                        onClick={() => handleCompleteSession(session.id)}
                                        className="p-2 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                        aria-label={currentContent.actions.complete}
                                        title={currentContent.actions.complete}
                                      >
                                        <div className="flex items-center space-x-1">
                                          <Check className="w-3 h-3" />
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
                                          <X className="w-3 h-3" />
                                          <span className="text-xs font-medium">{currentContent.actions.cancel}</span>
                                        </div>
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* TEMPORAL: Mostrar botones para todas las sesiones (para testing) */}
                                  {session.status !== 'scheduled' && (
                                    <>
                                      <button
                                        onClick={() => handleCompleteSession(session.id)}
                                        className="p-2 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-md transition-colors opacity-60"
                                        aria-label={`${currentContent.actions.complete} (Demo)`}
                                        title={`${currentContent.actions.complete} - Estado actual: ${session.status}`}
                                      >
                                        <div className="flex items-center space-x-1">
                                          <Check className="w-3 h-3" />
                                          <span className="text-xs font-medium">{currentContent.actions.complete}</span>
                                        </div>
                                      </button>
                                      <button
                                        onClick={() => handleCancelSession(session.id)}
                                        className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition-colors opacity-60"
                                        aria-label={`${currentContent.actions.cancel} (Demo)`}
                                        title={`${currentContent.actions.cancel} - Estado actual: ${session.status}`}
                                      >
                                        <div className="flex items-center space-x-1">
                                          <X className="w-3 h-3" />
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
                                {session.participant_count > 0 && (
                                  <button
                                    onClick={() => {
                                      if (selectedSession === session.id) {
                                        setSelectedSession(null)
                                      } else {
                                        setSelectedSession(session.id)
                                        loadSessionParticipants(session.id)
                                      }
                                    }}
                                    className="p-2 text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors text-xs"
                                    aria-label={currentContent.actions.viewParticipants}
                                    title={currentContent.actions.viewParticipants}
                                  >
                                    <div className="flex items-center space-x-1">
                                      <Users className="w-3 h-3" />
                                      <span className="font-medium">
                                        {selectedSession === session.id ? 'Ocultar' : currentContent.actions.viewParticipants}
                                      </span>
                                    </div>
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Participants Section */}
                            {selectedSession === session.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  {currentContent.sessionInfo.participants} ({participants.length})
                                </h5>
                                {participants.length > 0 ? (
                                  <div className="space-y-2">
                                    {participants.map((participant) => (
                                      <div key={participant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0">
                                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                              {participant.student_name.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm font-medium text-gray-900 truncate">
                                                {participant.student_name}
                                              </p>
                                              <p className="text-xs text-gray-500 truncate">
                                                {participant.student_email}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-xs text-gray-500">
                                                Se unió: {new Date(participant.joined_at).toLocaleDateString('es-ES', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })}
                                              </p>
                                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                participant.status === 'joined' 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-gray-100 text-gray-800'
                                              }`}>
                                                {participant.status === 'joined' ? 'Activo' : 'Inactivo'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">{currentContent.sessionInfo.noParticipants}</p>
                                  </div>
                                )}
                              </div>
                            )}
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