'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, UserPlus, GraduationCap, BookOpen, AlertCircle, CheckCircle } from 'lucide-react'
import { useAccessibilityContext } from '../../../lib/accessibilityContext'
import { supabase } from '../../../lib/supabase/client'

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  userType: 'student' | 'tutor'
}

export function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student'
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  const { register, loading, error, clearError } = useAuth()
  const { language } = useAccessibilityContext()
  const router = useRouter()

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Crear Cuenta',
      subtitle: '¿Ya tienes una cuenta?',
      loginLink: 'Inicia sesión aquí',
      backToHome: 'Volver al inicio',
      userTypeTitle: '¿Cómo quieres registrarte? *',
      student: 'Estudiante',
      tutor: 'Tutor',
      studentDescription: 'Busco ayuda académica',
      tutorDescription: 'Ofrezco ayuda académica',
      fullName: 'Nombre Completo *',
      email: 'Correo Electrónico *',
      password: 'Contraseña *',
      confirmPassword: 'Confirmar Contraseña *',
      namePlaceholder: 'Tu nombre completo',
      emailPlaceholder: 'tu@email.com',
      passwordPlaceholder: 'Tu contraseña',
      confirmPasswordPlaceholder: 'Confirma tu contraseña',
      createAccountStudent: 'Crear Cuenta como Estudiante',
      createAccountTutor: 'Crear Cuenta como Tutor',
      creatingAccount: 'Creando cuenta...',
      success: '¡Cuenta creada exitosamente!',
      successMessage: 'Te hemos enviado un correo de verificación. Por favor, revisa tu bandeja de entrada.',
      continue: 'Continuar',
              validationErrors: {
          name: 'El nombre es requerido',
          nameLength: 'El nombre debe tener al menos 2 caracteres',
          email: 'El email es requerido',
          emailInvalid: 'El email no es válido',
          emailExists: 'Este email ya está registrado. No puedes crear otra cuenta con el mismo correo.',
          password: 'La contraseña es requerida',
          passwordLength: 'La contraseña debe tener al menos 8 caracteres',
          confirmPassword: 'Las contraseñas no coinciden',
          userType: 'Debes seleccionar un tipo de usuario'
        }
    },
    en: {
      title: 'Create Account',
      subtitle: 'Already have an account?',
      loginLink: 'Login here',
      backToHome: 'Back to home',
      userTypeTitle: 'How do you want to register? *',
      student: 'Student',
      tutor: 'Tutor',
      studentDescription: 'I seek academic help',
      tutorDescription: 'I offer academic help',
      fullName: 'Full Name *',
      email: 'Email *',
      password: 'Password *',
      confirmPassword: 'Confirm Password *',
      namePlaceholder: 'Your full name',
      emailPlaceholder: 'your@email.com',
      passwordPlaceholder: 'Your password',
      confirmPasswordPlaceholder: 'Confirm your password',
      createAccountStudent: 'Create Account as Student',
      createAccountTutor: 'Create Account as Tutor',
      creatingAccount: 'Creating account...',
      success: 'Account created successfully!',
      successMessage: 'We have sent you a verification email. Please check your inbox.',
      continue: 'Continue',
              validationErrors: {
          name: 'Name is required',
          nameLength: 'Name must be at least 2 characters',
          email: 'Email is required',
          emailInvalid: 'Email is not valid',
          emailExists: 'This email is already registered. You cannot create another account with the same email.',
          password: 'Password is required',
          passwordLength: 'Password must be at least 8 characters',
          confirmPassword: 'Passwords do not match',
          userType: 'You must select a user type'
        }
    }
  }

  const currentContent = content[language]

  // Validación simple
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.name.trim()) {
      newErrors.name = currentContent.validationErrors.name
    } else if (formData.name.trim().length < 2) {
      newErrors.name = currentContent.validationErrors.nameLength
    }
    
    if (!formData.email.trim()) {
      newErrors.email = currentContent.validationErrors.email
         } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
       newErrors.email = currentContent.validationErrors.emailInvalid
     }
    
    if (!formData.password) {
      newErrors.password = currentContent.validationErrors.password
    } else if (formData.password.length < 8) {
      newErrors.password = currentContent.validationErrors.passwordLength
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = currentContent.validationErrors.confirmPassword
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    console.log('🔍 Validando formulario...')
    console.log('📝 Datos del formulario:', formData)
    
    const isValid = validateForm()
    console.log('✅ Formulario válido:', isValid)
    
    if (!isValid) {
      console.log('❌ Errores de validación:', errors)
      return
    }
    
    // Verificación final de email existente antes del registro
    if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
      try {
        console.log('🔍 Verificación final de email:', formData.email.trim().toLowerCase())
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email.trim().toLowerCase())
        
        console.log('📊 Resultado de verificación final:', { profileData, profileError })
        
        if (profileError) {
          console.log('❌ Error en verificación final:', profileError)
        }
        
        if (profileData && profileData.length > 0) {
          setErrors(prev => ({ 
            ...prev, 
            email: currentContent.validationErrors.emailExists 
          }))
          console.log('❌ Email ya existe, registro cancelado')
          return
        } else {
          console.log('✅ Email disponible para registro')
        }
      } catch (error) {
        console.log('❌ Error en verificación final de email:', error)
      }
    }
    
    console.log('🚀 Iniciando registro...')
    setIsSubmitting(true)
    
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        userType: formData.userType
      })
      
      console.log('📊 Resultado del registro:', result)
      
      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Error en registro:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validación de email en tiempo real
  useEffect(() => {
    const validateEmail = async () => {
      if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
        try {
          console.log('🔍 Validando email:', formData.email.trim().toLowerCase())
          
          // Verificar en la tabla profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', formData.email.trim().toLowerCase())
          
          console.log('📊 Resultado de validación profiles:', { profileData, profileError })
          
          if (profileError) {
            console.log('❌ Error en validación de perfil:', profileError)
          }
          
          // Si existe en profiles, mostrar error
          if (profileData && profileData.length > 0) {
            console.log('❌ Email ya existe en profiles')
            setErrors(prev => ({ 
              ...prev, 
              email: currentContent.validationErrors.emailExists 
            }))
          } else {
            console.log('✅ Email disponible')
            // Limpiar error de email si no existe
            setErrors(prev => ({ ...prev, email: '' }))
          }
        } catch (error) {
          console.log('❌ Error en validación de email:', error)
        }
      } else {
        // Si el email no es válido, limpiar el error de email existente
        setErrors(prev => ({ ...prev, email: '' }))
      }
    }

    // Debounce para evitar demasiadas consultas
    const timeoutId = setTimeout(validateEmail, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.email, currentContent.validationErrors.emailExists])

  const handleUserTypeChange = (userType: 'student' | 'tutor') => {
    setFormData(prev => ({
      ...prev,
      userType
    }))
  }

  const isFormValid = true

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentContent.success}
            </h2>
            <p className="text-gray-600 mb-6">
              {currentContent.successMessage}
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-blue-600">{currentContent.continue}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              aria-label={currentContent.backToHome}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {currentContent.backToHome}
            </button>
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {currentContent.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {currentContent.subtitle}{' '}
            <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              {currentContent.loginLink}
            </a>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {currentContent.userTypeTitle}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleUserTypeChange('student')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.userType === 'student'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  aria-label={`${currentContent.student}: ${currentContent.studentDescription}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <GraduationCap className="w-6 h-6" />
                    <span className="font-medium">{currentContent.student}</span>
                    <span className="text-xs text-center">{currentContent.studentDescription}</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleUserTypeChange('tutor')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.userType === 'tutor'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  aria-label={`${currentContent.tutor}: ${currentContent.tutorDescription}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <BookOpen className="w-6 h-6" />
                    <span className="font-medium">{currentContent.tutor}</span>
                    <span className="text-xs text-center">{currentContent.tutorDescription}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {currentContent.fullName}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={currentContent.namePlaceholder}
                  aria-label={currentContent.fullName}
                />
                {formData.name && !errors.name && (
                  <CheckCircle className="absolute inset-y-0 right-0 pr-3 flex items-center h-5 w-5 text-green-500" />
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {currentContent.email}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={currentContent.emailPlaceholder}
                  aria-label={currentContent.email}
                />
                {formData.email && !errors.email && (
                  <CheckCircle className="absolute inset-y-0 right-0 pr-3 flex items-center h-5 w-5 text-green-500" />
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {currentContent.password}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={currentContent.passwordPlaceholder}
                  aria-label={currentContent.password}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {currentContent.confirmPassword}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={currentContent.confirmPasswordPlaceholder}
                  aria-label={currentContent.confirmPassword}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle className="absolute inset-y-0 right-0 pr-8 flex items-center h-5 w-5 text-green-500" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isSubmitting || !isFormValid}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={loading || isSubmitting ? currentContent.creatingAccount : (formData.userType === 'student' ? currentContent.createAccountStudent : currentContent.createAccountTutor)}
            >
              {loading || isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {currentContent.creatingAccount}
                </div>
              ) : (
                <div className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {formData.userType === 'student' ? currentContent.createAccountStudent : currentContent.createAccountTutor}
                </div>
              )}
            </button>
          </div>
          
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-100 rounded">
            <p>Debug: isFormValid = {isFormValid.toString()}</p>
            <p>Debug: isSubmitting = {isSubmitting.toString()}</p>
            <p>Debug: loading = {loading.toString()}</p>
            <p>Debug: Errors = {Object.keys(errors).length}</p>
          </div>
        </form>
      </div>
    </div>
  )
} 