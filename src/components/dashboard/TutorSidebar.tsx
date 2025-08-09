'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  BookOpen, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  X,
  User,
  MessageSquare,
  Star,
  BookMarked
} from 'lucide-react'
import { useAuth } from '../../lib/auth/AuthContext'
import { useAccessibilityContext } from '../../lib/accessibilityContext'

interface TutorSidebarProps {
  isOpen: boolean
  onClose: () => void
  isDesktopSidebarOpen?: boolean
  onToggleDesktopSidebar?: () => void
}

export function TutorSidebar({ isOpen, onClose, isDesktopSidebarOpen = true, onToggleDesktopSidebar }: TutorSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { language } = useAccessibilityContext()
  const [activeSection, setActiveSection] = useState('dashboard')

  const handleLogout = async () => {
    await logout()
  }

  // Contenido basado en idioma
  const content = {
    es: {
      tutor: 'Tutor',
      logout: 'Cerrar Sesión',
      navigation: {
        dashboard: 'Dashboard',
        profile: 'Mi Perfil',
        mySessions: 'Mis Sesiones',
        myStudents: 'Mis Estudiantes',
        subjects: 'Mis Materias',
        resources: 'Recursos',
        messages: 'Mensajes',
        settings: 'Configuración'
      }
    },
    en: {
      tutor: 'Tutor',
      logout: 'Logout',
      navigation: {
        dashboard: 'Dashboard',
        profile: 'My Profile',
        mySessions: 'My Sessions',
        myStudents: 'My Students',
        subjects: 'My Subjects',
        resources: 'Resources',
        messages: 'Messages',
        settings: 'Settings'
      }
    }
  }

  const currentContent = content[language]

  const navigation = [
    {
      name: currentContent.navigation.dashboard,
      href: '/dashboard/tutor',
      icon: Home,
      current: pathname === '/dashboard/tutor'
    },
    {
      name: currentContent.navigation.profile,
      href: '/dashboard/tutor/profile',
      icon: User,
      current: pathname === '/dashboard/tutor/profile'
    },
    {
      name: currentContent.navigation.mySessions,
      href: '/dashboard/tutor/sessions',
      icon: Calendar,
      current: pathname === '/dashboard/tutor/sessions'
    },
    {
      name: currentContent.navigation.myStudents,
      href: '/dashboard/tutor/students',
      icon: Users,
      current: pathname === '/dashboard/tutor/students'
    },
    {
      name: currentContent.navigation.subjects,
      href: '/dashboard/tutor/subjects',
      icon: BookOpen,
      current: pathname === '/dashboard/tutor/subjects'
    },
    {
      name: currentContent.navigation.resources,
      href: '/dashboard/tutor/resources',
      icon: BookMarked,
      current: pathname === '/dashboard/tutor/resources'
    },
    {
      name: currentContent.navigation.messages,
      href: '/dashboard/tutor/messages',
      icon: MessageSquare,
      current: pathname === '/dashboard/tutor/messages'
    }
  ]

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">TutorPro</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                aria-label="Cerrar menú"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* User info */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{currentContent.tutor}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="px-4 py-6 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        item.current
                          ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={onClose}
                      aria-label={item.name}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Logout button - Fixed at bottom */}
            <div className="px-4 py-4 border-t border-gray-200 bg-white">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                aria-label={currentContent.logout}
              >
                <LogOut className="w-5 h-5" />
                <span>{currentContent.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:shadow-lg transition-all duration-300 ease-in-out ${
        isDesktopSidebarOpen ? 'lg:w-64' : 'lg:w-16'
      }`}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo and Toggle */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            {isDesktopSidebarOpen && <h2 className="text-xl font-bold text-gray-900">TutorPro</h2>}
            <button
              onClick={onToggleDesktopSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-label={isDesktopSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
            >
              <X className={`w-5 h-5 transition-transform duration-300 ${isDesktopSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-green-600" />
              </div>
              {isDesktopSidebarOpen && (
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{currentContent.tutor}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-label={item.name}
                  title={!isDesktopSidebarOpen ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isDesktopSidebarOpen && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Logout button */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              aria-label={currentContent.logout}
              title={!isDesktopSidebarOpen ? currentContent.logout : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isDesktopSidebarOpen && <span>{currentContent.logout}</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 