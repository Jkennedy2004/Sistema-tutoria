'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, MessageSquare, Send, User, Clock, Search, Filter, Accessibility, Globe, Plus } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'

interface Message {
  id: string
  content: string
  sender_name: string
  receiver_name: string
  created_at: string
  is_read: boolean
  session_title?: string
}

interface Tutor {
  id: string
  name: string
  email: string
}

export default function StudentMessagesPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedTutor, setSelectedTutor] = useState<string>('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    loadMessages()
    loadTutors()
  }, [])

  const loadMessages = async () => {
    try {
      if (!user?.id) return

      // Get messages where student is sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          is_read,
          sender_id,
          receiver_id,
          session_id,
          sender:sender_id(name),
          receiver:receiver_id(name),
          sessions(title)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      const transformedMessages = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_name: (msg.sender as any)?.name || 'Usuario',
        receiver_name: (msg.receiver as any)?.name || 'Usuario',
        created_at: msg.created_at,
        is_read: msg.is_read,
        session_title: (msg.sessions as any)?.title
      })) || []

      setMessages(transformedMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('user_type', 'tutor')
        .order('name')

      if (error) {
        console.error('Error loading tutors:', error)
        return
      }

      setTutors(data || [])
    } catch (error) {
      console.error('Error loading tutors:', error)
    }
  }

  const handleSendMessage = async () => {
    try {
      if (!user?.id || !selectedTutor || !newMessage.trim()) return

      setSending(true)

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedTutor,
          content: newMessage.trim(),
          is_read: false
        })

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      setNewMessage('')
      setSelectedTutor('')
      await loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mensajes',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...',
      sending: 'Enviando...',
      noMessages: 'No hay mensajes',
      searchPlaceholder: 'Buscar mensajes...',
      filterAll: 'Todos',
      filterUnread: 'No leídos',
      filterSent: 'Enviados',
      filterReceived: 'Recibidos',
      actions: {
        send: 'Enviar',
        newMessage: 'Nuevo Mensaje',
        selectTutor: 'Seleccionar tutor'
      },
      stats: {
        total: 'Total de Mensajes',
        unread: 'No Leídos',
        sent: 'Enviados'
      },
      messagePlaceholder: 'Escribe tu mensaje...',
      noTutors: 'No hay tutores disponibles'
    },
    en: {
      title: 'Messages',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...',
      sending: 'Sending...',
      noMessages: 'No messages',
      searchPlaceholder: 'Search messages...',
      filterAll: 'All',
      filterUnread: 'Unread',
      filterSent: 'Sent',
      filterReceived: 'Received',
      actions: {
        send: 'Send',
        newMessage: 'New Message',
        selectTutor: 'Select tutor'
      },
      stats: {
        total: 'Total Messages',
        unread: 'Unread',
        sent: 'Sent'
      },
      messagePlaceholder: 'Write your message...',
      noTutors: 'No tutors available'
    }
  }

  const currentContent = content[language]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !message.is_read) ||
                         (filter === 'sent' && message.sender_name === user?.name) ||
                         (filter === 'received' && message.receiver_name === user?.name)
    
    return matchesSearch && matchesFilter
  })

  const totalMessages = messages.length
  const unreadMessages = messages.filter(m => !m.is_read).length
  const sentMessages = messages.filter(m => m.sender_name === user?.name).length

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
            </div>

            {/* New Message Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{currentContent.actions.newMessage}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.actions.selectTutor}
                  </label>
                  <select
                    value={selectedTutor}
                    onChange={(e) => setSelectedTutor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{currentContent.actions.selectTutor}</option>
                    {tutors.map((tutor) => (
                      <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={currentContent.messagePlaceholder}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!selectedTutor || !newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? currentContent.sending : currentContent.actions.send}</span>
                  </button>
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
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{currentContent.filterAll}</option>
                  <option value="unread">{currentContent.filterUnread}</option>
                  <option value="sent">{currentContent.filterSent}</option>
                  <option value="received">{currentContent.filterReceived}</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">{currentContent.loading}</div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{currentContent.noMessages}</h3>
                <p className="text-gray-500">Comienza una conversación con un tutor</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div key={message.id} className={`bg-white rounded-lg shadow p-6 ${!message.is_read ? 'border-l-4 border-blue-500' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {message.sender_name === user?.name ? 'Tú' : message.sender_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {message.sender_name === user?.name ? `Para: ${message.receiver_name}` : `De: ${message.sender_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-700">{message.content}</p>
                    </div>

                    {message.session_title && (
                      <div className="text-sm text-gray-500">
                        Sesión: {message.session_title}
                      </div>
                    )}

                    {!message.is_read && message.sender_name !== user?.name && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          No leído
                        </span>
                      </div>
                    )}
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