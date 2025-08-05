'use client'

import { useAuth } from '../../../../lib/auth/AuthContext'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { useState, useEffect } from 'react'
import { Menu, User, Mail, Phone, MapPin, GraduationCap, Save, X, Accessibility, Globe, Camera } from 'lucide-react'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { supabase } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ProfileData {
  name: string
  email: string
  phone: string
  location: string
  education_level: string
  bio: string
  avatar_url: string
}

export default function StudentProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    education_level: '',
    bio: '',
    avatar_url: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    education_level: '',
    bio: '',
    avatar_url: ''
  })

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    console.log('StudentProfilePage useEffect - user:', user)
    
    if (!user) {
      console.log('No user found, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Check if user is a student
    if (user.userType !== 'student') {
      console.log('User is not a student, redirecting to appropriate dashboard')
      router.push('/dashboard')
      return
    }

    console.log('User found, loading profile for:', user.id)
    loadProfile()
  }, [user, router])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('Loading profile for user:', user.id)
      
      // First, try to get the current session to ensure we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        return
      }

      if (!session) {
        console.error('No active session')
        return
      }

      console.log('Session found, user ID:', session.user.id)
      
      // Try direct query first, then fallback to RPC if needed
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile with direct query:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        
        // Try RPC as fallback
        console.log('Trying RPC fallback...')
        const rpcResult = await supabase
          .rpc('get_user_profile', {
            user_id: user.id
          })
        
        if (rpcResult.error) {
          console.error('RPC also failed:', rpcResult.error)
          return
        }
        
        data = rpcResult.data
      }

      console.log('Profile data loaded:', data)

      if (data) {
        const profileData = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          education_level: data.education_level || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        }

        setProfile(profileData)
        setEditData(profileData)
      } else {
        console.log('No profile data found for user:', user.id)
        // If no profile exists, try to create one
        try {
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              name: user.name,
              user_type: 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (createError) {
            console.error('Error creating profile:', createError)
            // Try RPC as fallback
            const rpcCreateResult = await supabase
              .rpc('create_user_profile', {
                user_id: user.id,
                user_email: user.email,
                user_name: user.name,
                user_type: 'student'
              })
            
            if (rpcCreateResult.error) {
              console.error('RPC create also failed:', rpcCreateResult.error)
            } else {
              console.log('Profile created successfully with RPC, reloading...')
              setTimeout(() => loadProfile(), 1000)
            }
          } else {
            console.log('Profile created successfully, reloading...')
            setTimeout(() => loadProfile(), 1000)
          }
        } catch (createError) {
          console.error('Error in profile creation:', createError)
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editData.name,
          phone: editData.phone,
          location: editData.location,
          education_level: editData.education_level,
          bio: editData.bio,
          avatar_url: editData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        alert(currentContent.messages.error_updating)
        return
      }

      setProfile(editData)
      setIsEditing(false)
      alert(currentContent.messages.profile_updated)
    } catch (error) {
      console.error('Error in handleSave:', error)
      alert(currentContent.messages.error_updating)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData(profile)
    setIsEditing(false)
  }

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mi Perfil',
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar Sesión',
      loading: 'Cargando...',
      saving: 'Guardando...',
      edit: 'Editar',
      save: 'Guardar',
      cancel: 'Cancelar',
      fields: {
        name: 'Nombre',
        email: 'Correo Electrónico',
        phone: 'Teléfono',
        location: 'Ubicación',
        education: 'Nivel Educativo',
        bio: 'Biografía',
        avatar: 'URL del Avatar'
      },
      educationLevels: {
        'high_school': 'Bachillerato',
        'undergraduate': 'Pregrado',
        'graduate': 'Posgrado',
        'phd': 'Doctorado',
        'other': 'Otro'
      },
      placeholder: {
        name: 'Ingresa tu nombre completo',
        phone: 'Ingresa tu número de teléfono',
        location: 'Ingresa tu ubicación',
        bio: 'Cuéntanos sobre ti...',
        avatar: 'https://ejemplo.com/avatar.jpg'
      },
      messages: {
        profile_updated: 'Perfil actualizado correctamente',
        error_updating: 'Error al actualizar el perfil'
      }
    },
    en: {
      title: 'My Profile',
      welcomeUser: 'Welcome,',
      logout: 'Logout',
      loading: 'Loading...',
      saving: 'Saving...',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      fields: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        education: 'Education Level',
        bio: 'Bio',
        avatar: 'Avatar URL'
      },
      educationLevels: {
        'high_school': 'High School',
        'undergraduate': 'Undergraduate',
        'graduate': 'Graduate',
        'phd': 'PhD',
        'other': 'Other'
      },
      placeholder: {
        name: 'Enter your full name',
        phone: 'Enter your phone number',
        location: 'Enter your location',
        bio: 'Tell us about yourself...',
        avatar: 'https://example.com/avatar.jpg'
      },
      messages: {
        profile_updated: 'Profile updated successfully',
        error_updating: 'Error updating profile'
      }
    }
  }

  const currentContent = content[language]

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg text-gray-600">{currentContent.loading}</div>
        </div>
      </ProtectedRoute>
    )
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
        <main className={`flex-1 transition-all duration-300 ease-in-out ${desktopSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{currentContent.title}</h2>
                <p className="text-sm text-gray-600 mt-1">Gestiona tu información personal</p>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                {/* Avatar section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-blue-600" />
                      )}
                    </div>
                    <button className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
                    <p className="text-sm text-gray-500">Estudiante</p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.fields.name}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={currentContent.placeholder.name}
                        />
                      ) : (
                        <div className="pl-10 w-full px-3 py-2 text-gray-900">
                          {profile.name || 'No especificado'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.fields.email}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <div className="pl-10 w-full px-3 py-2 text-gray-900">
                        {profile.email}
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.fields.phone}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={currentContent.placeholder.phone}
                        />
                      ) : (
                        <div className="pl-10 w-full px-3 py-2 text-gray-900">
                          {profile.phone || 'No especificado'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.fields.location}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.location}
                          onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={currentContent.placeholder.location}
                        />
                      ) : (
                        <div className="pl-10 w-full px-3 py-2 text-gray-900">
                          {profile.location || 'No especificado'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Education Level */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.fields.education}
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      {isEditing ? (
                        <select
                          value={editData.education_level}
                          onChange={(e) => setEditData({ ...editData, education_level: e.target.value })}
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">{currentContent.fields.education}</option>
                          <option value="high_school">{currentContent.educationLevels.high_school}</option>
                          <option value="undergraduate">{currentContent.educationLevels.undergraduate}</option>
                          <option value="graduate">{currentContent.educationLevels.graduate}</option>
                          <option value="phd">{currentContent.educationLevels.phd}</option>
                          <option value="other">{currentContent.educationLevels.other}</option>
                        </select>
                      ) : (
                        <div className="pl-10 w-full px-3 py-2 text-gray-900">
                          {profile.education_level ? currentContent.educationLevels[profile.education_level as keyof typeof currentContent.educationLevels] : 'No especificado'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.fields.bio}
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={currentContent.placeholder.bio}
                      />
                    ) : (
                      <div className="w-full px-3 py-2 text-gray-900">
                        {profile.bio || 'No especificado'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{currentContent.edit}</span>
                      </div>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {currentContent.cancel}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{currentContent.saving}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Save className="w-4 h-4" />
                            <span>{currentContent.save}</span>
                          </div>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 