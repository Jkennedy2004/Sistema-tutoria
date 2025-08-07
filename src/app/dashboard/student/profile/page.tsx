'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Camera,
  Save,
  X,
  Accessibility
} from 'lucide-react'
import { useAuth } from '../../../../lib/auth/AuthContext'
import { useAccessibilityContext } from '../../../../lib/accessibilityContext'
import { StudentSidebar } from '../../../../components/dashboard/StudentSidebar'
import { AccessibilityPanel } from '../../../../components/accessibility/AccessibilityPanel'
import { supabase } from '../../../../lib/supabase/client'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'

interface ProfileFormData {
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    education_level: '',
    bio: '',
    avatar_url: ''
  })

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Mi Perfil',
      subtitle: 'Gestiona tu información personal',
      form: {
        name: 'Nombre completo',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        location: 'Ubicación',
        education_level: 'Nivel de educación',
        bio: 'Biografía',
        avatar: 'Foto de perfil',
        save: 'Guardar cambios',
        cancel: 'Cancelar'
      },
      education_levels: {
        high_school: 'Bachillerato',
        undergraduate: 'Pregrado',
        graduate: 'Posgrado',
        phd: 'Doctorado',
        other: 'Otro'
      },
      messages: {
        profile_updated: 'Perfil actualizado correctamente',
        error_updating: 'Error al actualizar el perfil',
        loading: 'Cargando perfil...',
        saving: 'Guardando...'
      },
      welcomeUser: 'Bienvenido,',
      logout: 'Cerrar sesión'
    },
    en: {
      title: 'My Profile',
      subtitle: 'Manage your personal information',
      form: {
        name: 'Full name',
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        education_level: 'Education level',
        bio: 'Biography',
        avatar: 'Profile picture',
        save: 'Save changes',
        cancel: 'Cancel'
      },
      education_levels: {
        high_school: 'High School',
        undergraduate: 'Undergraduate',
        graduate: 'Graduate',
        phd: 'PhD',
        other: 'Other'
      },
      messages: {
        profile_updated: 'Profile updated successfully',
        error_updating: 'Error updating profile',
        loading: 'Loading profile...',
        saving: 'Saving...'
      },
      welcomeUser: 'Welcome,',
      logout: 'Logout'
    }
  }

  const currentContent = content[language]

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    loadProfile()
  }, [user, router])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('Loading profile for user:', user.id)
      
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
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          education_level: data.education_level || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        })
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

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      console.log('Saving profile data:', profileData)
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          location: profileData.location,
          education_level: profileData.education_level,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        console.log('Showing error message:', currentContent.messages.error_updating)
        alert(currentContent.messages.error_updating)
        return
      }

      console.log('Profile updated successfully')
      console.log('Showing success message:', currentContent.messages.profile_updated)
      alert(currentContent.messages.profile_updated)
    } catch (error) {
      console.error('Error in handleSave:', error)
      console.log('Showing error message:', currentContent.messages.error_updating)
      alert(currentContent.messages.error_updating)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{currentContent.messages.loading}</p>
          </div>
        </div>
      </div>
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



        {/* Accessibility Panel */}
        <AccessibilityPanel 
          isOpen={isAccessibilityOpen}
          onClose={() => setIsAccessibilityOpen(false)}
        />

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <StudentSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
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
                <p className="text-sm text-gray-600 mt-1">{currentContent.subtitle}</p>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                {/* Avatar section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      {profileData.avatar_url ? (
                        <img 
                          src={profileData.avatar_url} 
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
                      {currentContent.form.name}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={currentContent.form.name}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.email}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={currentContent.form.email}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.phone}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={currentContent.form.phone}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.location}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={currentContent.form.location}
                      />
                    </div>
                  </div>

                  {/* Education Level */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.education_level}
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={profileData.education_level}
                        onChange={(e) => handleInputChange('education_level', e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">{currentContent.form.education_level}</option>
                        <option value="high_school">{currentContent.education_levels.high_school}</option>
                        <option value="undergraduate">{currentContent.education_levels.undergraduate}</option>
                        <option value="graduate">{currentContent.education_levels.graduate}</option>
                        <option value="phd">{currentContent.education_levels.phd}</option>
                        <option value="other">{currentContent.education_levels.other}</option>
                      </select>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentContent.form.bio}
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={currentContent.form.bio}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {currentContent.form.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{currentContent.messages.saving}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>{currentContent.form.save}</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 