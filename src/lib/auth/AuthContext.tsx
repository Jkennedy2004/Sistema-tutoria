'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { AuthContextType, AuthState, LoginCredentials, RegisterCredentials, RegisterResult } from '../../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  // Función para obtener el perfil del usuario desde Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      if (profile) {
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar_url: profile.avatar_url,
          userType: profile.user_type as 'student' | 'tutor',
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }
      }

      return null
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return
      }

      if (session?.user) {
        // Obtener el perfil completo del usuario desde la base de datos
        const userProfile = await fetchUserProfile(session.user.id)
        
        if (userProfile) {
          setState(prev => ({ ...prev, user: userProfile, loading: false }))
        } else {
          // Si no hay perfil, usar datos básicos del auth
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
            userType: 'student' as const, // Default fallback
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
          }
          setState(prev => ({ ...prev, user: userData, loading: false }))
        }
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Obtener el perfil completo del usuario desde la base de datos
          const userProfile = await fetchUserProfile(session.user.id)
          
          if (userProfile) {
            setState(prev => ({ ...prev, user: userProfile, error: null }))
          } else {
            // Si no hay perfil, usar datos básicos del auth
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || '',
              avatar_url: session.user.user_metadata?.avatar_url || '',
              userType: 'student' as const, // Default fallback
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at
            }
            setState(prev => ({ ...prev, user: userData, error: null }))
          }
        } else if (event === 'SIGNED_OUT') {
          setState(prev => ({ ...prev, user: null, error: null }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return
      }

      // Si el login es exitoso, obtener el perfil completo
      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id)
        if (userProfile) {
          setState(prev => ({ ...prev, user: userProfile, loading: false }))
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error de inicio de sesión', 
        loading: false 
      }))
    }
  }

  const register = async (credentials: RegisterCredentials): Promise<RegisterResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log('Attempting to register user with data:', {
        email: credentials.email,
        name: credentials.name,
        userType: credentials.userType
      })

      // Verificar si el email ya existe antes del registro
      console.log('🔍 Verificando si el email ya existe...')
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', credentials.email.trim().toLowerCase())
      
      console.log('📊 Verificación de email existente:', { existingProfile, checkError })
      
      if (existingProfile && existingProfile.length > 0) {
        console.log('❌ Email ya existe, registro cancelado')
        setState(prev => ({ ...prev, error: 'Este email ya está registrado', loading: false }))
        return { success: false, error: 'Este email ya está registrado' }
      }

      // Primero, crear el usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            userType: credentials.userType
          }
        }
      })

      if (error) {
        console.error('Supabase registration error:', {
          message: error.message,
          code: error.code
        })
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      console.log('Registration successful:', data)

      // Si el registro fue exitoso, crear el perfil
      if (data.user) {
        try {
          console.log('Creating profile for user:', data.user.id)
          
          // Usar solo la función RPC para crear el perfil
          const { error: rpcError } = await supabase
            .rpc('create_user_profile', {
              user_id: data.user.id,
              user_email: credentials.email,
              user_name: credentials.name,
              user_type: credentials.userType
            })
          
          if (rpcError) {
            console.error('Error creating profile with RPC:', rpcError)
            // No bloquear el registro si falla la creación del perfil
            console.warn('Profile creation failed, but user registration was successful')
          } else {
            console.log('Profile created successfully with RPC')
          }
        } catch (profileError) {
          console.error('Error in profile creation:', profileError)
          // No bloquear el registro si falla la creación del perfil
          console.warn('Profile creation failed, but user registration was successful')
        }
      }

      // No establecer el usuario como logueado automáticamente
      // En su lugar, solo indicar que el registro fue exitoso
      setState(prev => ({ ...prev, loading: false }))
      return { success: true, email: credentials.email }
    } catch (error) {
      console.error('Registration catch error:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error de registro', 
        loading: false 
      }))
      return { success: false, error: error instanceof Error ? error.message : 'Error de registro' }
    }
  }

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
      } else {
        setState(prev => ({ ...prev, user: null, loading: false }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error de cierre de sesión', 
        loading: false 
      }))
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 