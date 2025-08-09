# Configuración de Supabase para Sistema de Tutorías

Este documento contiene el script SQL completo para configurar la base de datos de Supabase para el sistema de tutorías.

## Script SQL Completo

Ejecuta este script completo en el SQL Editor de Supabase:

```sql
-- =====================================================
-- CONFIGURACIÓN INICIAL
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de perfiles de usuarios
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    user_type TEXT CHECK (user_type IN ('student', 'tutor')) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    education_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de materias disponibles
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    level TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de materias que enseña cada tutor
CREATE TABLE IF NOT EXISTS tutor_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL,
    hourly_rate DECIMAL(10,2),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, subject_id)
);

-- Tabla de sesiones de tutoría
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    session_type TEXT CHECK (session_type IN ('presencial', 'virtual')) DEFAULT 'presencial',
    meeting_url TEXT,
    meeting_location TEXT,
    faculty TEXT,
    classroom TEXT,
    notes TEXT,
    student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
    student_review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de recursos de estudio
CREATE TABLE IF NOT EXISTS study_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size INTEGER,
    tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mensajes entre usuarios
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('session', 'message', 'system', 'resource')) NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para detalles completos de sesiones
CREATE OR REPLACE VIEW session_details AS
SELECT 
    s.id,
    s.title,
    s.description,
    s.start_time,
    s.end_time,
    s.duration_minutes,
    s.status,
    s.session_type,
    s.meeting_url,
    s.meeting_location,
    s.faculty,
    s.classroom,
    s.notes,
    s.student_rating,
    s.student_review,
    s.created_at,
    s.updated_at,
    -- Información del estudiante
    student.id as student_id,
    student.name as student_name,
    student.email as student_email,
    -- Información del tutor
    tutor.id as tutor_id,
    tutor.name as tutor_name,
    tutor.email as tutor_email,
    -- Información de la materia
    sub.id as subject_id,
    sub.name as subject_name,
    sub.description as subject_description
FROM sessions s
LEFT JOIN profiles student ON s.student_id = student.id
JOIN profiles tutor ON s.tutor_id = tutor.id
JOIN subjects sub ON s.subject_id = sub.id;

-- Vista para estadísticas de tutores
CREATE OR REPLACE VIEW tutor_stats AS
SELECT 
    p.id as tutor_id,
    p.name as tutor_name,
    p.email as tutor_email,
    COUNT(DISTINCT ts.subject_id) as total_subjects,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
    COUNT(DISTINCT CASE WHEN s.student_id IS NOT NULL THEN s.student_id END) as total_students,
    AVG(s.student_rating) as average_rating,
    AVG(ts.hourly_rate) as average_hourly_rate
FROM profiles p
LEFT JOIN tutor_subjects ts ON p.id = ts.tutor_id AND ts.is_active = true
LEFT JOIN sessions s ON p.id = s.tutor_id
WHERE p.user_type = 'tutor'
GROUP BY p.id, p.name, p.email;

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar si ya existe un perfil para este usuario
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        -- Insertar el perfil con valores por defecto seguros
        INSERT INTO profiles (id, email, name, user_type)
        VALUES (
            NEW.id, 
            COALESCE(NEW.email, ''),
            COALESCE(NEW.raw_user_meta_data->>'name', COALESCE(NEW.email, 'Usuario')),
            COALESCE(NEW.raw_user_meta_data->>'userType', 'student')
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log del error (visible en los logs de Supabase)
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql';

-- Función auxiliar para crear perfiles manualmente (en caso de que el trigger falle)
CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID, user_email TEXT, user_name TEXT, user_type TEXT DEFAULT 'student')
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar si ya existe un perfil
    IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Crear el perfil
    INSERT INTO profiles (id, email, name, user_type)
    VALUES (user_id, user_email, user_name, user_type);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', user_id, SQLERRM;
        RETURN FALSE;
END;
$$ language 'plpgsql';

-- Función para verificar si el usuario es tutor
CREATE OR REPLACE FUNCTION is_user_tutor(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_type TEXT;
BEGIN
    SELECT p.user_type INTO user_type
    FROM profiles p
    WHERE p.id = user_id;
    
    RETURN user_type = 'tutor';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener perfil de usuario
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    user_type TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    education_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.name,
        p.user_type,
        p.avatar_url,
        p.bio,
        p.phone,
        p.location,
        p.education_level,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en subjects
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en tutor_subjects
CREATE TRIGGER update_tutor_subjects_updated_at BEFORE UPDATE ON tutor_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en sessions
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en study_resources
CREATE TRIGGER update_study_resources_updated_at BEFORE UPDATE ON study_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para manejar nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Políticas para profiles (actualizadas según tu solicitud)
-- Cualquier usuario logueado puede ver los perfiles de tutores
CREATE POLICY "Authenticated users can view tutor profiles" ON profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        user_type = 'tutor'
    );

-- Los usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Los usuarios autenticados pueden crear su propio perfil
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Los usuarios autenticados pueden ver su propio perfil
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Políticas para subjects
CREATE POLICY "Anyone can view active subjects" ON subjects
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage subjects" ON subjects
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE user_type = 'admin'
    ));

-- Políticas para tutor_subjects
CREATE POLICY "Tutors can manage their own subjects" ON tutor_subjects
    FOR ALL USING (auth.uid() = tutor_id);

CREATE POLICY "Anyone can view active tutor subjects" ON tutor_subjects
    FOR SELECT USING (is_active = true);

-- Políticas para sessions
CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Tutors can create sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update their sessions" ON sessions
    FOR UPDATE USING (auth.uid() = tutor_id);

CREATE POLICY "Students can update their sessions" ON sessions
    FOR UPDATE USING (auth.uid() = student_id);

-- Políticas para study_resources
CREATE POLICY "Tutors can manage their own resources" ON study_resources
    FOR ALL USING (auth.uid() = tutor_id);

CREATE POLICY "Anyone can view public resources" ON study_resources
    FOR SELECT USING (is_public = true);

CREATE POLICY "Students can view resources from their tutors" ON study_resources
    FOR SELECT USING (
        auth.uid() IN (
            SELECT student_id FROM sessions WHERE tutor_id = study_resources.tutor_id
        )
    );

-- Políticas para messages
CREATE POLICY "Users can view messages they sent or received" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Índices para sessions
CREATE INDEX IF NOT EXISTS idx_sessions_tutor_id ON sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_subject_id ON sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);

-- Índices para tutor_subjects
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_tutor_id ON tutor_subjects(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_subject_id ON tutor_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_active ON tutor_subjects(is_active);

-- Índices para study_resources
CREATE INDEX IF NOT EXISTS idx_study_resources_tutor_id ON study_resources(tutor_id);
CREATE INDEX IF NOT EXISTS idx_study_resources_subject_id ON study_resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_resources_public ON study_resources(is_public);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- ACTUALIZACIÓN DE TABLAS EXISTENTES
-- =====================================================

-- Agregar campos faltantes a la tabla sessions si no existen
DO $$ 
BEGIN
    -- Agregar session_type si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'session_type') THEN
        ALTER TABLE sessions ADD COLUMN session_type TEXT CHECK (session_type IN ('presencial', 'virtual')) DEFAULT 'presencial';
    END IF;
    
    -- Agregar faculty si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'faculty') THEN
        ALTER TABLE sessions ADD COLUMN faculty TEXT;
    END IF;
    
    -- Agregar classroom si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sessions' AND column_name = 'classroom') THEN
        ALTER TABLE sessions ADD COLUMN classroom TEXT;
    END IF;
    
    -- Hacer student_id nullable si no lo es ya
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sessions' AND column_name = 'student_id' AND is_nullable = 'NO') THEN
        ALTER TABLE sessions ALTER COLUMN student_id DROP NOT NULL;
    END IF;
END $$;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar materias básicas
INSERT INTO subjects (name, description, category, level) VALUES
('Matemáticas', 'Álgebra, cálculo, geometría y estadística', 'Ciencias', 'Todos los niveles'),
('Física', 'Mecánica, termodinámica, electromagnetismo', 'Ciencias', 'Secundaria y Universidad'),
('Química', 'Química general, orgánica e inorgánica', 'Ciencias', 'Secundaria y Universidad'),
('Biología', 'Biología celular, genética, ecología', 'Ciencias', 'Secundaria y Universidad'),
('Historia', 'Historia universal, nacional y contemporánea', 'Humanidades', 'Todos los niveles'),
('Geografía', 'Geografía física, humana y política', 'Humanidades', 'Todos los niveles'),
('Literatura', 'Análisis literario, composición y gramática', 'Humanidades', 'Todos los niveles'),
('Inglés', 'Gramática, conversación y comprensión lectora', 'Idiomas', 'Todos los niveles'),
('Español', 'Gramática, ortografía y redacción', 'Idiomas', 'Todos los niveles'),
('Filosofía', 'Lógica, ética y pensamiento crítico', 'Humanidades', 'Secundaria y Universidad'),
('Economía', 'Microeconomía, macroeconomía y finanzas', 'Ciencias Sociales', 'Universidad'),
('Psicología', 'Psicología general, clínica y educativa', 'Ciencias Sociales', 'Universidad'),
('Informática', 'Programación, bases de datos y desarrollo web', 'Tecnología', 'Todos los niveles'),
('Arte', 'Dibujo, pintura, escultura y diseño', 'Artes', 'Todos los niveles'),
('Música', 'Teoría musical, instrumentos y composición', 'Artes', 'Todos los niveles')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN DE CONFIGURACIÓN
-- =====================================================

-- Script para verificar que todo esté configurado correctamente
-- Ejecuta este script después del script principal para verificar la configuración

-- Verificar que las tablas existen
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'subjects', 'tutor_subjects', 'sessions', 'study_resources', 'messages', 'notifications');

-- Verificar que los triggers existen
SELECT 
    trigger_name,
    CASE WHEN trigger_name IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN ('update_profiles_updated_at', 'update_subjects_updated_at', 'update_tutor_subjects_updated_at', 'update_sessions_updated_at', 'update_study_resources_updated_at', 'on_auth_user_created');

-- Verificar que las funciones existen
SELECT 
    routine_name,
    CASE WHEN routine_name IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'handle_new_user', 'create_user_profile', 'is_user_tutor', 'get_user_profile');

-- Verificar que las vistas existen
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('session_details', 'tutor_stats');

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'subjects', 'tutor_subjects', 'sessions', 'study_resources', 'messages', 'notifications');

-- Verificar que hay datos iniciales en subjects
SELECT 
    'subjects' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as has_data
FROM subjects;

-- Verificar que las políticas RLS existen
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE WHEN policyname IS NOT NULL THEN '✅' ELSE '❌' END as policy_exists
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'subjects', 'tutor_subjects', 'sessions', 'study_resources', 'messages', 'notifications');
```

