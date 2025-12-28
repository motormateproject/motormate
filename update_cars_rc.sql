-- Migration to add RC Image to Cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rc_image_url TEXT;

-- Policy to allow users to update their own car with image
CREATE POLICY "Users can update own car images" ON cars 
FOR UPDATE USING (auth.uid() = user_id);
