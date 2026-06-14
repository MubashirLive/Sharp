DROP POLICY IF EXISTS "Public can view school assets" ON storage.objects;

-- Only allow public reads of files in a "logos/" subpath of each school folder
CREATE POLICY "Public can view school logos" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'school-assets'
    AND (storage.foldername(name))[2] = 'logos'
  );

-- Authenticated members can read other school assets within their school
CREATE POLICY "School members can view their school assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'school-assets'
    AND ((storage.foldername(name))[1])::uuid = public.get_user_school_id(auth.uid())
  );