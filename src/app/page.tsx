'use client'

import { useState, useEffect, useRef } from 'react'
import {
  LogIn,
  UserPlus,
  BookOpen,
  Users,
  Award,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Accessibility,
  Globe,
  Volume2,
  Subtitles,
  FileText
} from 'lucide-react'
import { AccessibilityPanel } from '../components/accessibility/AccessibilityPanel'
import { useAccessibilityContext } from '../lib/accessibilityContext'
import { useAccessibility } from '../hooks/useAccessibility'
import { useContactModal } from '../components/ContactModalWrapper'

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()
  const accessibility = useAccessibility()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { openContactModal } = useContactModal()

  // Estados locales para debug
  const [debugClosedCaptions, setDebugClosedCaptions] = useState(false)
  const [debugAudioControls, setDebugAudioControls] = useState(false)
  const [debugTranscription, setDebugTranscription] = useState(false)
  
  // Estado para el email
  const [email, setEmail] = useState("")

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    console.log('Video accessibility controls updated:', {
      closedCaptions: accessibility.closedCaptions,
      audioControls: accessibility.audioControls,
      transcription: accessibility.transcription
    })
    
    function applyAccessibilitySettings() {
      if (!video) return
      
      // Subtítulos - usar el método correcto
      if (video.textTracks && video.textTracks.length > 0) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i]
          if (accessibility.closedCaptions) {
            track.mode = 'showing'
            console.log(`Track ${i} activado: ${track.mode}`)
          } else {
            track.mode = 'hidden'
            console.log(`Track ${i} desactivado: ${track.mode}`)
          }
        }
      }
      
      // Audio - silenciar cuando se activa el control
      video.muted = accessibility.audioControls
      console.log('Video muted:', video.muted)
      
      // Si se activan los controles de audio, también pausar el video
      if (accessibility.audioControls) {
        video.pause()
      }
    }
    
    // Esperar a que el video esté listo
    if (video.readyState >= 1) {
      applyAccessibilitySettings()
    } else {
      video.addEventListener('loadedmetadata', applyAccessibilitySettings)
    }
    
    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', applyAccessibilitySettings)
      }
    }
  }, [accessibility.closedCaptions, accessibility.audioControls, accessibility.transcription])

  // Efecto para mostrar transcripción cuando se active
  useEffect(() => {
    console.log('Accessibility states changed:', {
      closedCaptions: accessibility.closedCaptions,
      audioControls: accessibility.audioControls,
      transcription: accessibility.transcription
    })
    
    if (accessibility.transcription) {
      // Crear modal con transcripción
      const transcription = `Transcripción del video TutorPro

00:00:00 - 00:00:04: Alguna vez te has sentido frustrado intentando entender un tema sin éxito?

00:00:04 - 00:00:06: Yo sí. Estudiaba por horas y nada.

00:00:06 - 00:00:08: Hasta que descubrí TutorPro,

00:00:08 - 00:00:12: tutorías personalizadas en línea que se adaptan a tu forma de aprender.

00:00:12 - 00:00:17: Tutores expertos, horarios flexibles y lo mejor, realmente entiendes!

00:00:17 - 00:00:20: Ya no más frustración, ahora tengo confianza.

00:00:20 - 00:00:23: TutorPro cambió mi manera de estudiar para siempre.`

      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">Transcripción del Video</h3>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <pre class="whitespace-pre-wrap text-sm">${transcription}</pre>
        </div>
      `
      document.body.appendChild(modal)
    }
  }, [accessibility.transcription])

  // Content based on language
  const content = {
    es: {
      title: 'Organiza tu aprendizaje con',
      titleHighlight: 'TutorPro',
      subtitle: 'Aprende más rápido.',
      description: 'Cuando necesitas dominar teorías complejas y no tienes tiempo para organizar tu estudio, TutorPro se encarga de conectar estudiantes con tutores expertos para crear un aprendizaje efectivo y personalizado.',
      emailPlaceholder: 'Ingresa tu email para contactarnos',
      startButton: 'Contáctanos',
      loginButton: 'Iniciar Sesión',
      registerButton: 'Registrarse',
      featuresTitle: 'Una forma simple y probada de mejorar tu rendimiento académico',
      feature1: {
        title: 'Una Plataforma',
        description: 'No necesitas múltiples aplicaciones. Todo tu aprendizaje, recursos y comunicación con tutores en un solo lugar. Organiza tus teorías de manera eficiente.'
      },
      feature2: {
        title: 'Comunicación Directa',
        description: 'Conecta directamente con tutores expertos en cada materia. Resuelve dudas en tiempo real y recibe explicaciones personalizadas de teorías complejas.'
      },
      feature3: {
        title: 'Gestión Inteligente',
        description: 'Gestiona fácilmente tus sesiones de tutoría, progreso académico y recursos de estudio. Seguimiento detallado de tu evolución en cada teoría.'
      },
      footer: {
        description: 'La plataforma líder en educación personalizada. Conectamos estudiantes con tutores expertos para un aprendizaje efectivo y significativo.',
        contact: 'Contacto',
        quickLinks: 'Enlaces Rápidos',
        aboutUs: 'Acerca de Nosotros',
        services: 'Servicios',
        privacy: 'Política de Privacidad',
        terms: 'Términos de Servicio',
        copyright: '© 2024 TutorPro. Todos los derechos reservados.'
      }
    },
    en: {
      title: 'Organize your learning with',
      titleHighlight: 'TutorPro',
      subtitle: 'Learn faster.',
      description: 'When you need to master complex theories and don\'t have time to organize your studies, TutorPro takes care of connecting students with expert tutors to create effective and personalized learning.',
      emailPlaceholder: 'Enter your email to contact us',
      startButton: 'Contact Us',
      loginButton: 'Login',
      registerButton: 'Register',
      featuresTitle: 'A simple and proven way to improve your academic performance',
      feature1: {
        title: 'One Platform',
        description: 'You don\'t need multiple applications. All your learning, resources and communication with tutors in one place. Organize your theories efficiently.'
      },
      feature2: {
        title: 'Direct Communication',
        description: 'Connect directly with expert tutors in each subject. Solve doubts in real time and receive personalized explanations of complex theories.'
      },
      feature3: {
        title: 'Smart Management',
        description: 'Easily manage your tutoring sessions, academic progress and study resources. Detailed tracking of your evolution in each theory.'
      },
      footer: {
        description: 'The leading platform in personalized education. We connect students with expert tutors for effective and meaningful learning.',
        contact: 'Contact',
        quickLinks: 'Quick Links',
        aboutUs: 'About Us',
        services: 'Services',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        copyright: '© 2024 TutorPro. All rights reserved.'
      }
    }
  }

  const currentContent = content[language]

  return (
    <div className="min-h-screen bg-white">
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

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                TutorPro
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <a 
                href="/auth/login"
                className="btn-secondary"
                aria-label={currentContent.loginButton}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {currentContent.loginButton}
              </a>
              <a 
                href="/auth/register"
                className="btn-primary"
                aria-label={currentContent.registerButton}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {currentContent.registerButton}
              </a>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Abrir menú de navegación"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <a 
                  href="/auth/login"
                  className="btn-secondary w-full"
                  aria-label={currentContent.loginButton}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {currentContent.loginButton}
                </a>
                <a 
                  href="/auth/register"
                  className="btn-primary w-full"
                  aria-label={currentContent.registerButton}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {currentContent.registerButton}
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-8 fade-in">
              <h1 
                className="text-responsive font-bold text-gray-900 leading-tight"
                aria-label={`${currentContent.title} ${currentContent.titleHighlight}. ${currentContent.subtitle}`}
              >
                {currentContent.title}{' '}
                <span className="text-blue-600">{currentContent.titleHighlight}</span>.
                <br />
                {currentContent.subtitle}
              </h1>

              <p 
                className="text-lg text-gray-600 leading-relaxed max-w-2xl"
                aria-label={currentContent.description}
              >
                {currentContent.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder={currentContent.emailPlaceholder}
                    className="input-field"
                    aria-label="Campo de email para comenzar"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button 
                  className="btn-primary whitespace-nowrap"
                  aria-label={currentContent.startButton}
                  onClick={() => openContactModal(email)}
                >
                  {currentContent.startButton}
                </button>
              </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="relative fade-in">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>

                {/* Browser Window Mockup */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-2 -left-2 bg-blue-100 rounded-full p-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="absolute top-1/2 -right-4 bg-green-100 rounded-full p-3">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div className="absolute bottom-4 -left-4 bg-orange-100 rounded-full p-3">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              aria-label={currentContent.featuresTitle}
            >
              {currentContent.featuresTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card fade-in">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 
                className="text-xl font-semibold text-gray-900 mb-4"
                aria-label={currentContent.feature1.title}
              >
                {currentContent.feature1.title}
              </h3>
              <p 
                className="text-gray-600 leading-relaxed"
                aria-label={currentContent.feature1.description}
              >
                {currentContent.feature1.description}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card fade-in">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 
                className="text-xl font-semibold text-gray-900 mb-4"
                aria-label={currentContent.feature2.title}
              >
                {currentContent.feature2.title}
              </h3>
              <p 
                className="text-gray-600 leading-relaxed"
                aria-label={currentContent.feature2.description}
              >
                {currentContent.feature2.description}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card fade-in">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 
                className="text-xl font-semibold text-gray-900 mb-4"
                aria-label={currentContent.feature3.title}
              >
                {currentContent.feature3.title}
              </h3>
              <p 
                className="text-gray-600 leading-relaxed"
                aria-label={currentContent.feature3.description}
              >
                {currentContent.feature3.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accessible Video Section */}
      <section className="py-8 bg-white flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Video de introducción</h2>
        
        {/* Indicadores de accesibilidad */}
        <div className="mb-4 flex gap-4 text-sm">
          <div className={`px-3 py-1 rounded-full ${accessibility.closedCaptions ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            Subtítulos: {accessibility.closedCaptions ? 'Activados' : 'Desactivados'}
          </div>
          <div className={`px-3 py-1 rounded-full ${accessibility.audioControls ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
            Audio: {accessibility.audioControls ? 'Silenciado' : 'Activado'}
          </div>
          <div className={`px-3 py-1 rounded-full ${accessibility.transcription ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            Transcripción: {accessibility.transcription ? 'Disponible' : 'No disponible'}
          </div>
        </div>
        
        <video
          id="main-accessible-video"
          ref={videoRef}
          className="w-full max-w-4xl rounded-lg shadow-lg aspect-video"
          controls
          preload="metadata"
          aria-label="Video introductorio de TutorPro"
        >
          <source src="/Video.mp4" type="video/mp4" />
          <track
            label="Español"
            kind="subtitles"
            srcLang="es"
            src="/video.vtt"
            default
          />
          Tu navegador no soporta el elemento de video.
        </video>
        
        {/* Controles dinámicos según panel de accesibilidad */}
        <div className="mt-4 space-y-4">
          {/* Controles de Audio */}
          {debugAudioControls && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                <Volume2 className="w-4 h-4 mr-2" />
                Controles de Audio
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const video = videoRef.current
                    if (video) {
                      video.volume = Math.max(video.volume - 0.1, 0)
                    }
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Bajar Volumen
                </button>
                <button
                  onClick={() => {
                    const video = videoRef.current
                    if (video) {
                      video.volume = Math.min(video.volume + 0.1, 1)
                    }
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Subir Volumen
                </button>
                <button
                  onClick={() => {
                    const video = videoRef.current
                    if (video) {
                      video.muted = !video.muted
                    }
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  {videoRef.current?.muted ? 'Desmutear' : 'Mutear'}
                </button>
              </div>
            </div>
          )}

          {/* Controles de Subtítulos */}
          {debugClosedCaptions && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                <Subtitles className="w-4 h-4 mr-2" />
                Controles de Subtítulos
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const video = videoRef.current
                    if (video && video.textTracks.length > 0) {
                      video.textTracks[0].mode = 'showing'
                    }
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                >
                  Mostrar Subtítulos
                </button>
                <button
                  onClick={() => {
                    const video = videoRef.current
                    if (video && video.textTracks.length > 0) {
                      video.textTracks[0].mode = 'hidden'
                    }
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                >
                  Ocultar Subtítulos
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = '/video.vtt'
                    link.download = 'subtitulos-tutorpro.vtt'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                >
                  Descargar Subtítulos
                </button>
              </div>
            </div>
          )}

          {/* Controles de Transcripción */}
          {debugTranscription && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Controles de Transcripción
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const transcription = `Transcripción del video TutorPro

00:00:00 - 00:00:04: Alguna vez te has sentido frustrado intentando entender un tema sin éxito?

00:00:04 - 00:00:06: Yo sí. Estudiaba por horas y nada.

00:00:06 - 00:00:08: Hasta que descubrí TutorPro,

00:00:08 - 00:00:12: tutorías personalizadas en línea que se adaptan a tu forma de aprender.

00:00:12 - 00:00:17: Tutores expertos, horarios flexibles y lo mejor, realmente entiendes!

00:00:17 - 00:00:20: Ya no más frustración, ahora tengo confianza.

00:00:20 - 00:00:23: TutorPro cambió mi manera de estudiar para siempre.`

                    const blob = new Blob([transcription], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'transcripcion-tutorpro.txt'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Descargar Transcripción
                </button>
                <button
                  onClick={() => {
                    const transcription = `Transcripción del video TutorPro

00:00:00 - 00:00:04: Alguna vez te has sentido frustrado intentando entender un tema sin éxito?

00:00:04 - 00:00:06: Yo sí. Estudiaba por horas y nada.

00:00:06 - 00:00:08: Hasta que descubrí TutorPro,

00:00:08 - 00:00:12: tutorías personalizadas en línea que se adaptan a tu forma de aprender.

00:00:12 - 00:00:17: Tutores expertos, horarios flexibles y lo mejor, realmente entiendes!

00:00:17 - 00:00:20: Ya no más frustración, ahora tengo confianza.

00:00:20 - 00:00:23: TutorPro cambió mi manera de estudiar para siempre.`

                    const modal = document.createElement('div')
                    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
                    modal.innerHTML = `
                      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div class="flex justify-between items-center mb-4">
                          <h3 class="text-lg font-bold">Transcripción del Video</h3>
                          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            ✕
                          </button>
                        </div>
                        <pre class="whitespace-pre-wrap text-sm">${transcription}</pre>
                      </div>
                    `
                    document.body.appendChild(modal)
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Ver Transcripción
                </button>
              </div>
            </div>
          )}
        </div>
        
        <p className="mt-4 text-sm text-gray-600">
          Usa el panel de accesibilidad para controlar los subtítulos, audio y descargar recursos del video.
        </p>
        
        {/* Botón de prueba temporal */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Prueba de Controles</h4>
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log('Testing closedCaptions toggle')
                setDebugClosedCaptions(!debugClosedCaptions)
              }}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
            >
              Toggle Subtítulos
            </button>
            <button
              onClick={() => {
                console.log('Testing audioControls toggle')
                setDebugAudioControls(!debugAudioControls)
              }}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
            >
              Toggle Audio
            </button>
            <button
              onClick={() => {
                console.log('Testing transcription toggle')
                setDebugTranscription(!debugTranscription)
              }}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
            >
              Toggle Transcripción
            </button>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Estados actuales: Subtítulos: {debugClosedCaptions ? 'ON' : 'OFF'}, 
            Audio: {debugAudioControls ? 'ON' : 'OFF'}, 
            Transcripción: {debugTranscription ? 'ON' : 'OFF'}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">TutorPro</h3>
              <p className="text-gray-300 mb-6 max-w-md">
                {currentContent.footer.description}
              </p>

              {/* Social Media */}
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Síguenos en Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Síguenos en Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Síguenos en Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Síguenos en LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{currentContent.footer.contact}</h4>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Phone className="w-4 h-4 mr-3" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Mail className="w-4 h-4 mr-3" />
                  <span>info@tutorpro.com</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-4 h-4 mr-3" />
                  <span>Ciudad de México, México</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{currentContent.footer.quickLinks}</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    className="text-gray-300 hover:text-white transition-colors underline bg-transparent border-0 p-0 cursor-pointer"
                    aria-label={`Enlace a ${currentContent.footer.contact}`}
                    data-contact-modal-trigger
                  >
                    {currentContent.footer.contact}
                  </button>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label={`Enlace a ${currentContent.footer.aboutUs}`}>
                    {currentContent.footer.aboutUs}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label={`Enlace a ${currentContent.footer.services}`}>
                    {currentContent.footer.services}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label={`Enlace a ${currentContent.footer.privacy}`}>
                    {currentContent.footer.privacy}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label={`Enlace a ${currentContent.footer.terms}`}>
                    {currentContent.footer.terms}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>{currentContent.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
