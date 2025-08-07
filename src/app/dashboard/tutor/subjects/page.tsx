'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { TutorSidebar } from '../../../../components/dashboard/TutorSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, BookOpen, Plus, Edit, Trash2, Search, Filter, Accessibility, Star } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'

interface TutorSubject {
  id: string
  subject_id: string
  subject_name: string
  subject_description: string
  experience_level: string
  hourly_rate: number
  description: string
  is_active: boolean
}

interface AvailableSubject {
  id: string
  name: string
  description: string
  category: string
  level: string
}

export default function TutorSubjectsPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [tutorSubjects, setTutorSubjects] = useState<TutorSubject[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState<TutorSubject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  // Form states
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [experienceLevel, setExperienceLevel] = useState<string>('intermediate')
  const [hourlyRate, setHourlyRate] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mis Materias',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      addSubject: 'Agregar Materia',
      editSubject: 'Editar Materia',
      noSubjects: 'No tienes materias configuradas',
      loading: 'Cargando...',
      experienceLevels: {
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
        expert: 'Experto'
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        activate: 'Activar',
        deactivate: 'Desactivar',
        add: 'Agregar',
        cancel: 'Cancelar',
        save: 'Guardar'
      },
      form: {
        selectSubject: 'Seleccionar materia',
        experienceLevel: 'Nivel de experiencia',
        description: 'Descripción de tu experiencia',
        save: 'Guardar',
        cancel: 'Cancelar'
      },
      messages: {
        subjectUpdated: 'Materia actualizada correctamente',
        errorUpdating: 'Error al actualizar la materia',
        confirmDelete: '¿Estás seguro de que quieres eliminar esta materia?'
      }
    },
    en: {
      title: 'My Subjects',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      addSubject: 'Add Subject',
      editSubject: 'Edit Subject',
      noSubjects: 'You have no subjects configured',
      loading: 'Loading...',
      experienceLevels: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        expert: 'Expert'
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        activate: 'Activate',
        deactivate: 'Deactivate',
        add: 'Add',
        cancel: 'Cancel',
        save: 'Save'
      },
      form: {
        selectSubject: 'Select subject',
        experienceLevel: 'Experience level',
        description: 'Description of your experience',
        save: 'Save',
        cancel: 'Cancel'
      },
      messages: {
        subjectUpdated: 'Subject updated successfully',
        errorUpdating: 'Error updating subject',
        confirmDelete: 'Are you sure you want to delete this subject?'
      }
    }
  }

  const currentContent = content[language]

  const handleLogout = async () => {
    await logout()
  }

  // Función para cargar materias del tutor
  const loadTutorSubjects = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Verificar que el usuario tenga un perfil
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error loading user profile:', profileError)
        // Si hay error 406, intentar crear el perfil manualmente
        if (profileError.code === '406' || profileError.code === '42501') {
          console.log('Attempting to create profile for user:', user.id)
          const { error: createError } = await supabase
            .rpc('create_user_profile', {
              user_id: user.id,
              user_email: user.email || '',
              user_name: user.name || 'Usuario',
              user_type: user.userType || 'student'
            })
          
          if (createError) {
            console.error('Error creating profile:', createError)
            return
          } else {
            console.log('Profile created successfully')
            // Recargar el perfil después de crearlo
            const { data: newProfileData, error: newProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle()
            
            if (newProfileError) {
              console.error('Error loading new profile:', newProfileError)
              return
            }
            
            profileData = newProfileData
          }
        } else {
          return
        }
      }

      if (!profileData) {
        console.error('User profile not found')
        return
      }

      console.log('User profile:', profileData)

      // Obtener materias del tutor con información de la materia
      const { data, error } = await supabase
        .from('tutor_subjects')
        .select(`
          id,
          experience_level,
          hourly_rate,
          description,
          is_active,
          subjects (
            id,
            name,
            description,
            category,
            level
          )
        `)
        .eq('tutor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading tutor subjects:', error)
        throw error
      }

      // Transformar datos para facilitar el uso
      const transformedData = data?.map((item: any) => ({
        id: item.id,
        subject_id: item.subjects?.id,
        subject_name: item.subjects?.name,
        subject_description: item.subjects?.description,
        experience_level: item.experience_level,
        hourly_rate: item.hourly_rate,
        description: item.description,
        is_active: item.is_active
      })) || []

      setTutorSubjects(transformedData)

    } catch (error) {
      console.error('Error loading tutor subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar materias disponibles
  const loadAvailableSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      setAvailableSubjects(data || [])
    } catch (error) {
      console.error('Error loading available subjects:', error)
    }
  }

  useEffect(() => {
    loadTutorSubjects()
    loadAvailableSubjects()
  }, [user?.id])

  // Función para abrir modal de edición
  const handleEditSubject = (subject: TutorSubject) => {
    setEditingSubject(subject)
    setExperienceLevel(subject.experience_level)
    setDescription(subject.description || '')
    setShowEditModal(true)
  }

  // Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingSubject(null)
    setExperienceLevel('intermediate')
    setDescription('')
  }

  // Función para guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editingSubject) return

    try {
      const { error } = await supabase
        .from('tutor_subjects')
        .update({
          experience_level: experienceLevel,
          description: description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSubject.id)

      if (error) {
        console.error('Error updating subject:', error)
        alert(currentContent.messages.errorUpdating)
        return
      }

      alert(currentContent.messages.subjectUpdated)
      handleCloseEditModal()
      await loadTutorSubjects()

    } catch (error) {
      console.error('Error in handleSaveEdit:', error)
      alert(currentContent.messages.errorUpdating)
    }
  }

  // Función para agregar materia
  const handleAddSubject = async () => {
    if (!selectedSubject || !user?.id) {
      console.error('Missing required data:', { selectedSubject, userId: user?.id })
      return
    }

    try {
      // Verificar que el usuario sea un tutor
      console.log('Checking if user is tutor...')
      
      // Usar consulta directa para verificar el tipo de usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error checking user profile:', profileError)
        alert('Error al verificar el perfil del usuario')
        return
      }

      if (!profileData || profileData.user_type !== 'tutor') {
        console.error('User is not a tutor:', profileData)
        alert('Solo los tutores pueden agregar materias')
        return
      }

      console.log('Attempting to add subject with data:', {
        tutor_id: user.id,
        subject_id: selectedSubject,
        experience_level: experienceLevel,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        description: description,
        is_active: true
      })

      const { data, error } = await supabase
        .from('tutor_subjects')
        .insert({
          tutor_id: user.id,
          subject_id: selectedSubject,
          experience_level: experienceLevel,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          description: description,
          is_active: true
        })
        .select()

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Successfully added subject:', data)

      // Recargar materias
      await loadTutorSubjects()
      
      // Limpiar formulario
      setSelectedSubject('')
      setExperienceLevel('intermediate')
      setHourlyRate('')
      setDescription('')
      setShowAddModal(false)

    } catch (error) {
      console.error('Error adding subject:', error)
      // Mostrar error al usuario
      alert(`Error al agregar materia: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  // Función para cambiar estado de materia
  const handleToggleSubject = async (subjectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tutor_subjects')
        .update({ is_active: !currentStatus })
        .eq('id', subjectId)

      if (error) throw error

      // Recargar materias
      await loadTutorSubjects()

    } catch (error) {
      console.error('Error toggling subject:', error)
    }
  }

  // Función para eliminar materia
  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm(currentContent.messages.confirmDelete)) return

    try {
      const { error } = await supabase
        .from('tutor_subjects')
        .delete()
        .eq('id', subjectId)

      if (error) throw error

      // Recargar materias
      await loadTutorSubjects()

    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  const getExperienceLevelText = (level: string) => {
    return currentContent.experienceLevels[level as keyof typeof currentContent.experienceLevels] || level
  }

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-blue-100 text-blue-800'
      case 'intermediate':
        return 'bg-green-100 text-green-800'
      case 'advanced':
        return 'bg-yellow-100 text-yellow-800'
      case 'expert':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
                  aria-label={currentContent.addSubject}
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentContent.addSubject}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main className="p-4 sm:p-6 lg:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">{currentContent.loading}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Subjects List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{currentContent.title}</h3>
                  </div>
                  <div className="p-6">
                    {tutorSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tutorSubjects.map((subject) => (
                          <div key={subject.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-lg font-medium text-gray-900">{subject.subject_name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{subject.subject_description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditSubject(subject)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  aria-label={currentContent.actions.edit}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleSubject(subject.id, subject.is_active)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    subject.is_active
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  {subject.is_active ? currentContent.actions.deactivate : currentContent.actions.activate}
                                </button>
                                <button
                                  onClick={() => handleDeleteSubject(subject.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  aria-label={currentContent.actions.delete}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceLevelColor(subject.experience_level)}`}>
                                  {getExperienceLevelText(subject.experience_level)}
                                </span>
                              </div>
                              
                              {subject.description && (
                                <p className="text-sm text-gray-500 mt-2">{subject.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">{currentContent.noSubjects}</p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{currentContent.addSubject}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Add Subject Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{currentContent.addSubject}</h3>
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
                    {availableSubjects
                      .filter(subject => !tutorSubjects.some(ts => ts.subject_id === subject.id))
                      .map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.experienceLevel}
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="beginner">{currentContent.experienceLevels.beginner}</option>
                    <option value="intermediate">{currentContent.experienceLevels.intermediate}</option>
                    <option value="advanced">{currentContent.experienceLevels.advanced}</option>
                    <option value="expert">{currentContent.experienceLevels.expert}</option>
                  </select>
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
                    placeholder="Describe tu experiencia en esta materia..."
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {currentContent.form.cancel}
                </button>
                <button
                  onClick={handleAddSubject}
                  disabled={!selectedSubject}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentContent.form.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Subject Modal */}
        {showEditModal && editingSubject && (
          <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{currentContent.editSubject}</h3>
                <p className="text-sm text-gray-600 mt-1">{editingSubject.subject_name}</p>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.experienceLevel}
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="beginner">{currentContent.experienceLevels.beginner}</option>
                    <option value="intermediate">{currentContent.experienceLevels.intermediate}</option>
                    <option value="advanced">{currentContent.experienceLevels.advanced}</option>
                    <option value="expert">{currentContent.experienceLevels.expert}</option>
                  </select>
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
                    placeholder="Describe tu experiencia en esta materia..."
                  />
                </div>
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