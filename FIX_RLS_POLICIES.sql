-- Fix RLS Policies for Messages System
-- This script fixes the 400 error when loading messages by updating the profiles table RLS policies

-- First, drop the existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view tutor profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create a new comprehensive policy that allows viewing profiles for messaging
CREATE POLICY "Users can view profiles for messaging" ON profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            -- Users can view their own profile
            auth.uid() = id OR
            -- Users can view tutor profiles
            user_type = 'tutor' OR
            -- Users can view profiles of people they have messages with
            EXISTS (
                SELECT 1 FROM messages 
                WHERE (sender_id = auth.uid() AND receiver_id = profiles.id) 
                   OR (receiver_id = auth.uid() AND sender_id = profiles.id)
            )
        )
    );

-- Keep the existing policies for other operations
-- (These should already exist from the original setup)

-- Verify the policies are working
-- You can test this by running a query like:
-- SELECT * FROM profiles WHERE id IN (
--     SELECT DISTINCT sender_id FROM messages WHERE receiver_id = auth.uid()
--     UNION
--     SELECT DISTINCT receiver_id FROM messages WHERE sender_id = auth.uid()
-- ); 