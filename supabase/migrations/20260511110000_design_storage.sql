-- Migration: Design Files Storage Bucket
-- Created: 2026-05-11

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-files', 'design-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for the bucket
-- Allow authenticated users to view files
CREATE POLICY "Enable select for authenticated users"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'design-files');

-- Allow specific roles to upload/update/delete
CREATE POLICY "Enable management for designers/admins"
ON storage.objects FOR ALL TO authenticated
USING (
    bucket_id = 'design-files' AND (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'project_manager', 'engineer', 'supervisor')
        )
    )
)
WITH CHECK (
    bucket_id = 'design-files' AND (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'project_manager', 'engineer', 'supervisor')
        )
    )
);
