-- Add DELETE policy for messages table
-- This allows users to delete their own messages

-- Check if the policy already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Users can delete their messages'
    ) THEN
        -- Create the DELETE policy
        CREATE POLICY "Users can delete their messages" ON messages
            FOR DELETE USING (auth.uid() = sender_id);
    END IF;
END $$;

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'messages' 
ORDER BY policyname; 