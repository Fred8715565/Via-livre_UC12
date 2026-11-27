-- VIA LIVRE: configuração do armazenamento de fotos da comunidade
-- Execute no SQL Editor do Supabase.
-- O bucket é público para leitura das imagens; somente usuários autenticados
-- podem enviar e apagar arquivos dentro da própria pasta (user_id).

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'community-photos',
  'community-photos',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "community_photos_public_read" ON storage.objects;
CREATE POLICY "community_photos_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'community-photos');

DROP POLICY IF EXISTS "community_photos_user_upload" ON storage.objects;
CREATE POLICY "community_photos_user_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "community_photos_user_delete" ON storage.objects;
CREATE POLICY "community_photos_user_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
