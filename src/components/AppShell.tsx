import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChatModal } from "@/components/ChatModal";
import { LogOut, GraduationCap, Building2, Users, ShieldCheck, CalendarDays, MessageSquare } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";
import { useSchoolPageContext } from "@/pages/SchoolPage";

export function AppShell({ children }: { children: ReactNode }) {
  const { school, primaryRole, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Safely access SchoolPage dirty-state context (null when not inside SchoolPage)
  let pageCtx: ReturnType<typeof useSchoolPageContext> | null = null;
  try { pageCtx = useSchoolPageContext(); } catch { /* not in SchoolPage */ }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const postOnboarding = !!school && school.onboarding_complete;

  const navItems = [
    { to: "/", label: "Home", icon: GraduationCap, show: true },
    { to: "/calendar", label: "Calendar", icon: CalendarDays, show: postOnboarding },
    { to: "/messenger", label: "Messages", icon: MessageSquare, show: postOnboarding },
  ].filter((i) => i.show);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-soft)" }}>
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-30" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold cursor-pointer"
            onClick={(e) => {
              if (pageCtx && pageCtx.dirtyTabsRef.current.size > 0) {
                e.preventDefault();
                pageCtx.requestNavigation("/");
              }
            }}
          >
            {school?.emblem_url ? (
              <img src={school.emblem_url} alt={school.name} className="h-8 w-8 rounded-xl object-cover" style={{ boxShadow: "var(--shadow-md)" }} loading="lazy" decoding="async" />
            ) : (
              <div className="h-8 w-8 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground text-xs font-bold" style={{ boxShadow: "var(--shadow-md)" }}>
                S
              </div>
            )}
            <span className="hidden sm:inline">{school?.name ?? "SHARP"}</span>
          </Link>
          <nav className="flex-1 flex items-center gap-1.5 overflow-x-auto">
            {navItems.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer",
                      isActive
                        ? "bg-gradient-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )
                  }
                  onClick={(e) => {
                    if (pageCtx && pageCtx.dirtyTabsRef.current.size > 0) {
                      e.preventDefault();
                      pageCtx.requestNavigation(it.to);
                    }
                  }}
                >
                  {it.label}
                </NavLink>
              ))}
          </nav>
          <div className="flex items-center gap-2">
            <ChatModal />
            <AnimatedThemeToggler />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
