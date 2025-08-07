'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { useAccessibilityContext } from '../../../lib/accessibilityContext'

interface FormData {
  email: string
  password: string
  rememberMe: boolean
}

interface ValidationState {
  [key: string]: {
    isValid: boolean
    message: string
    isTouched: boolean
  }
}

export function LoginForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [validationState, setValidationState] = useState<ValidationState>({
    email: { isValid: false, message: '', isTouched: false },
    password: { isValid: false, message: '', isTouched: false }
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const { login, loading, error, clearError } = useAuth()
  const { language } = useAccessibilityContext()
  const router = useRouter()

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Iniciar Sesión',
      subtitle: '¿No tienes una cuenta?',
      registerLink: 'Regístrate aquí',
      backToHome: 'Volver al inicio',
      email: 'Correo Electrónico *',
      password: 'Contraseña *',
      emailPlaceholder: 'tu@email.com',
      passwordPlaceholder: 'Tu contraseña',
      rememberMe: 'Recordarme',
      forgotPassword: '¿Olvidaste tu contraseña?',
      loginButton: 'Iniciar Sesión',
      loggingIn: 'Iniciando sesión...',
      success: '¡Inicio de sesión exitoso!',
      redirecting: 'Redirigiendo...',
      validationErrors: {
        email: 'El email es requerido',
        emailInvalid: 'El email no es válido',
        password: 'La contraseña es requerida',
        passwordLength: 'La contraseña debe tener al menos 6 caracteres'
      }
    },
    en: {
      title: 'Login',
      subtitle: "Don't have an account?",
      registerLink: 'Register here',
      backToHome: 'Back to home',
      email: 'Email *',
      password: 'Password *',
      emailPlaceholder: 'your@email.com',
      passwordPlaceholder: 'Your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot your password?',
      loginButton: 'Login',
      loggingIn: 'Logging in...',
      success: 'Login successful!',
      redirecting: 'Redirecting...',
      validationErrors: {
        email: 'Email is required',
        emailInvalid: 'Email is not valid',
        password: 'Password is required',
        passwordLength: 'Password must be at least 6 characters'
      }
    }
  }

  const currentContent = content[language]

  // Validación en tiempo real
  useEffect(() => {
    const validateField = (name: string, value: string) => {
      let validation = { isValid: false, message: '', isTouched: true }
      
      switch (name) {
        case 'email':
          if (!value.trim()) {
            validation = { isValid: false, message: currentContent.validationErrors.email, isTouched: true }
          } else if (!/\S+@\S+\.\S+/.test(value)) {
            validation = { isValid: false, message: currentContent.validationErrors.emailInvalid, isTouched: true }
          } else {
            validation = { isValid: true, message: '', isTouched: true }
          }
          break
          
        case 'password':
          if (!value) {
            validation = { isValid: false, message: currentContent.validationErrors.password, isTouched: true }
          } else if (value.length < 6) {
            validation = { isValid: false, message: currentContent.validationErrors.passwordLength, isTouched: true }
          } else {
            validation = { isValid: true, message: '', isTouched: true }
          }
          break
      }
      
      return validation
    }

    // Solo validar campos que han sido tocados y han cambiado
    const newValidationState = { ...validationState }
    let hasChanges = false

    Object.keys(formData).forEach(key => {
      if (key !== 'rememberMe' && validationState[key]?.isTouched) {
        const value = formData[key as keyof FormData]
        if (typeof value === 'string') {
          const newValidation = validateField(key, value)
          if (JSON.stringify(newValidation) !== JSON.stringify(validationState[key])) {
            newValidationState[key] = newValidation
            hasChanges = true
          }
        }
      }
    })

    if (hasChanges) {
      setValidationState(newValidationState)
    }
  }, [formData.email, formData.password, currentContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    // Marcar todos los campos como tocados para mostrar todas las validaciones
    setValidationState(prev => {
      const newState = { ...prev }
      Object.keys(newState).forEach(key => {
        newState[key] = { ...newState[key], isTouched: true }
      })
      return newState
    })
    
    // Validar todos los campos
    const isValid = Object.values(validationState).every(field => field.isValid)
    if (!isValid) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await login({
        email: formData.email,
        password: formData.password
      })
      
      // Si el login es exitoso
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error) {
      console.error('Error en login:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-blue-600">{currentContent.redirecting}</span>
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
            <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              {currentContent.registerLink}
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
                  onBlur={() => {
                    if (!validationState.email.isTouched) {
                      setValidationState(prev => ({
                        ...prev,
                        email: { ...prev.email, isTouched: true }
                      }))
                    }
                  }}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    validationState.email.isTouched && !validationState.email.isValid ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={currentContent.emailPlaceholder}
                  aria-label={currentContent.email}
                />
                {validationState.email.isTouched && validationState.email.isValid && (
                  <CheckCircle className="absolute inset-y-0 right-0 pr-3 flex items-center h-5 w-5 text-green-500" />
                )}
              </div>
              {validationState.email.isTouched && !validationState.email.isValid && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationState.email.message}
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => {
                    if (!validationState.password.isTouched) {
                      setValidationState(prev => ({
                        ...prev,
                        password: { ...prev.password, isTouched: true }
                      }))
                    }
                  }}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    validationState.password.isTouched && !validationState.password.isValid ? 'border-red-300' : 'border-gray-300'
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
              {validationState.password.isTouched && !validationState.password.isValid && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationState.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                aria-label={currentContent.rememberMe}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                {currentContent.rememberMe}
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                {currentContent.forgotPassword}
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isSubmitting || !isFormValid}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={loading || isSubmitting ? currentContent.loggingIn : currentContent.loginButton}
            >
              {loading || isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {currentContent.loggingIn}
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  {currentContent.loginButton}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 