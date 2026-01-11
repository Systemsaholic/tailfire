-- Phase 12: Storage RLS Policies
-- User-based access control for single-agency model
-- NOTE: Uses `owner` column (NOT owner_id) per Supabase storage schema

-- Enable RLS on storage.objects (safe to run if already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- DOCUMENTS BUCKET (Private)
-- ==============================================================================

DROP POLICY IF EXISTS "documents_select_own" ON storage.objects;
CREATE POLICY "documents_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());

DROP POLICY IF EXISTS "documents_insert_authenticated" ON storage.objects;
CREATE POLICY "documents_insert_authenticated" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND owner = auth.uid());

DROP POLICY IF EXISTS "documents_update_own" ON storage.objects;
CREATE POLICY "documents_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());

DROP POLICY IF EXISTS "documents_delete_own" ON storage.objects;
CREATE POLICY "documents_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());

-- ==============================================================================
-- MEDIA BUCKET (Public read, authenticated write)
-- ==============================================================================

-- SELECT for public bucket (allows API listing, not just URL download)
DROP POLICY IF EXISTS "media_select_public" ON storage.objects;
CREATE POLICY "media_select_public" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_insert_authenticated" ON storage.objects;
CREATE POLICY "media_insert_authenticated" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_update_own" ON storage.objects;
CREATE POLICY "media_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;
CREATE POLICY "media_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND owner = auth.uid());

-- ==============================================================================
-- AVATARS BUCKET (Public read, users write to own folder)
-- ==============================================================================

-- SELECT for public bucket (allows API listing)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_own_folder" ON storage.objects;
CREATE POLICY "avatars_insert_own_folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
