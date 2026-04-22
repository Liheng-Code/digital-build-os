
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;
CREATE POLICY "Unattached users can create a company" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_company(auth.uid()) IS NULL);
