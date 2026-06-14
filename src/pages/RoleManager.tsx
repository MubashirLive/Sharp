import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { RoleManagerTab } from "@/components/role-manager/RoleManagerTab";

export default function RoleManager() {
  const { school, role } = useAuth();
  const schoolId = school?.id ?? "";
  const canEdit = role === "principal" || role === "master_admin";

  return (
    <AppShell>
      <div className="space-y-5 max-w-5xl">
        <div className="clay-page-header">
          <h1>Role Manager</h1>
          <p>Assign staff roles, subjects, wings, departments and houses</p>
        </div>
        <RoleManagerTab
          schoolId={schoolId}
          canEdit={canEdit}
        />
      </div>
    </AppShell>
  );
}