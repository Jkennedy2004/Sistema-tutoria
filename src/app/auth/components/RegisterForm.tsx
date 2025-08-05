'use client'

import { useState } from 'react'
import { useAuth } from '../../../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, UserPlus, GraduationCap, BookOpen } from 'lucide-react'
import { useAccessibilityContext } from '../../../lib/accessibilityContext'

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student' // 'student' o 'tutor'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
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
      userTypeTitle: '¿Cómo quieres registrarte?',
      student: 'Estudiante',
      tutor: 'Tutor',
      studentDescription: 'Busco ayuda académica',
      tutorDescription: 'Ofrezco ayuda académica',
      fullName: 'Nombre Completo',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      namePlaceholder: 'Tu nombre completo',
      emailPlaceholder: 'tu@email.com',
      passwordPlaceholder: 'Tu contraseña',
      confirmPasswordPlaceholder: 'Confirma tu contraseña',
      createAccountStudent: 'Crear Cuenta como Estudiante',
      createAccountTutor: 'Crear Cuenta como Tutor',
      creatingAccount: 'Creando cuenta...',
      validationErrors: {
        name: 'El nombre es requerido',
        email: 'El email es requerido',
        emailInvalid: 'El email no es válido',
        password: 'La contraseña es requerida',
        passwordLength: 'La contraseña debe tener al menos 6 caracteres',
        confirmPassword: 'Las contraseñas no coinciden',
        userType: 'Debes seleccionar un tipo de usuario'
      }
    },
    en: {
      title: 'Create Account',
      subtitle: 'Already have an account?',
      loginLink: 'Login here',
      backToHome: 'Back to home',
      userTypeTitle: 'How do you want to register?',
      student: 'Student',
      tutor: 'Tutor',
      studentDescription: 'I seek academic help',
      tutorDescription: 'I offer academic help',
      fullName: 'Full Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      namePlaceholder: 'Your full name',
      emailPlaceholder: 'your@email.com',
      passwordPlaceholder: 'Your password',
      confirmPasswordPlaceholder: 'Confirm your password',
      createAccountStudent: 'Create Account as Student',
      createAccountTutor: 'Create Account as Tutor',
      creatingAccount: 'Creating account...',
      validationErrors: {
        name: 'Name is required',
        email: 'Email is required',
        emailInvalid: 'Email is not valid',
        password: 'Password is required',
        passwordLength: 'Password must be at least 6 characters',
        confirmPassword: 'Passwords do not match',
        userType: 'You must select a user type'
      }
    }
  }

  const currentContent = content[language]

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    if (!formData.name.trim()) {
      errors.name = currentContent.validationErrors.name
    }

    if (!formData.email.trim()) {
      errors.email = currentContent.validationErrors.email
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = currentContent.validationErrors.emailInvalid
    }

    if (!formData.password) {
      errors.password = currentContent.validationErrors.password
    } else if (formData.password.length < 6) {
      errors.password = currentContent.validationErrors.passwordLength
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = currentContent.validationErrors.confirmPassword
    }

    if (!formData.userType) {
      errors.userType = currentContent.validationErrors.userType
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!validateForm()) {
      return
    }

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        userType: formData.userType as 'student' | 'tutor'
      })
      
      if (result.success) {
        // Si el registro es exitoso, redirigir a la página de verificación
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        // El error ya está establecido en el estado por la función register
        console.error('Error en registro:', result.error)
      }
    } catch (error) {
      console.error('Error en registro:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }))
    }
  }

  const handleUserTypeChange = (userType: 'student' | 'tutor') => {
    setFormData(prev => ({
      ...prev,
      userType
    }))
    
    // Limpiar error de validación
    if (validationErrors.userType) {
      setValidationErrors(prev => ({
        ...prev,
        userType: ''
      }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <a 
              href="/" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              aria-label={currentContent.backToHome}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {currentContent.backToHome}
            </a>
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
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
              {validationErrors.userType && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.userType}</p>
              )}
            </div>

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
                    validationErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={currentContent.namePlaceholder}
                  aria-label={currentContent.fullName}
                />
              </div>
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

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
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={currentContent.emailPlaceholder}
                  aria-label={currentContent.email}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

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
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
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
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

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
                    validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
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
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={loading ? currentContent.creatingAccount : (formData.userType === 'student' ? currentContent.createAccountStudent : currentContent.createAccountTutor)}
            >
              {loading ? (
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
        </form>
      </div>
    </div>
  )
} 