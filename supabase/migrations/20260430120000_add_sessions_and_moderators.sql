-- Sessions: Group live programs and their moderators
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL
);

-- Moderators: People who moderate each session
CREATE TABLE IF NOT EXISTS public.moderators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  session_id uuid NOT NULL,
  full_name text NOT NULL,
  FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE
);

-- Link programs to sessions
ALTER TABLE IF EXISTS public.timeline_cards
ADD COLUMN IF NOT EXISTS session_id uuid;

ALTER TABLE IF EXISTS public.timeline_cards
ADD CONSTRAINT timeline_cards_session_fk
FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;

-- Indexes for queries
CREATE INDEX IF NOT EXISTS moderators_session_id ON public.moderators(session_id);
CREATE INDEX IF NOT EXISTS timeline_cards_session_id ON public.timeline_cards(session_id);