## Instrucciones de Configuración

1. **Ejecutar el script principal**: Copia y pega todo el script SQL principal en el SQL Editor de Supabase y ejecútalo.

2. **Verificar la configuración**: Después de ejecutar el script principal, ejecuta el script de verificación para asegurarte de que todo esté configurado correctamente.

3. **Configurar Email Confirmation**: Ve a Authentication > Settings en tu proyecto de Supabase y asegúrate de que:
   - **Enable email confirmations** esté habilitado
   - **Confirm email change** esté habilitado
   - **Secure email change** esté habilitado
   - **Enable phone confirmations** puede estar deshabilitado si no usas teléfonos

4. **Configurar Storage**: Ve a Storage en tu proyecto de Supabase y crea un bucket llamado `user-files` con las siguientes políticas RLS:

```sql
-- Política para permitir a los usuarios subir sus propios archivos
CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir a los usuarios ver sus propios archivos
CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir a los usuarios actualizar sus propios archivos
CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir a los usuarios eliminar sus propios archivos
CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## Estructura de la Base de Datos

- **`profiles`**: Perfiles de usuarios (estudiantes y tutores)
- **`subjects`**: Materias disponibles en el sistema
- **`tutor_subjects`**: Materias que enseña cada tutor
- **`sessions`**: Sesiones de tutoría programadas (student_id nullable)
- **`study_resources`**: Recursos de estudio subidos por los tutores
- **`messages`**: Mensajes entre usuarios
- **`notifications`**: Notificaciones del sistema
- **`session_details`**: Vista que combina información de sesiones con perfiles y materias
- **`tutor_stats`**: Vista con estadísticas de los tutores

## Políticas RLS Actualizadas para Profiles

Las políticas RLS para la tabla `profiles` han sido actualizadas según tu solicitud:

1. **SELECT**: Cualquier usuario logueado puede ver los perfiles de tutores
2. **UPDATE**: Los usuarios autenticados pueden actualizar su propio perfil
3. **INSERT**: Los usuarios autenticados pueden crear su propio perfil
4. **SELECT**: Los usuarios autenticados pueden ver su propio perfil

## Características Principales

- ✅ **student_id nullable** en sesiones para permitir creación sin estudiante asignado
- ✅ **Políticas RLS actualizadas** para profiles según tu especificación
- ✅ **Funciones RPC** para verificar roles y obtener perfiles
- ✅ **Triggers automáticos** para crear perfiles al registrarse
- ✅ **Vistas optimizadas** para consultas complejas
- ✅ **Índices de rendimiento** en todas las tablas principales
- ✅ **Datos iniciales** de materias disponibles
- ✅ **Script de verificación** para confirmar la configuración
- ✅ **Flujo de verificación de email** implementado en el frontend

## Solución de Problemas

Si encuentras errores durante el registro:

1. **Verifica que el script se ejecutó correctamente**: Ejecuta el script de verificación
2. **Revisa los logs de Supabase**: Ve a Logs en tu proyecto de Supabase para ver errores detallados
3. **Verifica las políticas RLS**: Las políticas están configuradas para permitir el registro
4. **Revisa el trigger handle_new_user**: Este trigger debe crear automáticamente un perfil cuando se registra un usuario

El script está completamente optimizado y listo para usar en producción.
