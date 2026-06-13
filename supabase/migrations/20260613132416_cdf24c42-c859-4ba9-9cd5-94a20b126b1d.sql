
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.scam_intel_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_org TEXT NOT NULL,
  source_url TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  impersonated_brand TEXT,
  cluster TEXT,
  severity TEXT NOT NULL DEFAULT 'high',
  reported_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scam_intel_campaigns TO anon, authenticated;
GRANT ALL ON public.scam_intel_campaigns TO service_role;

ALTER TABLE public.scam_intel_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intel campaigns are public read"
ON public.scam_intel_campaigns FOR SELECT
USING (true);

CREATE TRIGGER update_scam_intel_campaigns_updated_at
BEFORE UPDATE ON public.scam_intel_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_scam_intel_keywords ON public.scam_intel_campaigns USING GIN (keywords);
