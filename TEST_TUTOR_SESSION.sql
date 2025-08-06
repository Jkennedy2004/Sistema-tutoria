-- Consultar las sesiones existentes para verificar el estado
SELECT 
    id,
    title,
    status,
    session_type,
    tutor_id,
    start_time,
    participant_count
FROM sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar si hay sesiones con estado 'scheduled'
SELECT COUNT(*) as scheduled_sessions
FROM sessions 
WHERE status = 'scheduled';

-- Si no hay sesiones 'scheduled', crear una de prueba
-- (Nota: Reemplaza 'tu-tutor-id' con el ID real del tutor)
INSERT INTO sessions (
    title,
    description,
    start_time,
    end_time,
    duration_minutes,
    status,
    session_type,
    tutor_id,
    subject_id,
    faculty,
    classroom
) VALUES (
    'Sesión de Prueba - Matemáticas',
    'Sesión de prueba para verificar botones de acción',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    60,
    'scheduled',
    'presencial',
    (SELECT id FROM profiles WHERE role = 'tutor' LIMIT 1),
    (SELECT id FROM subjects WHERE name ILIKE '%matemática%' OR name ILIKE '%math%' LIMIT 1),
    'Facultad de Ciencias',
    'Aula 101'
);

-- Verificar que la sesión se creó correctamente
SELECT 
    id,
    title,
    status,
    session_type,
    tutor_id,
    start_time
FROM sessions 
WHERE title = 'Sesión de Prueba - Matemáticas';