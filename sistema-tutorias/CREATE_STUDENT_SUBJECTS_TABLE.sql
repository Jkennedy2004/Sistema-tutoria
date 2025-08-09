-- Create student_subjects table to track student subject registrations
-- This allows filtering tutors by subjects the student is registered for

-- Create the student_subjects table
CREATE TABLE IF NOT EXISTS student_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- Add RLS policies for student_subjects table
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;

-- Students can view their own subject registrations
CREATE POLICY "Students can view their own subject registrations" ON student_subjects
    FOR SELECT USING (auth.uid() = student_id);

-- Students can register for subjects
CREATE POLICY "Students can register for subjects" ON student_subjects
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can update their own subject registrations
CREATE POLICY "Students can update their own subject registrations" ON student_subjects
    FOR UPDATE USING (auth.uid() = student_id);

-- Students can delete their own subject registrations
CREATE POLICY "Students can delete their own subject registrations" ON student_subjects
    FOR DELETE USING (auth.uid() = student_id);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_student_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_subjects_updated_at
    BEFORE UPDATE ON student_subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_student_subjects_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject_id ON student_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_active ON student_subjects(is_active);

-- Insert some sample data (optional - for testing)
-- You can uncomment and modify these lines to add sample registrations
/*
INSERT INTO student_subjects (student_id, subject_id) 
SELECT 
    p.id as student_id,
    s.id as subject_id
FROM profiles p, subjects s
WHERE p.user_type = 'student' 
AND s.name IN ('Matemáticas', 'Física', 'Química')
LIMIT 10;
*/ 