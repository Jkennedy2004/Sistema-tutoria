import React, { useState, useEffect } from "react"
import { supabase } from '../lib/supabase/client'

interface ContactModalProps {
  open: boolean
  onClose: () => void
  initialEmail?: string
}

export const ContactModal: React.FC<ContactModalProps> = ({ open, onClose, initialEmail = "" }) => {
  const [form, setForm] = useState({
    name: "",
    email: initialEmail,
    subject: "",
    message: "",
    honeypot: ""
  })
  const [errors, setErrors] = useState<any>({})
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Actualizar email cuando cambie la prop
  useEffect(() => {
    if (initialEmail) {
      setForm(prev => ({ ...prev, email: initialEmail }))
    }
  }, [initialEmail])

  if (!open) return null

  const validate = () => {
    const newErrors: any = {}
    if (!form.name.trim()) newErrors.name = "El nombre es obligatorio."
    if (!form.email.trim()) newErrors.email = "El correo es obligatorio."
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = "Correo inválido."
    if (!form.subject.trim()) newErrors.subject = "El asunto es obligatorio."
    if (!form.message.trim()) newErrors.message = "El mensaje es obligatorio."
    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined, submit: undefined })
  }

  const handleCancel = () => {
    setForm({ name: "", email: "", subject: "", message: "", honeypot: "" })
    setErrors({})
    setSuccess(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    if (form.honeypot) return // anti-spam
    setSubmitting(true)

    // Enviar a Supabase
    const { error } = await supabase.from('contact_messages').insert([{
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message
    }])

    setSubmitting(false)
    if (!error) {
      setSuccess(true)
      setForm({ name: "", email: "", subject: "", message: "", honeypot: "" })
    } else {
      setErrors({ submit: "Hubo un error al enviar el mensaje. Intenta de nuevo." })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 w-full max-w-4xl p-6 sm:p-8 relative animate-modalIn">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none transition-colors"
          onClick={handleCancel}
          aria-label="Cerrar formulario de contacto"
        >
          ×
        </button>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 text-blue-700 text-center">Contáctanos</h2>
        <p className="mb-5 text-gray-600 text-sm text-center">¿Tienes dudas, sugerencias o necesitas ayuda? Completa el formulario y te responderemos pronto.</p>
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded text-center text-sm shadow">¡Mensaje enviado exitosamente!</div>
        )}
        {errors.submit && (
          <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-center text-sm shadow">{errors.submit}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <input type="text" name="honeypot" value={form.honeypot} onChange={handleChange} className="hidden" tabIndex={-1} autoComplete="off" />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className={`input-field mt-0 text-sm bg-gray-50 border-2 focus:border-blue-400 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                value={form.name}
                onChange={handleChange}
                disabled={submitting}
                required
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`input-field mt-0 text-sm bg-gray-50 border-2 focus:border-blue-400 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
                required
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-xs font-semibold text-gray-700 mb-1">Asunto</label>
            <input
              id="subject"
              name="subject"
              type="text"
              className={`input-field mt-0 text-sm bg-gray-50 border-2 focus:border-blue-400 ${errors.subject ? 'border-red-400' : 'border-gray-200'}`}
              value={form.subject}
              onChange={handleChange}
              disabled={submitting}
              required
            />
            {errors.subject && <p className="text-red-600 text-xs mt-1">{errors.subject}</p>}
          </div>
          <div>
            <label htmlFor="message" className="block text-xs font-semibold text-gray-700 mb-1">Mensaje</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className={`input-field mt-0 text-sm bg-gray-50 border-2 focus:border-blue-400 resize-none ${errors.message ? 'border-red-400' : 'border-gray-200'}`}
              value={form.message}
              onChange={handleChange}
              disabled={submitting}
              required
            />
            {errors.message && <p className="text-red-600 text-xs mt-1">{errors.message}</p>}
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <button type="button" className="btn-secondary w-1/2 py-2 text-sm" onClick={handleCancel} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn-primary w-1/2 py-2 text-sm" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar'}</button>
          </div>
        </form>
      </div>
      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modalIn { animation: modalIn 0.25s cubic-bezier(.4,1.4,.6,1) both; }
      `}</style>
    </div>
  )
}
