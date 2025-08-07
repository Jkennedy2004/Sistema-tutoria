'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { TutorSidebar } from '../../../../components/dashboard/TutorSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect, useRef } from 'react'
import { 
  Menu, 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  Search, 
  Filter, 
  Accessibility, 
  RefreshCw,
  Edit3,
  Trash2,
  Check,
  CheckCheck,
  Plus,
  X,
  Smile,
  GraduationCap,
  Calendar,
  Star,
  FileText,
  Image
} from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'
import { AdvancedFilters } from '../../../../components/messaging/AdvancedFilters'

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  sender_name: string
  receiver_name: string
  created_at: string
  updated_at: string
  is_read: boolean
  session_title?: string
  is_edited?: boolean
}

interface Student {
  id: string
  name: string
  email: string
}

interface Conversation {
  studentId: string
  studentName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

export default function TutorMessagesPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string>('')
  const [editingMessage, setEditingMessage] = useState<string>('')
  const [editContent, setEditContent] = useState('')
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    loadMessages()
    loadStudents()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Mark messages as read when conversation is selected
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (selectedConversation && user?.id) {
        const unreadMessages = messages.filter(msg => 
          msg.sender_id !== user.id && 
          msg.receiver_id === user.id && 
          !msg.is_read &&
          (msg.sender_id === selectedConversation || msg.receiver_id === selectedConversation)
        )
        
        // Mark all unread messages in this conversation as read
        for (const message of unreadMessages) {
          await markAsRead(message.id)
        }
      }
    }
    
    markMessagesAsRead()
  }, [selectedConversation, messages, user?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      if (!user?.id) return

      setRefreshing(true)

      // Get messages where tutor is sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          created_at,
          is_read,
          session_id,
          sender:sender_id(name),
          receiver:receiver_id(name),
          sessions(title)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      const transformedMessages = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        sender_name: (msg.sender as any)?.name || 'Usuario',
        receiver_name: (msg.receiver as any)?.name || 'Usuario',
        created_at: msg.created_at,
        updated_at: msg.created_at, // Use created_at as fallback
        is_read: msg.is_read,
        session_title: (msg.sessions as any)?.title,
        is_edited: false // Default to false since we don't have the column yet
      })) || []

      setMessages(transformedMessages)
      organizeConversations(transformedMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const organizeConversations = (allMessages: Message[]) => {
    const conversationMap = new Map<string, Conversation>()

    allMessages.forEach(message => {
      const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id
      const otherUserName = message.sender_id === user?.id ? message.receiver_name : message.sender_name

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          studentId: otherUserId,
          studentName: otherUserName,
          lastMessage: message.content,
          lastMessageTime: message.created_at,
          unreadCount: 0,
          messages: []
        })
      }

      const conversation = conversationMap.get(otherUserId)!
      conversation.messages.push(message)
      
      if (message.created_at > conversation.lastMessageTime) {
        conversation.lastMessage = message.content
        conversation.lastMessageTime = message.created_at
      }

      if (!message.is_read && message.sender_id !== user?.id) {
        conversation.unreadCount++
      }
    })

    const sortedConversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())

    setConversations(sortedConversations)
  }

  const loadStudents = async () => {
    try {
      if (!user?.id) return
      
      // Get students who have sessions with this tutor
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('student_id')
        .eq('tutor_id', user.id)
        .not('student_id', 'is', null)

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError)
        return
      }

      const studentIds = [...new Set(sessionsData?.map(s => s.student_id) || [])]

      if (studentIds.length === 0) {
        setStudents([])
        return
      }

      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', studentIds)
        .eq('user_type', 'student')
        .order('name')

      if (studentsError) {
        console.error('Error loading students:', studentsError)
        return
      }

      setStudents(studentsData || [])
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const handleSendMessage = async () => {
    try {
      if (!user?.id || !selectedStudent || !newMessage.trim()) return

      setSending(true)

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedStudent,
          content: newMessage.trim(),
          is_read: false
        })

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      setNewMessage('')
      setSelectedStudent('')
      setShowNewMessageModal(false)
      await loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleReplyMessage = async (studentId: string, content: string) => {
    try {
      if (!user?.id || !content.trim()) return

      setSending(true)

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: studentId,
          content: content.trim(),
          is_read: false
        })

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      await loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      if (!newContent.trim()) return

      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent.trim()
          // updated_at will be handled by trigger when column exists
        })
        .eq('id', messageId)

      if (error) {
        console.error('Error editing message:', error)
        return
      }

      setEditingMessage('')
      setEditContent('')
      await loadMessages()
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) {
        console.error('Error deleting message:', error)
        return
      }

      await loadMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) {
        console.error('Error marking message as read:', error)
        return
      }

      await loadMessages()
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const getConversationMessages = (studentId: string) => {
    return messages.filter(msg => 
      (msg.sender_id === user?.id && msg.receiver_id === studentId) ||
      (msg.sender_id === studentId && msg.receiver_id === user?.id)
    )
  }

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mensajes',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...',
      refreshing: 'Actualizando...',
      sending: 'Enviando...',
      noMessages: 'No hay mensajes',
      noConversations: 'No hay conversaciones',
      searchPlaceholder: 'Buscar mensajes...',
      filterAll: 'Todos',
      filterUnread: 'No leídos',
      actions: {
        send: 'Enviar',
        reply: 'Responder',
        edit: 'Editar',
        delete: 'Eliminar',
        cancel: 'Cancelar',
        save: 'Guardar',
        newMessage: 'Nuevo Mensaje',
        selectStudent: 'Seleccionar estudiante',
        refresh: 'Actualizar'
      },
      stats: {
        total: 'Total de Mensajes',
        unread: 'No Leídos',
        sent: 'Enviados',
        conversations: 'Conversaciones'
      },
      filters: {
        title: 'Filtros Avanzados',
        clearAll: 'Limpiar Todo',
        apply: 'Aplicar',
        saveFilters: 'Guardar Filtros',
        savedFilters: 'Filtros Guardados',
        noResults: 'No se encontraron resultados',
        resultsFound: 'resultados de',
        loading: 'Cargando...',
        searchPlaceholder: 'Buscar en mensajes...',
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
        noResults: 'No se encontraron conversaciones',
        noResultsDescription: 'Intenta ajustar los filtros para encontrar más resultados',
        tryDifferentFilters: 'Probar filtros diferentes'
      },
      messagePlaceholder: 'Escribe tu mensaje...',
      replyPlaceholder: 'Escribe tu respuesta...',
      editPlaceholder: 'Edita tu mensaje...',
      noStudents: 'No hay estudiantes disponibles',
      messageStatus: {
        sent: 'Enviado',
        delivered: 'Entregado',
        read: 'Leído',
        edited: 'Editado'
      },
      confirmDelete: '¿Estás seguro de que quieres eliminar este mensaje?',
      noReply: 'No se puede responder a este mensaje',
      studentLabel: 'Estudiante',
      tutorLabel: 'Tutor'
    },
    en: {
      title: 'Messages',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...',
      refreshing: 'Refreshing...',
      sending: 'Sending...',
      noMessages: 'No messages',
      noConversations: 'No conversations',
      searchPlaceholder: 'Search messages...',
      filterAll: 'All',
      filterUnread: 'Unread',
      actions: {
        send: 'Send',
        reply: 'Reply',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        save: 'Save',
        newMessage: 'New Message',
        selectStudent: 'Select student',
        refresh: 'Refresh'
      },
      stats: {
        total: 'Total Messages',
        unread: 'Unread',
        sent: 'Sent',
        conversations: 'Conversations'
      },
      filters: {
        title: 'Advanced Filters',
        clearAll: 'Clear All',
        apply: 'Apply',
        saveFilters: 'Save Filters',
        savedFilters: 'Saved Filters',
        noResults: 'No results found',
        resultsFound: 'results of',
        loading: 'Loading...',
        searchPlaceholder: 'Search messages...',
        dateFrom: 'From',
        dateTo: 'To',
        status: {
          all: 'All',
          read: 'Read',
          unread: 'Unread',
          sent: 'Sent',
          received: 'Received',
          edited: 'Edited'
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
        noResults: 'No conversations found',
        noResultsDescription: 'Try adjusting your filters to find more results',
        tryDifferentFilters: 'Try different filters'
      },
      messagePlaceholder: 'Write your message...',
      replyPlaceholder: 'Write your reply...',
      editPlaceholder: 'Edit your message...',
      noStudents: 'No students available',
      messageStatus: {
        sent: 'Sent',
        delivered: 'Delivered',
        read: 'Read',
        edited: 'Edited'
      },
      confirmDelete: 'Are you sure you want to delete this message?',
      noReply: 'Cannot reply to this message',
      studentLabel: 'Student',
      tutorLabel: 'Tutor'
    }
  }

  const currentContent = content[language]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  // Advanced filtering logic for tutors
  const filteredConversations = conversations.filter(conversation => {
    // Basic search filter
    const matchesSearch = conversation.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Basic filter
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && conversation.unreadCount > 0)
    
    // Advanced filters
    let matchesAdvancedFilters = true
    
    // Status filter
    if (activeFilters.status) {
      const conversationMessages = getConversationMessages(conversation.studentId)
      const hasUnread = conversationMessages.some(m => !m.is_read && m.sender_id !== user?.id)
      const hasRead = conversationMessages.some(m => m.is_read && m.sender_id !== user?.id)
      
      switch (activeFilters.status) {
        case 'unread':
          matchesAdvancedFilters = hasUnread
          break
        case 'read':
          matchesAdvancedFilters = hasRead
          break
        case 'sent':
          matchesAdvancedFilters = conversationMessages.some(m => m.sender_id === user?.id)
          break
        case 'received':
          matchesAdvancedFilters = conversationMessages.some(m => m.receiver_id === user?.id)
          break
      }
    }
    
    // Date range filter
    if (activeFilters.date_from || activeFilters.date_to) {
      const conversationMessages = getConversationMessages(conversation.studentId)
      const lastMessageDate = new Date(conversation.lastMessageTime)
      
      if (activeFilters.date_from) {
        const fromDate = new Date(activeFilters.date_from)
        matchesAdvancedFilters = matchesAdvancedFilters && lastMessageDate >= fromDate
      }
      
      if (activeFilters.date_to) {
        const toDate = new Date(activeFilters.date_to)
        matchesAdvancedFilters = matchesAdvancedFilters && lastMessageDate <= toDate
      }
    }
    
    // Student filter
    if (activeFilters.student) {
      matchesAdvancedFilters = matchesAdvancedFilters && conversation.studentId === activeFilters.student
    }
    
    // Content type filter
    if (activeFilters.content_type) {
      const conversationMessages = getConversationMessages(conversation.studentId)
      const hasMatchingContent = conversationMessages.some(m => {
        switch (activeFilters.content_type) {
          case 'text':
            return !m.content.includes('http') && !m.content.includes('file')
          case 'file':
            return m.content.includes('file') || m.content.includes('document')
          case 'image':
            return m.content.includes('image') || m.content.includes('photo')
          default:
            return true
        }
      })
      matchesAdvancedFilters = matchesAdvancedFilters && hasMatchingContent
    }
    
    // Priority filter (based on unread count and message frequency)
    if (activeFilters.priority) {
      const conversationMessages = getConversationMessages(conversation.studentId)
      const unreadCount = conversationMessages.filter(m => !m.is_read && m.sender_id !== user?.id).length
      const messageCount = conversationMessages.length
      
      switch (activeFilters.priority) {
        case 'high':
          matchesAdvancedFilters = matchesAdvancedFilters && (unreadCount > 2 || messageCount > 10)
          break
        case 'normal':
          matchesAdvancedFilters = matchesAdvancedFilters && (unreadCount <= 2 && messageCount <= 10)
          break
        case 'low':
          matchesAdvancedFilters = matchesAdvancedFilters && (unreadCount === 0 && messageCount <= 5)
          break
      }
    }
    
    return matchesSearch && matchesFilter && matchesAdvancedFilters
  })

  const totalMessages = messages.length
  const unreadMessages = messages.filter(m => !m.is_read && m.sender_id !== user?.id).length
  const sentMessages = messages.filter(m => m.sender_id === user?.id).length

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
      id: 'status',
      title: 'Estado',
      type: 'select' as const,
      icon: <MessageSquare className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar estado',
      options: [
        { id: 'all', label: currentContent.filters?.status?.all || 'Todos', value: 'all' },
        { id: 'unread', label: currentContent.filters?.status?.unread || 'No leídos', value: 'unread' },
        { id: 'read', label: currentContent.filters?.status?.read || 'Leídos', value: 'read' },
        { id: 'sent', label: currentContent.filters?.status?.sent || 'Enviados', value: 'sent' },
        { id: 'received', label: currentContent.filters?.status?.received || 'Recibidos', value: 'received' }
      ]
    },
    {
      id: 'student',
      title: 'Estudiante',
      type: 'select' as const,
      icon: <User className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar estudiante',
      options: students.map(student => ({
        id: student.id,
        label: student.name,
        value: student.id
      }))
    },
    {
      id: 'date',
      title: 'Rango de Fechas',
      type: 'date' as const,
      icon: <Calendar className="w-4 h-4 text-gray-500" />
    },
    {
      id: 'content_type',
      title: 'Tipo de Contenido',
      type: 'select' as const,
      icon: <FileText className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar tipo',
      options: [
        { id: 'all', label: currentContent.filters?.type?.all || 'Todos', value: 'all' },
        { id: 'text', label: currentContent.filters?.type?.text || 'Texto', value: 'text' },
        { id: 'file', label: currentContent.filters?.type?.file || 'Archivo', value: 'file' },
        { id: 'image', label: currentContent.filters?.type?.image || 'Imagen', value: 'image' }
      ]
    },
    {
      id: 'priority',
      title: 'Prioridad',
      type: 'select' as const,
      icon: <Star className="w-4 h-4 text-gray-500" />,
      placeholder: 'Seleccionar prioridad',
      options: [
        { id: 'all', label: currentContent.filters?.priority?.all || 'Todas', value: 'all' },
        { id: 'high', label: currentContent.filters?.priority?.high || 'Alta', value: 'high' },
        { id: 'normal', label: currentContent.filters?.priority?.normal || 'Normal', value: 'normal' },
        { id: 'low', label: currentContent.filters?.priority?.low || 'Baja', value: 'low' }
      ]
    },
    {
      id: 'search_content',
      title: 'Buscar en Contenido',
      type: 'search' as const,
      icon: <Search className="w-4 h-4 text-gray-500" />,
      placeholder: 'Buscar en mensajes...',
      options: messages.map(msg => ({
        id: msg.id,
        label: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        value: msg.content
      }))
    }
  ]

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
                <button
                  onClick={loadMessages}
                  disabled={refreshing}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={currentContent.actions.refresh}
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowNewMessageModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentContent.actions.newMessage}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main className="p-4 sm:p-6 lg:p-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{currentContent.stats.total}</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalMessages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{currentContent.stats.unread}</p>
                    <p className="text-2xl font-semibold text-gray-900">{unreadMessages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{currentContent.stats.sent}</p>
                    <p className="text-2xl font-semibold text-gray-900">{sentMessages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{currentContent.stats.conversations}</p>
                    <p className="text-2xl font-semibold text-gray-900">{conversations.length}</p>
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
                resultsCount={filteredConversations.length}
                totalCount={conversations.length}
                loading={loading}
                userType="tutor"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-lg text-gray-600">{currentContent.loading}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversations List */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Conversaciones con Estudiantes</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {filteredConversations.length === 0 ? (
                        <div className="p-6 text-center">
                          <Smile className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">{currentContent.messages.noResults}</p>
                          <p className="text-gray-500">{currentContent.messages.noResultsDescription}</p>
                          <p className="text-gray-500">{currentContent.messages.tryDifferentFilters}</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredConversations.map((conversation) => (
                            <div
                              key={conversation.studentId}
                              onClick={() => setSelectedConversation(conversation.studentId)}
                              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedConversation === conversation.studentId ? 'bg-green-50 border-r-2 border-green-500' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <GraduationCap className="w-4 h-4 text-green-600" />
                                  <h4 className="font-medium text-gray-900">{conversation.studentName}</h4>
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate mb-1">
                                {conversation.lastMessage}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(conversation.lastMessageTime)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages View */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow">
                    {selectedConversation ? (
                      <>
                        <div className="px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-5 h-5 text-green-600" />
                              <h3 className="text-lg font-medium text-gray-900">
                                {conversations.find(c => c.studentId === selectedConversation)?.studentName}
                              </h3>
                              <span className="text-sm text-gray-500">({currentContent.studentLabel})</span>
                            </div>
                            <button
                              onClick={() => setSelectedConversation('')}
                              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <div className="h-96 flex flex-col">
                          {/* Messages */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {getConversationMessages(selectedConversation).map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                                  <div className={`rounded-lg px-4 py-2 ${
                                    message.sender_id === user?.id 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    {editingMessage === message.id ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={editContent}
                                          onChange={(e) => setEditContent(e.target.value)}
                                          className="w-full p-2 text-sm border rounded resize-none focus:ring-2 focus:ring-green-500"
                                          rows={2}
                                        />
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleEditMessage(message.id, editContent)}
                                            className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                                          >
                                            {currentContent.actions.save}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingMessage('')
                                              setEditContent('')
                                            }}
                                            className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                                          >
                                            {currentContent.actions.cancel}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <p className="text-sm">{message.content}</p>
                                        {message.is_edited && (
                                          <p className="text-xs opacity-70 mt-1">
                                            {currentContent.messageStatus.edited}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex items-center justify-between mt-1 text-xs text-gray-500 ${
                                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                                  }`}>
                                    <span>{formatDate(message.created_at)}</span>
                                    {message.sender_id === user?.id && (
                                      <div className="flex items-center space-x-1">
                                        {message.is_read ? (
                                          <CheckCheck className="w-3 h-3 text-green-500" />
                                        ) : (
                                          <Check className="w-3 h-3" />
                                        )}
                                        <div className="flex space-x-1">
                                          <button
                                            onClick={() => {
                                              setEditingMessage(message.id)
                                              setEditContent(message.content)
                                            }}
                                            className="hover:text-green-600"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteMessage(message.id)}
                                            className="hover:text-red-600"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                          
                          {/* Reply Input */}
                          <div className="border-t border-gray-200 p-4">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder={currentContent.replyPlaceholder}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    handleReplyMessage(selectedConversation, e.currentTarget.value)
                                    e.currentTarget.value = ''
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const input = document.querySelector('input[placeholder*="reply"]') as HTMLInputElement
                                  if (input?.value.trim()) {
                                    handleReplyMessage(selectedConversation, input.value)
                                    input.value = ''
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-96 flex items-center justify-center">
                        <div className="text-center">
                          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {currentContent.noMessages}
                          </h3>
                          <p className="text-gray-500">
                            Selecciona una conversación para comenzar
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* New Message Modal */}
        {showNewMessageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentContent.actions.newMessage}
                </h3>
                <button
                  onClick={() => setShowNewMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.actions.selectStudent}
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">{currentContent.actions.selectStudent}</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={currentContent.messagePlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowNewMessageModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    {currentContent.actions.cancel}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!selectedStudent || !newMessage.trim() || sending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {sending ? currentContent.sending : currentContent.actions.send}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 