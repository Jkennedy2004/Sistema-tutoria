export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  userType?: 'student' | 'tutor'
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  userType: 'student' | 'tutor'
}

export interface RegisterResult {
  success: boolean
  email?: string
  error?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<RegisterResult>
  logout: () => Promise<void>
  clearError: () => void
} 