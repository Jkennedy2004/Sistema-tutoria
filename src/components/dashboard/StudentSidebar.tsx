'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Settings, 
  LogOut,
  X,
  User,
  MessageSquare,
  Library
} from 'lucide-react'
import { useAuth } from '../../lib/auth/AuthContext'
import { useAccessibilityContext } from '../../lib/accessibilityContext'

interface StudentSidebarProps {
  isOpen: boolean
  onClose: () => void
  isDesktopSidebarOpen?: boolean
  onToggleDesktopSidebar?: () => void
}

export function StudentSidebar({ isOpen, onClose, isDesktopSidebarOpen = true, onToggleDesktopSidebar }: StudentSidebarProps) {
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
      student: 'Estudiante',
      logout: 'Cerrar Sesión',
      navigation: {
        dashboard: 'Dashboard',
        myTutoring: 'Mis Tutorías',
        searchTutors: 'Buscar Tutores',
        mySubjects: 'Mis Materias',
        studyResources: 'Recursos de Estudio',
        messages: 'Mensajes',
        profile: 'Mi Perfil',
        settings: 'Configuración'
      }
    },
    en: {
      student: 'Student',
      logout: 'Logout',
      navigation: {
        dashboard: 'Dashboard',
        myTutoring: 'My Tutoring',
        searchTutors: 'Search Tutors',
        mySubjects: 'My Subjects',
        studyResources: 'Study Resources',
        messages: 'Messages',
        profile: 'My Profile',
        settings: 'Settings'
      }
    }
  }

  const currentContent = content[language]

  const navigation = [
    {
      name: currentContent.navigation.dashboard,
      href: '/dashboard/student',
      icon: Home,
      current: pathname === '/dashboard/student'
    },
    {
      name: currentContent.navigation.myTutoring,
      href: '/dashboard/student/tutoring',
      icon: Calendar,
      current: pathname === '/dashboard/student/tutoring'
    },
    {
      name: currentContent.navigation.searchTutors,
      href: '/dashboard/student/tutors',
      icon: User,
      current: pathname === '/dashboard/student/tutors'
    },
    {
      name: currentContent.navigation.mySubjects,
      href: '/dashboard/student/subjects',
      icon: Library,
      current: pathname === '/dashboard/student/subjects'
    },
    {
      name: currentContent.navigation.studyResources,
      href: '/dashboard/student/resources',
      icon: BookOpen,
      current: pathname === '/dashboard/student/resources'
    },
    {
      name: currentContent.navigation.messages,
      href: '/dashboard/student/messages',
      icon: MessageSquare,
      current: pathname === '/dashboard/student/messages'
    },
    {
      name: currentContent.navigation.profile,
      href: '/dashboard/student/profile',
      icon: User,
      current: pathname === '/dashboard/student/profile'
    }
  ]

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">TutorPro</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-col h-full">
          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{currentContent.student}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={onClose}
                  aria-label={item.name}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
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
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>{currentContent.logout}</span>
            </button>
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
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              {isDesktopSidebarOpen && (
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{currentContent.student}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
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