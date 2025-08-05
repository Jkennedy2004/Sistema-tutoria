'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAccessibilityContext } from '../../../lib/accessibilityContext'
import { supabase } from '../../../lib/supabase/client'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const { language } = useAccessibilityContext()
  const router = useRouter()

  // Pre-populate email from URL parameters if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [])

  // Contenido basado en idioma
  const content = {
    es: {
      title: 'Verifica tu correo electrónico',
      subtitle: 'Hemos enviado un enlace de verificación a tu correo electrónico',
      description: 'Para completar tu registro, por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación que te enviamos.',
      checkSpam: 'Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.',
      emailPlaceholder: 'tu@email.com',
      resendButton: 'Reenviar correo de verificación',
      backToLogin: 'Volver al inicio de sesión',
      backToHome: 'Volver al inicio',
      verificationSent: 'Correo de verificación enviado',
      errorMessage: 'Error al reenviar el correo de verificación',
      emailRequired: 'El correo electrónico es requerido',
      emailInvalid: 'El correo electrónico no es válido'
    },
    en: {
      title: 'Verify your email',
      subtitle: 'We have sent a verification link to your email',
      description: 'To complete your registration, please check your inbox and click on the verification link we sent you.',
      checkSpam: 'If you don\'t find the email, check your spam or junk folder.',
      emailPlaceholder: 'your@email.com',
      resendButton: 'Resend verification email',
      backToLogin: 'Back to login',
      backToHome: 'Back to home',
      verificationSent: 'Verification email sent',
      errorMessage: 'Error sending verification email',
      emailRequired: 'Email is required',
      emailInvalid: 'Email is not valid'
    }
  }

  const currentContent = content[language]

  const handleResendEmail = async () => {
    if (!email.trim()) {
      alert(currentContent.emailRequired)
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      alert(currentContent.emailInvalid)
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        alert(currentContent.errorMessage)
        console.error('Error resending email:', error)
      } else {
        alert(currentContent.verificationSent)
      }
    } catch (error) {
      alert(currentContent.errorMessage)
      console.error('Error resending email:', error)
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
          
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {currentContent.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {currentContent.subtitle}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-gray-700 mb-4">
              {currentContent.description}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {currentContent.checkSpam}
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentContent.emailPlaceholder}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={currentContent.emailPlaceholder}
                />
              </div>
              
              <button
                onClick={handleResendEmail}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {currentContent.resendButton}
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <a 
            href="/auth/login" 
            className="font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentContent.backToLogin}
          </a>
        </div>
      </div>
    </div>
  )
} 