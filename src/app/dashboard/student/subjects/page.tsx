'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, BookOpen, Plus, X, Accessibility, CheckCircle, AlertCircle } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'

interface Subject {
  id: string
  name: string
  description?: string
}

interface StudentSubject {
  id: string
  subject_id: string
  registration_date: string
  subjects: Subject
}

export default function StudentSubjectsPage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [studentSubjects, setStudentSubjects] = useState<StudentSubject[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registeringSubjects, setRegisteringSubjects] = useState<string[]>([])
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    loadStudentSubjects()
    loadAvailableSubjects()
  }, [])

  const loadStudentSubjects = async () => {
    try {
      if (!user?.id) return

      const { data, error } = await supabase
        .from('student_subjects')
        .select(`
          id,
          subject_id,
          registration_date,
          subjects (
            id,
            name,
            description
          )
        `)
        .eq('student_id', user.id)
        .order('registration_date', { ascending: false })

      if (error) {
        console.error('Error loading student subjects:', error)
        return
      }

      setStudentSubjects(data || [])
    } catch (error) {
      console.error('Error loading student subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, description')
        .order('name')

      if (error) {
        console.error('Error loading available subjects:', error)
        return
      }

      setAvailableSubjects(data || [])
    } catch (error) {
      console.error('Error loading available subjects:', error)
    }
  }

  const handleSubjectRegistration = async () => {
    try {
      if (!user?.id || registeringSubjects.length === 0) return

      setRegistering(true)

      // Verificar registros existentes para cada materia
      for (const subjectId of registeringSubjects) {
        // Verificar si ya existe un registro (activo o inactivo)
        const { data: existingRegistration, error: checkError } = await supabase
          .from('student_subjects')
          .select('id, is_active')
          .eq('student_id', user.id)
          .eq('subject_id', subjectId)
          .maybeSingle()

        if (checkError) {
          console.error('Error checking existing registration:', checkError)
          continue
        }

        if (existingRegistration) {
          // Si existe un registro inactivo, reactivarlo
          if (!existingRegistration.is_active) {
            const { error: updateError } = await supabase
              .from('student_subjects')
              .update({ 
                is_active: true,
                registration_date: new Date().toISOString()
              })
              .eq('id', existingRegistration.id)

            if (updateError) {
              console.error('Error reactivating registration:', updateError)
            }
          }
          // Si ya está activo, no hacer nada
        } else {
          // Si no existe, crear nuevo registro
          const { error: insertError } = await supabase
            .from('student_subjects')
            .insert({
              student_id: user.id,
              subject_id: subjectId
            })

          if (insertError) {
            console.error('Error creating new registration:', insertError)
          }
        }
      }

      alert(language === 'es' ? 'Materias registradas correctamente' : 'Subjects registered successfully')
      setShowRegistrationModal(false)
      setRegisteringSubjects([])
      loadStudentSubjects() // Reload student subjects
    } catch (error) {
      console.error('Error in subject registration:', error)
      alert(language === 'es' ? 'Error al registrarse en las materias' : 'Error registering for subjects')
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregisterSubject = async (studentSubjectId: string) => {
    try {
      const { error } = await supabase
        .from('student_subjects')
        .delete()
        .eq('id', studentSubjectId)

      if (error) {
        console.error('Error unregistering subject:', error)
        alert(language === 'es' ? 'Error al cancelar el registro' : 'Error unregistering subject')
        return
      }

      alert(language === 'es' ? 'Materia cancelada correctamente' : 'Subject unregistered successfully')
      loadStudentSubjects() // Reload student subjects
    } catch (error) {
      console.error('Error unregistering subject:', error)
      alert(language === 'es' ? 'Error al cancelar el registro' : 'Error unregistering subject')
    }
  }

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mis Materias',
      welcomeUser: 'Bienvenido,',
      loading: 'Cargando...',
      noSubjects: 'No tienes materias registradas',
      registerSubjects: 'Registrarse en Materias',
      selectSubjects: 'Selecciona las materias en las que quieres registrarte:',
      register: 'Registrarse',
      cancel: 'Cancelar',
      unregister: 'Cancelar Registro',
      confirmUnregister: '¿Estás seguro de que quieres cancelar el registro de esta materia?',
      yes: 'Sí',
      no: 'No',
      registrationDate: 'Fecha de registro:',
      addNewSubject: 'Agregar Nueva Materia',
      currentSubjects: 'Materias Actuales',
      availableSubjects: 'Materias Disponibles'
    },
    en: {
      title: 'My Subjects',
      welcomeUser: 'Welcome,',
      loading: 'Loading...',
      noSubjects: 'You have no registered subjects',
      registerSubjects: 'Register for Subjects',
      selectSubjects: 'Select the subjects you want to register for:',
      register: 'Register',
      cancel: 'Cancel',
      unregister: 'Unregister',
      confirmUnregister: 'Are you sure you want to unregister from this subject?',
      yes: 'Yes',
      no: 'No',
      registrationDate: 'Registration date:',
      addNewSubject: 'Add New Subject',
      currentSubjects: 'Current Subjects',
      availableSubjects: 'Available Subjects'
    }
  }

  const currentContent = content[language]

  // Filter out subjects that the student is already registered for
  const unregisteredSubjects = availableSubjects.filter(availableSubject => 
    !studentSubjects.some(studentSubject => studentSubject.subject_id === availableSubject.id)
  )

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
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentContent.addNewSubject}</span>
                </button>
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
                <div className="text-lg text-gray-600">{currentContent.loading}</div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Current Subjects */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentContent.currentSubjects}</h2>
                  {studentSubjects.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{currentContent.noSubjects}</h3>
                      <p className="text-gray-500 mb-4">
                        {language === 'es' 
                          ? 'Regístrate en materias para comenzar a buscar tutores' 
                          : 'Register for subjects to start searching for tutors'
                        }
                      </p>
                      <button
                        onClick={() => setShowRegistrationModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {currentContent.registerSubjects}
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {studentSubjects.map((studentSubject) => (
                        <div key={studentSubject.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {studentSubject.subjects.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {currentContent.registrationDate} {new Date(studentSubject.registration_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {studentSubject.subjects.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {studentSubject.subjects.description}
                            </p>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(currentContent.confirmUnregister)) {
                                handleUnregisterSubject(studentSubject.id)
                              }
                            }}
                            className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                          >
                            {currentContent.unregister}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Subjects (if any) */}
                {unregisteredSubjects.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentContent.availableSubjects}</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {unregisteredSubjects.slice(0, 6).map((subject) => (
                        <div key={subject.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                              </div>
                            </div>
                          </div>
                          
                          {subject.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {subject.description}
                            </p>
                          )}

                          <button
                            onClick={() => {
                              setRegisteringSubjects([subject.id])
                              setShowRegistrationModal(true)
                            }}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            {currentContent.register}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Subject Registration Modal */}
        {showRegistrationModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {currentContent.registerSubjects}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {currentContent.selectSubjects}
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {unregisteredSubjects.map((subject) => (
                          <label key={subject.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={registeringSubjects.includes(subject.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRegisteringSubjects([...registeringSubjects, subject.id])
                                } else {
                                  setRegisteringSubjects(registeringSubjects.filter(id => id !== subject.id))
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{subject.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleSubjectRegistration}
                    disabled={registeringSubjects.length === 0 || registering}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? (language === 'es' ? 'Registrando...' : 'Registering...') : currentContent.register}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegistrationModal(false)
                      setRegisteringSubjects([])
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {currentContent.cancel}
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