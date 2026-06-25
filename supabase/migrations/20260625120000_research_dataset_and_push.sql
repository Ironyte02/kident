-- ============================================================================
--  Anonymized research dataset  +  Web-Push subscriptions
-- ----------------------------------------------------------------------------
--  Goal: collect data for cross-user analysis WITHOUT loosening the per-user
--  Row-Level Security that already protects each parent's raw records.
--
--  Strategy:
--    * The `children` / `daily_entries` tables stay locked down by RLS exactly
--      as before — a parent can still only ever see their own child's data.
--    * Every write to `daily_entries` is mirrored, via a SECURITY DEFINER
--      trigger, into `research_entries`: a de-identified copy with NO name and
--      NO user_id, keyed by a non-reversible per-child pseudonym.
--    * `research_entries` has RLS enabled with NO policies, so it is invisible
--      to the anon/authenticated API keys. Only the `service_role` key
--      (Supabase SQL editor, server-side exports, Edge Functions) can read it.
--      That is your "researcher" access path.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Pseudonymization pepper.
--    Lives in a private schema that is never exposed through the API.
--    >>> CHANGE THIS VALUE before going live and keep it secret. <<<
--    It is the secret that makes child pseudonyms non-reversible by anyone
--    who does not have direct database access.
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE OR REPLACE FUNCTION private.research_pepper()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 'CHANGE_ME_super_secret_pepper_4f9a2c'::text $$;

-- ----------------------------------------------------------------------------
-- 2. research_entries — de-identified mirror of daily_entries.
-- ----------------------------------------------------------------------------
CREATE TABLE public.research_entries (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- stable, non-reversible pseudonym = sha256(child_id || pepper)
  child_pseudonym   TEXT NOT NULL,
  age_group         TEXT NOT NULL,
  gender            TEXT NOT NULL,
  entry_date        DATE NOT NULL,
  diet_data         JSONB NOT NULL DEFAULT '{}',
  oral_habits_data  JSONB NOT NULL DEFAULT '{}',
  fluoride_data     JSONB NOT NULL DEFAULT '{}',
  risk_score        NUMERIC(5,2),
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (child_pseudonym, entry_date)
);

-- RLS ON + zero policies  =>  unreachable from anon/authenticated keys.
-- Only service_role (which bypasses RLS) can read/write it.
ALTER TABLE public.research_entries ENABLE ROW LEVEL SECURITY;

-- Defense in depth: also strip table grants from the public API roles.
REVOKE ALL ON public.research_entries FROM anon, authenticated;

CREATE TRIGGER update_research_entries_updated_at
  BEFORE UPDATE ON public.research_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. Trigger that mirrors daily_entries -> research_entries, joining the
--    child's age_group / gender and dropping all identifiers.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_research_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_age_group TEXT;
  v_gender    TEXT;
  v_pseudonym TEXT;
BEGIN
  SELECT age_group, gender INTO v_age_group, v_gender
  FROM public.children WHERE id = NEW.child_id;

  v_pseudonym := encode(
    digest(NEW.child_id::text || private.research_pepper(), 'sha256'),
    'hex'
  );

  INSERT INTO public.research_entries (
    child_pseudonym, age_group, gender, entry_date,
    diet_data, oral_habits_data, fluoride_data, risk_score
  )
  VALUES (
    v_pseudonym, v_age_group, v_gender, NEW.entry_date,
    NEW.diet_data, NEW.oral_habits_data, NEW.fluoride_data, NEW.risk_score
  )
  ON CONFLICT (child_pseudonym, entry_date) DO UPDATE SET
    age_group        = EXCLUDED.age_group,
    gender           = EXCLUDED.gender,
    diet_data        = EXCLUDED.diet_data,
    oral_habits_data = EXCLUDED.oral_habits_data,
    fluoride_data    = EXCLUDED.fluoride_data,
    risk_score       = EXCLUDED.risk_score,
    updated_at       = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_research_entry
  AFTER INSERT OR UPDATE ON public.daily_entries
  FOR EACH ROW EXECUTE FUNCTION public.sync_research_entry();

-- ----------------------------------------------------------------------------
-- 4. Convenience analyst views (query with the service_role key).
--    security_invoker = true => they obey the caller's RLS, so a normal user
--    who somehow reached them would still see nothing.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.research_risk_by_age
WITH (security_invoker = true) AS
  SELECT age_group,
         gender,
         count(*)                        AS entries,
         count(DISTINCT child_pseudonym) AS children,
         round(avg(risk_score), 1)       AS avg_risk_score,
         round(percentile_cont(0.5) WITHIN GROUP (ORDER BY risk_score)::numeric, 1)
                                         AS median_risk_score
  FROM public.research_entries
  GROUP BY age_group, gender;

CREATE OR REPLACE VIEW public.research_daily_volume
WITH (security_invoker = true) AS
  SELECT entry_date,
         count(*)                        AS entries,
         count(DISTINCT child_pseudonym) AS active_children,
         round(avg(risk_score), 1)       AS avg_risk_score
  FROM public.research_entries
  GROUP BY entry_date
  ORDER BY entry_date;

REVOKE ALL ON public.research_risk_by_age   FROM anon, authenticated;
REVOKE ALL ON public.research_daily_volume  FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. Backfill any pre-existing daily_entries into the research dataset.
-- ----------------------------------------------------------------------------
INSERT INTO public.research_entries (
  child_pseudonym, age_group, gender, entry_date,
  diet_data, oral_habits_data, fluoride_data, risk_score
)
SELECT
  encode(digest(de.child_id::text || private.research_pepper(), 'sha256'), 'hex'),
  c.age_group, c.gender, de.entry_date,
  de.diet_data, de.oral_habits_data, de.fluoride_data, de.risk_score
FROM public.daily_entries de
JOIN public.children c ON c.id = de.child_id
ON CONFLICT (child_pseudonym, entry_date) DO NOTHING;

-- ============================================================================
-- 6. push_subscriptions — one row per browser/device that opted into push.
-- ============================================================================
CREATE TABLE public.push_subscriptions (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
