-- Roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'principal', 'admin', 'teacher', 'student_parent');

-- Schools
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  board TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1e40af',
  wings TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table per security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, school_id)
);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications (placeholder, schema-ready)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ===== Security definer helpers =====
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_school_role(_user_id UUID, _school_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND school_id = _school_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_school_staff(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND school_id = _school_id
      AND role IN ('principal','admin')
  )
$$;

-- ===== Updated-at trigger =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Auto-create profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== RLS POLICIES =====

-- schools
CREATE POLICY "super_admin manages all schools" ON public.schools
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "members view their school" ON public.schools
  FOR SELECT TO authenticated
  USING (id = public.get_user_school_id(auth.uid()));

CREATE POLICY "principals/admins update their school" ON public.schools
  FOR UPDATE TO authenticated
  USING (public.is_school_staff(auth.uid(), id))
  WITH CHECK (public.is_school_staff(auth.uid(), id));

-- profiles
CREATE POLICY "users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "super_admin views all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admin updates profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "school staff view school profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (school_id IS NOT NULL AND public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "school staff update school profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (school_id IS NOT NULL AND public.is_school_staff(auth.uid(), school_id))
  WITH CHECK (school_id IS NOT NULL AND public.is_school_staff(auth.uid(), school_id));

-- user_roles
CREATE POLICY "users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "super_admin manages all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "school staff view school roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (school_id IS NOT NULL AND public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "school staff manage non-principal roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id IS NOT NULL
    AND public.is_school_staff(auth.uid(), school_id)
    AND role IN ('admin','teacher','student_parent')
  );

CREATE POLICY "school staff delete non-principal roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    school_id IS NOT NULL
    AND public.is_school_staff(auth.uid(), school_id)
    AND role IN ('admin','teacher','student_parent')
  );

-- audit_log
CREATE POLICY "super_admin reads all audit" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "school staff read school audit" ON public.audit_log
  FOR SELECT TO authenticated
  USING (school_id IS NOT NULL AND public.is_school_staff(auth.uid(), school_id));

CREATE POLICY "authenticated insert audit" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- notifications
CREATE POLICY "users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "school staff create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (school_id IS NOT NULL AND public.is_school_staff(auth.uid(), school_id));

-- ===== Storage bucket for school assets =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view school assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-assets');

CREATE POLICY "School staff upload to their folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'school-assets'
    AND public.is_school_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "School staff update their folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'school-assets'
    AND public.is_school_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Super admin manages all school assets" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'school-assets' AND public.is_super_admin(auth.uid()))
  WITH CHECK (bucket_id = 'school-assets' AND public.is_super_admin(auth.uid()));