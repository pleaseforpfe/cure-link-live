-- Row Level Security Policies for Sessions and Moderators

-- Sessions policies
CREATE POLICY "sessions_select_public"
ON public.sessions FOR SELECT
USING (true);

CREATE POLICY "sessions_insert_admin"
ON public.sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

CREATE POLICY "sessions_update_admin"
ON public.sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

CREATE POLICY "sessions_delete_admin"
ON public.sessions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

-- Moderators policies
CREATE POLICY "moderators_select_public"
ON public.moderators FOR SELECT
USING (true);

CREATE POLICY "moderators_insert_admin"
ON public.moderators FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

CREATE POLICY "moderators_update_admin"
ON public.moderators FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

CREATE POLICY "moderators_delete_admin"
ON public.moderators FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  )
);

-- Enable RLS on both tables
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.moderators ENABLE ROW LEVEL SECURITY;
