'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { TutorSidebar } from '../../../../components/dashboard/TutorSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, BookMarked, Plus, Download, Eye, Trash2, FileText, Upload, Edit, Search, Filter, Accessibility } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'

interface StudyResource {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  file_size: number
  is_public: boolean
  download_count: number
  created_at: string
  subject_name: string
  subject_id: string
}

interface TutorSubject {
  id: string
  subject_id: string
  subject_name: string
}

export default function TutorResourcesPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [resources, setResources] = useState<StudyResource[]>([])
  const [tutorSubjects, setTutorSubjects] = useState<TutorSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResource, setEditingResource] = useState<StudyResource | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  // Form states
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isPublic, setIsPublic] = useState<boolean>(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Recursos de Estudio',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      addResource: 'Agregar Recurso',
      editResource: 'Editar Recurso',
      noResources: 'No tienes recursos de estudio',
      loading: 'Cargando...',
      uploading: 'Subiendo archivo...',
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
        download: 'Descargar',
        view: 'Ver',
        makePublic: 'Hacer Público',
        makePrivate: 'Hacer Privado',
        save: 'Guardar'
      },
      form: {
        selectSubject: 'Seleccionar materia',
        title: 'Título del recurso',
        description: 'Descripción',
        file: 'Archivo',
        isPublic: 'Hacer público',
        save: 'Guardar',
        cancel: 'Cancelar'
      },
      stats: {
        total: 'Total Recursos',
        public: 'Públicos',
        private: 'Privados',
        downloads: 'Descargas'
      },
      messages: {
        resourceUpdated: 'Recurso actualizado correctamente',
        errorUpdating: 'Error al actualizar el recurso',
        confirmDelete: '¿Estás seguro de que quieres eliminar este recurso?'
      }
    },
    en: {
      title: 'Study Resources',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      addResource: 'Add Resource',
      editResource: 'Edit Resource',
      noResources: 'You have no study resources',
      loading: 'Loading...',
      uploading: 'Uploading file...',
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        download: 'Download',
        view: 'View',
        makePublic: 'Make Public',
        makePrivate: 'Make Private',
        save: 'Save'
      },
      form: {
        selectSubject: 'Select subject',
        title: 'Resource title',
        description: 'Description',
        file: 'File',
        isPublic: 'Make public',
        save: 'Save',
        cancel: 'Cancel'
      },
      stats: {
        total: 'Total Resources',
        public: 'Public',
        private: 'Private',
        downloads: 'Downloads'
      },
      messages: {
        resourceUpdated: 'Resource updated successfully',
        errorUpdating: 'Error updating resource',
        confirmDelete: 'Are you sure you want to delete this resource?'
      }
    }
  }

  const currentContent = content[language]

  const handleLogout = async () => {
    await logout()
  }

  // Función para descargar archivo
  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
      // Fallback: abrir en nueva pestaña
      window.open(fileUrl, '_blank')
    }
  }

  // Función para cargar recursos del tutor
  const loadResources = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('study_resources')
        .select(`
          id,
          title,
          description,
          file_url,
          file_type,
          file_size,
          is_public,
          download_count,
          created_at,
          subjects (
            id,
            name
          )
        `)
        .eq('tutor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar datos
      const transformedData = data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        file_url: item.file_url,
        file_type: item.file_type,
        file_size: item.file_size,
        is_public: item.is_public,
        download_count: item.download_count,
        created_at: item.created_at,
        subject_name: item.subjects?.name || '',
        subject_id: item.subjects?.id || ''
      })) || []

      setResources(transformedData)

    } catch (error) {
      console.error('Error loading resources:', error)
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
        subject_name: item.subjects?.name || ''
      })) || []

      setTutorSubjects(transformedData)
      
      // Si no hay materias registradas, mostrar alerta
      if (transformedData.length === 0) {
        alert(language === 'es' 
          ? 'No tienes materias registradas. Registra materias primero para poder subir recursos.' 
          : 'You have no registered subjects. Register subjects first to upload resources.'
        )
      }
    } catch (error) {
      console.error('Error loading tutor subjects:', error)
    }
  }

  useEffect(() => {
    loadResources()
    loadTutorSubjects()
  }, [user?.id])

  // Función para abrir modal de edición
  const handleEditResource = (resource: StudyResource) => {
    setEditingResource(resource)
    setSelectedSubject(resource.subject_id)
    setTitle(resource.title)
    setDescription(resource.description || '')
    setIsPublic(resource.is_public)
    setFile(null) // No permitir cambiar el archivo en edición
    setShowEditModal(true)
  }

  // Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingResource(null)
    setSelectedSubject('')
    setTitle('')
    setDescription('')
    setIsPublic(false)
    setFile(null)
  }

  // Función para guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editingResource) return

    try {
      const { error } = await supabase
        .from('study_resources')
        .update({
          subject_id: selectedSubject,
          title: title,
          description: description,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingResource.id)

      if (error) {
        console.error('Error updating resource:', error)
        alert(currentContent.messages.errorUpdating)
        return
      }

      alert(currentContent.messages.resourceUpdated)
      handleCloseEditModal()
      await loadResources()

    } catch (error) {
      console.error('Error in handleSaveEdit:', error)
      alert(currentContent.messages.errorUpdating)
    }
  }

  // Función para subir archivo
  const uploadFile = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`

      console.log('📤 Subiendo archivo:', file.name, 'a:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Error al subir archivo:', uploadError)
        throw uploadError
      }

      console.log('✅ Archivo subido exitosamente')

      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('❌ Error en uploadFile:', error)
      throw error
    }
  }

  // Función para agregar recurso
  const handleAddResource = async () => {
    if (!selectedSubject || !title || !file || !user?.id) {
      alert(language === 'es' 
        ? 'Por favor completa todos los campos requeridos' 
        : 'Please complete all required fields'
      )
      return
    }

    try {
      setUploading(true)
      console.log('🚀 Iniciando subida de recurso...')

      // Subir archivo
      const fileUrl = await uploadFile(file)
      console.log('📁 URL del archivo:', fileUrl)

      // Crear recurso en la base de datos
      const { error } = await supabase
        .from('study_resources')
        .insert({
          tutor_id: user.id,
          subject_id: selectedSubject,
          title: title,
          description: description,
          file_url: fileUrl,
          file_type: file.type,
          file_size: file.size,
          is_public: isPublic,
          download_count: 0
        })

      if (error) {
        console.error('❌ Error al crear recurso en BD:', error)
        throw error
      }

      console.log('✅ Recurso creado exitosamente')

      // Recargar recursos
      await loadResources()
      
      // Limpiar formulario
      setSelectedSubject('')
      setTitle('')
      setDescription('')
      setIsPublic(false)
      setFile(null)
      setShowAddModal(false)

      alert(language === 'es' 
        ? 'Recurso subido exitosamente' 
        : 'Resource uploaded successfully'
      )

    } catch (error) {
      console.error('❌ Error adding resource:', error)
      alert(language === 'es' 
        ? 'Error al subir el recurso. Intenta de nuevo.' 
        : 'Error uploading resource. Please try again.'
      )
    } finally {
      setUploading(false)
    }
  }

  // Función para cambiar visibilidad del recurso
  const handleToggleVisibility = async (resourceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('study_resources')
        .update({ is_public: !currentStatus })
        .eq('id', resourceId)

      if (error) throw error

      await loadResources()

    } catch (error) {
      console.error('Error toggling resource visibility:', error)
    }
  }

  // Función para eliminar recurso
  const handleDeleteResource = async (resourceId: string, fileUrl: string) => {
    if (!confirm(currentContent.messages.confirmDelete)) return

    try {
      // Eliminar archivo del storage
      const filePath = fileUrl.split('/').pop()
      if (filePath) {
        await supabase.storage
          .from('user-files')
          .remove([`${user?.id}/${filePath}`])
      }

      // Eliminar registro de la base de datos
      const { error } = await supabase
        .from('study_resources')
        .delete()
        .eq('id', resourceId)

      if (error) throw error

      await loadResources()

    } catch (error) {
      console.error('Error deleting resource:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStats = () => {
    const total = resources.length
    const publicCount = resources.filter(r => r.is_public).length
    const privateCount = total - publicCount
    const totalDownloads = resources.reduce((sum, r) => sum + r.download_count, 0)

    return { total, public: publicCount, private: privateCount, downloads: totalDownloads }
  }

  const stats = getStats()

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
                  aria-label={currentContent.addResource}
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentContent.addResource}</span>
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
            ) : tutorSubjects.length === 0 ? (
              <div className="text-center py-12">
                <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'es' ? 'No tienes materias registradas' : 'You have no registered subjects'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {language === 'es' 
                    ? 'Registra materias primero para poder subir recursos de estudio' 
                    : 'Register subjects first to upload study resources'
                  }
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard/tutor/subjects'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {language === 'es' ? 'Registrar Materias' : 'Register Subjects'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookMarked className="w-6 h-6 text-blue-600" />
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
                        <Eye className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.public}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.public}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FileText className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.private}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.private}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Download className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{currentContent.stats.downloads}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.downloads}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resources List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{currentContent.title}</h3>
                  </div>
                  <div className="p-6">
                    {resources.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources.map((resource) => (
                          <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-lg font-medium text-gray-900">{resource.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{resource.subject_name}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditResource(resource)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  aria-label={currentContent.actions.edit}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleVisibility(resource.id, resource.is_public)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    resource.is_public
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  {resource.is_public ? currentContent.actions.makePrivate : currentContent.actions.makePublic}
                                </button>
                                <button
                                  onClick={() => handleDeleteResource(resource.id, resource.file_url)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  aria-label={currentContent.actions.delete}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {resource.description && (
                                <p className="text-sm text-gray-500">{resource.description}</p>
                              )}
                              
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>{resource.file_type}</span>
                                <span>{formatFileSize(resource.file_size)}</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>{formatDate(resource.created_at)}</span>
                                <span>{resource.download_count} descargas</span>
                              </div>
                              
                              <button
                                onClick={() => handleDownload(resource.file_url, resource.title)}
                                className="flex items-center justify-center space-x-2 w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                              >
                                <Download className="w-4 h-4" />
                                <span>{currentContent.actions.download}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookMarked className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">{currentContent.noResources}</p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{currentContent.addResource}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Add Resource Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{currentContent.addResource}</h3>
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
                    placeholder="Título del recurso"
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
                    placeholder="Descripción del recurso..."
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentContent.form.file}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  />
                </div>

                {/* Public/Private */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                    {currentContent.form.isPublic}
                  </label>
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
                  onClick={handleAddResource}
                  disabled={!selectedSubject || !title || !file || uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? currentContent.uploading : currentContent.form.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Resource Modal */}
        {showEditModal && editingResource && (
          <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{currentContent.editResource}</h3>
                <p className="text-sm text-gray-600 mt-1">{editingResource.title}</p>
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
                    placeholder="Título del recurso"
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
                    placeholder="Descripción del recurso..."
                  />
                </div>

                {/* Public/Private */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsPublic" className="ml-2 block text-sm text-gray-900">
                    {currentContent.form.isPublic}
                  </label>
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