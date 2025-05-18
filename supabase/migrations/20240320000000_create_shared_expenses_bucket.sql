
-- Create the shared-expenses bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-expenses', 'shared-expenses', true);

-- Allow public access to read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'shared-expenses');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shared-expenses'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shared-expenses'
  AND auth.role() = 'authenticated'
); 