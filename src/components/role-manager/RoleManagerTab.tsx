import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, BookOpen, Users, Building2, Home, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleFilterBar } from "./RoleFilterBar";
import { StaffRoleCard } from "./StaffRoleCard";
import { SubjectAssignmentGrid } from "./SubjectAssignmentGrid";
import { WingsAssignmentTab } from "./WingsAssignmentTab";
import { DepartmentsAssignmentTab } from "./DepartmentsAssignmentTab";
import { HousesAssignmentTab } from "./HousesAssignmentTab";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { useStaffList, useRefreshStaffList } from "@/hooks/useRoleManagerQueries";

export interface RoleFilters {
  search?: string;
  masterAdmin?: boolean;
  admin?: boolean;
  teacher?: boolean;
  classTeacher?: boolean;
  coordinator?: boolean;
  deptIncharge?: boolean;
  departments?: string[];
}

export interface RoleManagerTabProps {
  schoolId: string;
  canEdit: boolean;
}

// Human-readable labels for the unsaved-changes modal. Keys must
// match the Tabs value prop on each TabsContent below.
const TAB_LABELS: Record<string, string> = {
  staff: "Staff",
  subjects: "Subjects",
  wings: "Wings",
  departments: "Departments",
  houses: "Houses",
};

export function RoleManagerTab({ schoolId, canEdit }: RoleManagerTabProps) {
  const { role, user } = useAuth();
  const currentUserId = user?.id ?? "";
  const isPrincipal = role === "principal";
  const isMasterAdmin = role === "master_admin";
  const [activeTab, setActiveTab] = useState("staff");

  const [filters, setFilters] = useState<RoleFilters>({});

  // Per-tab dirty tracking. Each sub-tab reports its own dirty state
  // (in-flight save, failed save, or pending draft) via onDirtyChange.
  // The parent aggregates to a single `anyDirty` for the gate and
  // remembers which tab is dirty for the modal's "fromTabLabel".
  const [dirtyByTab, setDirtyByTab] = useState<Record<string, boolean>>({});
  const [dirtyTabLabel, setDirtyTabLabel] = useState<string>("another tab");
  const anyDirty = Object.values(dirtyByTab).some(Boolean);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  // "Stay" / "Leave" choice for in-app nav block
  const [pendingNav, setPendingNav] = useState<null | ((shouldLeave: boolean) => void)>(null);

  // Staff directory — single source of truth via TanStack Query. The card
  // mutations also invalidate this key on success, so cross-staff class-
  // teacher reassigns (Amit loses 10th A, Anjali gains it) update this list
  // in lockstep. See useRoleManagerQueries.ts.
  const { data: staff = [], isLoading: loading, error: staffError } = useStaffList(schoolId);
  const refreshStaff = useRefreshStaffList(schoolId);

  useEffect(() => {
    if (staffError) toast.error("Failed to load staff");
  }, [staffError]);

  const filteredStaff = useMemo(() => {
    let result = staff.filter((s) => s.status === "active" || s.status === "inactive");

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.employee_id?.toLowerCase().includes(q) ||
          s.messenger_tag?.toLowerCase().includes(q)
      );
    }

    if (filters.masterAdmin) {
      result = result.filter((s) => s.role === "master_admin");
    }

    if (filters.admin) {
      result = result.filter((s) => s.role === "admin");
    }

    if (filters.teacher) {
      result = result.filter((s) => s.role === "teacher" || !s.role || s.role === "staff");
    }

    if (filters.classTeacher) {
      result = result.filter((s) => s.is_class_teacher);
    }

    return result;
  }, [staff, filters]);

  // Stable callback passed to each sub-tab. Bails when the value is
  // unchanged to avoid re-render storms on every keystroke.
  const setTabDirty = useCallback((tab: string, isDirty: boolean) => {
    setDirtyByTab((prev) => (prev[tab] === isDirty ? prev : { ...prev, [tab]: isDirty }));
  }, []);

  const handleTabChange = (next: string) => {
    if (next === activeTab) return;
    if (anyDirty) {
      // Find which tab reported dirty (for the modal's "from" label).
      const dirtyTab = Object.entries(dirtyByTab).find(([, v]) => v)?.[0];
      if (dirtyTab) setDirtyTabLabel(TAB_LABELS[dirtyTab] ?? dirtyTab);
      setPendingTab(next);
    } else {
      setActiveTab(next);
    }
  };

  const discardAndSwitch = () => {
    setDirtyByTab({});
    if (pendingTab) setActiveTab(pendingTab);
    setPendingTab(null);
  };

  // Block in-app navigation (any route change) when dirty
  // — moved to <RouteLeaveGuard /> child component (only one useBlocker per tree)

  // Browser-level guard (back, refresh, close, tab close)
  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="staff" className="flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          <span className="hidden sm:inline">Staff</span>
        </TabsTrigger>
        <TabsTrigger value="subjects" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Subjects</span>
        </TabsTrigger>
        <TabsTrigger value="wings" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Wings</span>
        </TabsTrigger>
        <TabsTrigger value="departments" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Departments</span>
        </TabsTrigger>
        <TabsTrigger value="houses" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Houses</span>
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Staff */}
      <TabsContent value="staff" className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <RoleFilterBar
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={filteredStaff.length}
              canEdit={canEdit}
            />

            {filteredStaff.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No staff match the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStaff.map((s) => (
                  <StaffRoleCard
                    key={s.id}
                    staff={s}
                    schoolId={schoolId}
                    isPrincipal={isPrincipal}
                    isMasterAdmin={isMasterAdmin}
                    canEdit={canEdit}
                    isOwnCard={s.id === currentUserId}
                    onRefresh={async () => { await refreshStaff(); }}
                    onDirtyChange={(d) => setTabDirty("staff", d)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </TabsContent>

      {/* Tab 2: Subjects */}
      <TabsContent value="subjects" className="mt-4">
        <SubjectAssignmentGrid
          schoolId={schoolId}
          canEdit={canEdit}
          onAssignmentChange={async () => { await refreshStaff(); }}
          onDirtyChange={(d) => setTabDirty("subjects", d)}
        />
      </TabsContent>

      {/* Tab 3: Wings */}
      <TabsContent value="wings" className="mt-4">
        <WingsAssignmentTab
          schoolId={schoolId}
          canEdit={canEdit}
          onDirtyChange={(d) => setTabDirty("wings", d)}
        />
      </TabsContent>

      {/* Tab 4: Departments */}
      <TabsContent value="departments" className="mt-4">
        <DepartmentsAssignmentTab
          schoolId={schoolId}
          canEdit={canEdit}
          onAssignmentChange={async () => { await refreshStaff(); }}
          onDirtyChange={(d) => setTabDirty("departments", d)}
        />
      </TabsContent>

      {/* Tab 5: Houses */}
      <TabsContent value="houses" className="mt-4">
        <HousesAssignmentTab
          schoolId={schoolId}
          canEdit={canEdit}
          onAssignmentChange={async () => { await refreshStaff(); }}
          onDirtyChange={(d) => setTabDirty("houses", d)}
        />
      </TabsContent>

      <UnsavedChangesDialog
        open={pendingTab !== null}
        fromTabLabel={dirtyTabLabel}
        onDiscard={discardAndSwitch}
        onCancel={() => setPendingTab(null)}
      />
    </Tabs>
  );
}