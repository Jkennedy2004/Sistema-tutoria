# Configuración de Supabase

## Pasos para configurar Supabase:

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración

### 2. Obtener las credenciales
1. Ve a Settings > API en tu proyecto de Supabase
2. Copia la URL del proyecto
3. Copia la anon/public key

### 3. Configurar variables de entorno
1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 4. Configurar autenticación en Supabase
1. Ve a Authentication > Settings
2. Habilita Email auth
3. Configura las URLs de redirección:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

### 5. Crear tabla de usuarios
Es **RECOMENDADO** crear una tabla `profiles` para almacenar datos adicionales de los usuarios:

```sql
-- Crear tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
  phone TEXT,
  bio TEXT,
  subjects TEXT[], -- Array de materias que enseña (para tutores)
  hourly_rate DECIMAL(10,2), -- Tarifa por hora (para tutores)
  rating DECIMAL(3,2) DEFAULT 0.0, -- Calificación promedio
  total_sessions INTEGER DEFAULT 0, -- Total de sesiones
  is_verified BOOLEAN DEFAULT false, -- Verificación de identidad
  is_active BOOLEAN DEFAULT true, -- Estado activo/inactivo
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Tutors can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'tutor'
  )
);

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 6. Probar la aplicación
1. Ejecuta `npm run dev`
2. Ve a `http://localhost:3000`
3. Prueba el registro y login

### 7. Funcionalidades adicionales (opcional)

#### Tabla de sesiones de tutoría
```sql
CREATE TABLE tutoring_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  meeting_url TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own sessions" ON tutoring_sessions FOR SELECT USING (
  auth.uid() = student_id OR auth.uid() = tutor_id
);
CREATE POLICY "Users can insert own sessions" ON tutoring_sessions FOR INSERT WITH CHECK (
  auth.uid() = student_id OR auth.uid() = tutor_id
);
CREATE POLICY "Users can update own sessions" ON tutoring_sessions FOR UPDATE USING (
  auth.uid() = student_id OR auth.uid() = tutor_id
);
```

#### Tabla de materias
```sql
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar materias básicas
INSERT INTO subjects (name, description, category) VALUES
('Matemáticas', 'Álgebra, cálculo, geometría', 'Ciencias Exactas'),
('Física', 'Mecánica, termodinámica, electromagnetismo', 'Ciencias Exactas'),
('Química', 'Química general, orgánica, inorgánica', 'Ciencias Exactas'),
('Biología', 'Biología celular, genética, ecología', 'Ciencias Naturales'),
('Historia', 'Historia universal, nacional, contemporánea', 'Humanidades'),
('Literatura', 'Análisis literario, redacción, gramática', 'Humanidades'),
('Inglés', 'Gramática, conversación, preparación TOEFL', 'Idiomas'),
('Programación', 'JavaScript, Python, Java, C++', 'Tecnología');
```

## Estructura de archivos creada:

```
src/
├── app/
│   └── auth/
│       ├── login/
│       │   └── page.tsx
│       ├── register/
│       │   └── page.tsx
│       └── components/
│           ├── LoginForm.tsx
│           └── RegisterForm.tsx
├── lib/
│   ├── auth/
│   │   └── AuthContext.tsx
│   └── supabase/
│       └── client.ts
└── types/
    └── auth.ts
```

## Características implementadas:

### 🔐 Autenticación
- ✅ Autenticación con email/password
- ✅ Registro de usuarios
- ✅ Login de usuarios
- ✅ Logout
- ✅ Persistencia de sesión
- ✅ Redirección automática

### 🎨 Interfaz de Usuario
- ✅ Manejo de errores
- ✅ Validación de formularios
- ✅ Estados de carga
- ✅ Interfaz responsive
- ✅ Botones de navegación (volver al inicio)
- ✅ Diseño moderno con Tailwind CSS

### ♿ Accesibilidad
- ✅ Panel de accesibilidad en todas las páginas
- ✅ Lector de pantalla
- ✅ Controles de accesibilidad visual
- ✅ Controles de accesibilidad auditiva
- ✅ Cambio de idioma (Español/Inglés)
- ✅ Navegación por teclado

### 🗄️ Base de Datos
- ✅ Tabla de perfiles de usuario
- ✅ Tabla de sesiones de tutoría (opcional)
- ✅ Tabla de materias (opcional)
- ✅ Políticas de seguridad (RLS)
- ✅ Triggers automáticos 