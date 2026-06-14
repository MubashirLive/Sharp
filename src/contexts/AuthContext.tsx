import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/lib/auth-constants";

export type { AppRole };

export interface SchoolSummary {
  id: string;
  name: string;
  slug: string;
  emblem_url?: string | null;
  onboarding_complete: boolean | null;
  status: string | null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  primaryRole: AppRole | null;
  school: SchoolSummary | null;
  mustChangePassword: boolean;
  mustChangePin: boolean;
  profileStatus: string | null;
  isSuperAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  profile: { full_name: string | null; salutation: string | null } | null;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [school, setSchool] = useState<SchoolSummary | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [mustChangePin, setMustChangePin] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthCtx["profile"]>(null);

  const loadProfileData = async (uid: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, school_id, must_change_password, must_change_pin, full_name, salutation, status, login_mobile")
      .eq("id", uid)
      .maybeSingle();

    if (profile) {
      setRole(profile.role as AppRole);
      setMustChangePassword(Boolean(profile.must_change_password));
      setMustChangePin(Boolean(profile.must_change_pin));
      setProfileStatus(profile.status ?? null);
      setProfile({ full_name: profile.full_name, salutation: profile.salutation });

      if (profile.school_id) {
        const { data: s } = await supabase
          .from("schools")
          .select("id, name, slug, emblem_url, onboarding_complete, status")
          .eq("id", profile.school_id)
          .maybeSingle();
        setSchool(s ?? null);
      } else {
        setSchool(null);
      }
    } else {
      setRole(null);
      setSchool(null);
      setMustChangePassword(false);
      setMustChangePin(false);
      setProfileStatus(null);
      setProfile(null);
    }
  };

  const refresh = async () => {
    if (user) await loadProfileData(user.id);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadProfileData(sess.user.id), 0);
      } else {
        setRole(null);
        setSchool(null);
        setMustChangePassword(false);
        setMustChangePin(false);
        setProfileStatus(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfileData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setSchool(null);
  };

  const isSuperAdmin = role === "superadmin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        primaryRole: role,
        school,
        mustChangePassword,
        mustChangePin,
        profileStatus,
        isSuperAdmin,
        refresh,
        signOut,
        profile,
      }}
    >
      <AutoForceRedirect
        loading={loading}
        user={user}
        mustChangePassword={mustChangePassword}
        mustChangePin={mustChangePin}
        profileStatus={profileStatus}
        role={role}
      />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function AutoForceRedirect({
  loading,
  user,
  mustChangePassword,
  mustChangePin,
  profileStatus,
  role,
}: {
  loading: boolean;
  user: User | null;
  mustChangePassword: boolean;
  mustChangePin: boolean;
  profileStatus: string | null;
  role: AppRole | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const authPaths = ["/auth/forced-password-change", "/auth/forced-pin-setup", "/auth/locked",
    "/auth/principal/recover", "/auth/staff/recover", "/auth/student/recover"];
  const isOnAuthPage = authPaths.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    if (loading || !user) return;

    // Redirect locked users
    if (profileStatus === "locked" && !isOnAuthPage) {
      const roleParam = role ?? "staff";
      navigate(`/auth/locked?role=${roleParam}&reason=pin_exceeded`, { replace: true });
      return;
    }

    // Redirect principal to password change
    if (mustChangePassword && role === "principal" && !isOnAuthPage) {
      navigate("/auth/forced-password-change", { replace: true });
      return;
    }

    // Redirect staff/student to PIN setup
    if (mustChangePin && !isOnAuthPage) {
      navigate("/auth/forced-pin-setup", { replace: true });
    }
  }, [loading, user, mustChangePassword, mustChangePin, profileStatus, role, isOnAuthPage]);

  return null;
}
