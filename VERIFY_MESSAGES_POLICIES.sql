-- Verify and add all RLS policies for messages table
-- This ensures all messaging functionality works properly

-- 1. Enable RLS on messages table if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 2. Add SELECT policy (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can view messages they sent or received'
    ) THEN
        CREATE POLICY "Users can view messages they sent or received" ON messages
            FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;
END $$;

-- 3. Add INSERT policy (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can send messages'
    ) THEN
        CREATE POLICY "Users can send messages" ON messages
            FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;

-- 4. Add UPDATE policy (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can update their own messages'
    ) THEN
        CREATE POLICY "Users can update their own messages" ON messages
            FOR UPDATE USING (auth.uid() = sender_id);
    END IF;
END $$;

-- 5. Add DELETE policy (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can delete their own messages'
    ) THEN
        CREATE POLICY "Users can delete their own messages" ON messages
            FOR DELETE USING (auth.uid() = sender_id);
    END IF;
END $$;

-- 6. Show all policies for messages table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'messages' 
ORDER BY cmd, policyname; 