-- Add Delete Policy to public.incidents for Admins
CREATE POLICY "Admins can delete incidents" ON public.incidents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
    )
  );
