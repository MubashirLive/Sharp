import { useState, useEffect, useMemo } from "react";
import { Loader2, BookOpen, Users, Building2, Home, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStaffWithDetails, type StaffWithDetails } from "@/integrations/supabase/queries/staff";
import { RoleFilterBar } from "./RoleFilterBar";
import { StaffRoleCard } from "./StaffRoleCard";
import { SubjectAssignmentGrid } from "./SubjectAssignmentGrid";
import { WingsAssignmentTab } from "./WingsAssignmentTab";
import { DepartmentsAssignmentTab } from "./DepartmentsAssignmentTab";
import { HousesAssignmentTab } from "./HousesAssignmentTab";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

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

export function RoleManagerTab({ schoolId, canEdit }: RoleManagerTabProps) {
  const { role, user } = useAuth();
  const currentUserId = user?.id ?? "";
  const isPrincipal = role === "principal";
  const isMasterAdmin = role === "master_admin";
  const [activeTab, setActiveTab] = useState("staff");

  const [staff, setStaff] = useState<StaffWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RoleFilters>({});

  // Dirty tracking for page-leave guard
  const [anyDirty, setAnyDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  // "Stay" / "Leave" choice for in-app nav block
  const [pendingNav, setPendingNav] = useState<null | ((shouldLeave: boolean) => void)>(null);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const data = await getStaffWithDetails(schoolId);
        setStaff(data);
      } catch (e) {
        toast.error("Failed to load staff");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId]);

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

  const handleRefreshStaff = async () => {
    const data = await getStaffWithDetails(schoolId);
    setStaff(data);
  };

  const handleTabChange = (next: string) => {
    if (next === activeTab) return;
    if (anyDirty) {
      setPendingTab(next);
    } else {
      setActiveTab(next);
    }
  };

  const discardAndSwitch = () => {
    setAnyDirty(false);
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
                    onRefresh={handleRefreshStaff}
                    onDirtyChange={setAnyDirty}
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
          onAssignmentChange={handleRefreshStaff}
        />
      </TabsContent>

      {/* Tab 3: Wings */}
      <TabsContent value="wings" className="mt-4">
        <WingsAssignmentTab
          schoolId={schoolId}
          canEdit={canEdit}
        />
      </TabsContent>

      {/* Tab 4: Departments */}
      <TabsContent value="departments" className="mt-4">
        <DepartmentsAssignmentTab
          schoolId={schoolId}
          canEdit={canEdit}
          onAssignmentChange={handleRefreshStaff}
        />
      </TabsContent>

      {/* Tab 5: Houses */}
      <TabsContent value="houses" className="mt-4">
        <HousesAssignmentTab
          schoolId={schoolId}
          canEdit={canEdit}
          onAssignmentChange={handleRefreshStaff}
        />
      </TabsContent>

      <UnsavedChangesDialog
        open={pendingTab !== null}
        onDiscard={discardAndSwitch}
        onCancel={() => setPendingTab(null)}
      />
    </Tabs>
  );
}