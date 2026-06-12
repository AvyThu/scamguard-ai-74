
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  elderly_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Scam reports
CREATE TABLE public.scam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  cluster TEXT,
  description TEXT NOT NULL,
  url TEXT,
  screenshot_url TEXT,
  platform TEXT,
  incident_date DATE,
  estimated_loss BIGINT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scam_reports TO authenticated;
GRANT SELECT, INSERT ON public.scam_reports TO anon;
GRANT ALL ON public.scam_reports TO service_role;
ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert reports" ON public.scam_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read approved reports" ON public.scam_reports FOR SELECT TO anon, authenticated USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage reports" ON public.scam_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Emergency contacts
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contacts" ON public.emergency_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- URL lists
CREATE TABLE public.url_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_pattern TEXT NOT NULL UNIQUE,
  reason TEXT,
  cluster TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.url_blacklist TO anon, authenticated;
GRANT ALL ON public.url_blacklist TO service_role;
ALTER TABLE public.url_blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read blacklist" ON public.url_blacklist FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage blacklist" ON public.url_blacklist FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.url_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_pattern TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.url_whitelist TO anon, authenticated;
GRANT ALL ON public.url_whitelist TO service_role;
ALTER TABLE public.url_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read whitelist" ON public.url_whitelist FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage whitelist" ON public.url_whitelist FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- News & education
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read news" ON public.news_articles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage news" ON public.news_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.education_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_content TO anon, authenticated;
GRANT ALL ON public.education_content TO service_role;
ALTER TABLE public.education_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read education" ON public.education_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage education" ON public.education_content FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Analysis history (per user)
CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  input_summary TEXT,
  result JSONB,
  risk_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.analysis_history TO authenticated;
GRANT ALL ON public.analysis_history TO service_role;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own history" ON public.analysis_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Anonymous research analytics
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  cluster TEXT,
  risk_level TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone read aggregate events" ON public.analytics_events FOR SELECT TO anon, authenticated USING (true);

-- Manual cybersecurity stats (admin-maintained)
CREATE TABLE public.cyber_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Cơ quan chức năng Việt Nam',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cyber_stats TO anon, authenticated;
GRANT ALL ON public.cyber_stats TO service_role;
ALTER TABLE public.cyber_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stats" ON public.cyber_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage stats" ON public.cyber_stats FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Seed initial stats
INSERT INTO public.cyber_stats (metric_key, label, value, source) VALUES
  ('total_alerts', 'Cảnh báo lừa đảo', '125,400+', 'Cục An toàn thông tin'),
  ('active_campaigns', 'Chiến dịch lừa đảo mới', '24', 'NCSC'),
  ('blocked_domains', 'Tên miền độc hại bị chặn', '12,800+', 'Bộ Công an'),
  ('reported_loss', 'Thiệt hại ước tính (tỷ VND)', '1,200+', 'Cơ quan chức năng Việt Nam');

INSERT INTO public.url_blacklist (url_pattern, reason, cluster) VALUES
  ('dichvucong-vn.net', 'Giả mạo Dịch vụ công', 'A'),
  ('vneid-app.com', 'Giả mạo VNeID', 'A'),
  ('shopee-tri-an.com', 'Giả mạo Shopee', 'C'),
  ('thuhoivon-online.com', 'Lừa đảo thu hồi vốn', 'D');
