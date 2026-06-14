import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Building2, Users, ClipboardCheck, GraduationCap, AlertCircle, CalendarDays, MessageSquare, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { AttendanceCard } from "@/components/attendance/AttendanceCard";
import { useDashboardAttendanceStatus } from "@/hooks/useAttendance";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  principal: "Principal",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student / Parent",
};

export default function Home() {
  const { user, school, profile, role, isSuperAdmin, refresh } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const dashboardStatus = useDashboardAttendanceStatus();

  // After onboarding completes, ensure school state is fresh before rendering Home
  useEffect(() => {
    if (school?.onboarding_complete) {
      refresh();
    }
  }, []);

  const claimSuperAdmin = async () => {
    setClaiming(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "superadmin" })
        .eq("id", user?.id);

      if (error) throw error;

      toast({ title: "You are now Super Admin" });
      await refresh();
    } catch (err: any) {
      toast({
        title: "Could not claim",
        description: err.message ?? "Failed",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">

        {/* Page header */}
        <div className="clay-page-header">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {profile?.salutation && profile?.full_name
              ? `${profile.salutation} ${profile.full_name}`
              : profile?.full_name
              ? profile.full_name
              : "Welcome back"}
          </h1>
          {role && (
            <Badge variant="secondary" className="mt-1">{ROLE_LABEL[role] ?? role}</Badge>
          )}
        </div>

        {!role && (
          <div className="rounded-xl border border-yellow-400/40 bg-yellow-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h2 className="font-semibold text-base mb-1">No role assigned yet</h2>
                <p className="text-sm text-muted-foreground">
                  Your account exists but has not been linked to a school yet. Ask your
                  school Principal or the Super Admin to invite you.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={claimSuperAdmin} disabled={claiming} className="cursor-pointer">
                    {claiming ? "Claiming…" : "I'm the platform owner — claim Super Admin"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Only works if no Super Admin exists yet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isSuperAdmin && (
            <DashboardCard icon={ShieldCheck} title="Super Admin" desc="Manage all schools on the platform" to="/super-admin" />
          )}
          {!school?.onboarding_complete && (role === "principal" || role === "admin") && (
            <DashboardCard icon={Users} title="My Staff" desc="Teachers, admin & support staff" to="/people" />
          )}
          {!school?.onboarding_complete && (role === "principal" || role === "admin") && (
            <Link to="/school/onboarding">
              <div className="h-full rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 grid place-items-center mb-3 shadow-sm">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-base">Continue Onboarding</h3>
                <p className="text-sm text-amber-700 mt-0.5">Set up your school to unlock all features</p>
              </div>
            </Link>
          )}
          {school?.onboarding_complete && (
            <>
              <DashboardCard icon={Building2} title="My School" desc="View & edit school details" to="/school" />
              <DashboardCard icon={Users} title="My Staff" desc="Teachers, admin & support staff" to="/people" />
              <DashboardCard icon={GraduationCap} title="My Students" desc="Students, class & enrollment" to="/students" />
              <DashboardCard icon={CalendarDays} title="Calendar" desc="Holidays, events, meetings & tasks" to="/calendar" />
              <DashboardCard icon={MessageSquare} title="Messages" desc="School communication hub" to="/messenger" />
              <DashboardCard icon={UserCog} title="Role Manager" desc="Assign staff roles, subjects, wings & departments" to="/role-manager" />
              {(role === "class_teacher" || role === "coordinator") ? (
                <>
                  {dashboardStatus.data ? (
                    <AttendanceCard
                      variant={dashboardStatus.data.variant}
                      roleLabel={dashboardStatus.data.roleLabel}
                      markedToday={dashboardStatus.data.markedToday}
                      classId={dashboardStatus.data.classId}
                      sectionId={dashboardStatus.data.sectionId}
                      className={dashboardStatus.data.className}
                      wingId={dashboardStatus.data.wingId}
                      wingName={dashboardStatus.data.wingName}
                    />
                  ) : !dashboardStatus.isLoading ? (
                    <DashboardCard icon={ClipboardCheck} title="Attendance" desc="Daily attendance tracking" to="/attendance" />
                  ) : null}
                </>
              ) : (
                <DashboardCard icon={ClipboardCheck} title="Attendance" desc="Daily attendance tracking" to="/attendance" />
              )}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  desc,
  to,
  disabled,
}: {
  icon: any;
  title: string;
  desc: string;
  to: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="h-full rounded-xl border bg-card px-5 py-4 opacity-50 cursor-not-allowed">
        <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center mb-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    );
  }
  return (
    <Link to={to} className="group block">
      <div className="h-full rounded-xl border bg-card px-5 py-4 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center mb-3 shadow-sm">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
