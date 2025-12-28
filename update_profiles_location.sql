-- Add location columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS address_text TEXT;

-- Enable users to update their own location
CREATE POLICY "Users can update own location" ON profiles
FOR UPDATE USING (auth.uid() = id);
