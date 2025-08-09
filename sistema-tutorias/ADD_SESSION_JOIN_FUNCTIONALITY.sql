-- Add session join functionality for students and tutors
-- This allows students to join available sessions and tutors to see participants

-- Create a table to track session participants
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('joined', 'left', 'removed')) DEFAULT 'joined',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Add RLS policies for session_participants table
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Students can view their own session participations
CREATE POLICY "Students can view their own session participations" ON session_participants
    FOR SELECT USING (auth.uid() = student_id);

-- Students can join sessions
CREATE POLICY "Students can join sessions" ON session_participants
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can update their own participations (leave sessions)
CREATE POLICY "Students can update their own participations" ON session_participants
    FOR UPDATE USING (auth.uid() = student_id);

-- Students can delete their own participations
CREATE POLICY "Students can delete their own participations" ON session_participants
    FOR DELETE USING (auth.uid() = student_id);

-- Tutors can view participants of their sessions
CREATE POLICY "Tutors can view participants of their sessions" ON session_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s 
            WHERE s.id = session_participants.session_id 
            AND s.tutor_id = auth.uid()
        )
    );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_session_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_session_participants_updated_at
    BEFORE UPDATE ON session_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_session_participants_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_student_id ON session_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_status ON session_participants(status);

-- Create a view for available sessions (sessions without assigned students)
CREATE OR REPLACE VIEW available_sessions AS
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
    s.created_at,
    s.updated_at,
    -- Tutor information
    tutor.id as tutor_id,
    tutor.name as tutor_name,
    tutor.email as tutor_email,
    tutor.phone as tutor_phone,
    tutor.location as tutor_location,
    tutor.education_level as tutor_education_level,
    tutor.bio as tutor_bio,
    tutor.avatar_url as tutor_avatar_url,
    -- Subject information
    sub.id as subject_id,
    sub.name as subject_name,
    sub.description as subject_description,
    -- Participant count
    COALESCE(participant_count.count, 0) as participant_count,
    -- Check if current user is already joined
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 
            EXISTS (
                SELECT 1 FROM session_participants sp 
                WHERE sp.session_id = s.id 
                AND sp.student_id = auth.uid() 
                AND sp.status = 'joined'
            )
        ELSE false
    END as is_joined
FROM sessions s
JOIN profiles tutor ON s.tutor_id = tutor.id
JOIN subjects sub ON s.subject_id = sub.id
LEFT JOIN (
    SELECT 
        session_id, 
        COUNT(*) as count 
    FROM session_participants 
    WHERE status = 'joined' 
    GROUP BY session_id
) participant_count ON s.id = participant_count.session_id
WHERE s.status = 'scheduled' 
AND s.student_id IS NULL; -- Only sessions without assigned students

-- Create a view for session participants (for tutors to see who joined)
CREATE OR REPLACE VIEW session_participants_details AS
SELECT 
    sp.id,
    sp.session_id,
    sp.student_id,
    sp.joined_at,
    sp.status,
    sp.created_at,
    sp.updated_at,
    -- Session information
    s.title as session_title,
    s.start_time,
    s.end_time,
    s.session_type,
    -- Student information
    student.name as student_name,
    student.email as student_email,
    student.phone as student_phone,
    student.avatar_url as student_avatar_url,
    -- Tutor information (for verification)
    tutor.id as tutor_id,
    tutor.name as tutor_name
FROM session_participants sp
JOIN sessions s ON sp.session_id = s.id
JOIN profiles student ON sp.student_id = student.id
JOIN profiles tutor ON s.tutor_id = tutor.id
WHERE sp.status = 'joined';

-- Grant permissions for the views
GRANT SELECT ON available_sessions TO authenticated;
GRANT SELECT ON session_participants_details TO authenticated; 