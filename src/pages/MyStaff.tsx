import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getStaffWithDetails,
  applyStaffFilters,
  sortStaffList,
  computeStaffStats,
  updateMessengerTag,
  toggleStaffStatus,
  updateStaff,
  canDeactivateStaff,
  saveColumnPreferences,
  getColumnPreferences,
  type StaffWithDetails,
  type StaffFilters,
  type SortOption,
} from "@/integrations/supabase/queries/staff";
import { exportStaffToExcel, exportStaffToPDF } from "@/integrations/supabase/queries/staffExport";
import { downloadStaffIdCard } from "@/integrations/supabase/queries/staffIdCard";
import { supabase } from "@/integrations/supabase/client";
import { StatCards } from "@/components/my-staff/StatCards";
import { FilterBar } from "@/components/my-staff/FilterBar";
import { StaffTable, type DynamicColumn } from "@/components/my-staff/StaffTable";
import { ColumnPicker, type MergedColumn } from "@/components/my-staff/ColumnPicker";
import { BulkActionsToolbar } from "@/components/my-staff/BulkActionsToolbar";
import { StaffFormOverlay } from "@/components/my-staff/StaffFormOverlay";
import { StaffProfileDrawer } from "@/components/my-staff/StaffProfileDrawer";
import { PendingProfilesTab } from "@/components/my-staff/PendingProfilesTab";
import { InactiveStaffTab } from "@/components/my-staff/InactiveStaffTab";
import { QuickEnroll } from "@/components/my-staff/QuickEnroll";
import { BulkImport } from "@/components/my-staff/BulkImport";
import { StaffCardView } from "@/components/my-staff/StaffCardView";
import { DeleteStaffDialog } from "@/components/my-staff/DeleteStaffDialog";
import { LayoutGrid, List } from "lucide-react";

type TabType = "directory" | "pending" | "inactive";

// Default dynamic columns
const DEFAULT_COLUMNS: DynamicColumn[] = [];

export default function MyStaffPage() {
  const { role, school, user } = useAuth();
  const schoolId = school?.id ?? "";
  const userId = user?.id ?? "";

  // State
  const [staff, setStaff] = useState<StaffWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("directory");
  const [filters, setFilters] = useState<StaffFilters>({});
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("name_asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dynamicColumns, setDynamicColumns] = useState<DynamicColumn[]>(DEFAULT_COLUMNS);
  const [mergedColumns, setMergedColumns] = useState<MergedColumn[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Dialogs
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffWithDetails | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffWithDetails | null>(null);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [quickEnrollOpen, setQuickEnrollOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffWithDetails | null>(null);

  // Pending/Inactive filtered lists
  const pendingStaff = useMemo(() => staff.filter((s) => s.status === "draft"), [staff]);
  const inactiveStaff = useMemo(() => staff.filter((s) => s.status === "inactive"), [staff]);

  // Permissions
  const canEdit = role === "principal" || role === "master_admin";
  const isAdmin = role === "admin";

  // Load staff data
  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      setStaff([]);
      return;
    }

    const loadStaff = async () => {
      setLoading(true);
      try {
        const data = await getStaffWithDetails(schoolId);
        setStaff(data);

        // Load column preferences
        if (userId) {
          const prefs = await getColumnPreferences(userId);
          if (prefs) {
            setDynamicColumns(
              prefs.map((key) => ({
                key,
                label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load staff:", err);
        toast.error("Failed to load staff directory");
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [schoolId, userId]);

  // Apply filters and compute stats
  const filteredStaff = useMemo(() => {
    let result = staff;

    // Apply status filter from stat cards
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Apply search/role filters
    result = applyStaffFilters(result, filters);

    // Apply sort
    result = sortStaffList(result, sort);

    return result;
  }, [staff, filters, statusFilter, sort]);

  const stats = useMemo(() => computeStaffStats(staff), [staff]);

  // Handlers
  const handleFilterByStatus = useCallback((status: "active" | "inactive" | "draft" | null) => {
    setStatusFilter(status);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setStatusFilter(null);
  }, []);

  const handleInlineTagEdit = useCallback(async (staffId: string, tag: string) => {
    const success = await updateMessengerTag(staffId, tag);
    if (success) {
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, messenger_tag: tag || undefined } : s))
      );
      toast.success("Messenger Tag updated");
    } else {
      toast.error("Failed to update Messenger Tag");
    }
  }, []);

  const handleToggleStatus = useCallback(async (staff: StaffWithDetails) => {
    // Check cascade dependencies
    const check = await canDeactivateStaff(staff.id, schoolId);
    if (!check.can) {
      toast.error(check.reason ?? "Cannot change status");
      return;
    }

    const newStatus = staff.status === "active" ? "inactive" : "active";
    const success = await toggleStaffStatus(staff.id, newStatus as "active" | "inactive");
    if (success) {
      setStaff((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, status: newStatus } : s))
      );
      toast.success(`Staff ${newStatus === "active" ? "activated" : "deactivated"}`);
    } else {
      toast.error("Failed to change status");
    }
  }, [schoolId]);

  const handleDelete = useCallback((staff: StaffWithDetails) => {
    setDeletingStaff(staff);
  }, []);

  const handleDeleted = useCallback(async (deletedStaffId: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== deletedStaffId));
    // Clear any viewing/editing state on the deleted staff
    setViewingStaff((v) => (v?.id === deletedStaffId ? null : v));
    setEditingStaff((e) => (e?.id === deletedStaffId ? null : e));
    // Refresh to ensure consistency
    if (schoolId) {
      try {
        const data = await getStaffWithDetails(schoolId);
        setStaff(data);
      } catch (err) {
        console.error("Failed to refresh after delete:", err);
      }
    }
  }, [schoolId]);

  const handleDownloadIdCard = useCallback((s: StaffWithDetails) => {
    downloadStaffIdCard(s, school?.name ?? "School", school?.acronym ?? "SCH");
  }, [school]);

  const handleBulkIdCards = useCallback(() => {
    const selected = filteredStaff.filter((s) => selectedIds.has(s.id));
    if (selected.length > 100) {
      toast.error("Maximum 100 ID cards per batch. Select fewer staff.");
      return;
    }
    selected.forEach((s) => downloadStaffIdCard(s, school?.name ?? "School", school?.acronym ?? "SCH"));
    toast.success(`${selected.length} ID cards downloaded`);
  }, [selectedIds, filteredStaff, school]);

  const handleColumnsChange = useCallback(async (columns: string[]) => {
    setDynamicColumns(
      columns.map((key) => ({
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      }))
    );

    // Save to DB
    if (userId) {
      await saveColumnPreferences(userId, columns);
    }
  }, [schoolId, userId]);

  const handleSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedIds(ids);
  }, []);

  // Export handlers
  const handleExportExcel = useCallback(async () => {
    const toExport = selectedIds.size > 0
      ? filteredStaff.filter((s) => selectedIds.has(s.id))
      : filteredStaff;

    const columns = dynamicColumns.map((c) => ({ key: c.key, label: c.label }));
    await exportStaffToExcel(toExport, columns, school?.name ?? "School");
  }, [selectedIds, filteredStaff, dynamicColumns, school]);

  const handleExportPDF = useCallback(async () => {
    const toExport = selectedIds.size > 0
      ? filteredStaff.filter((s) => selectedIds.has(s.id))
      : filteredStaff;

    const columns = dynamicColumns.map((c) => ({ key: c.key, label: c.label }));
    await exportStaffToPDF(toExport, columns, school?.name ?? "School");
  }, [selectedIds, filteredStaff, dynamicColumns, school]);

  const hasActiveFilters = Object.keys(filters).some((k) => {
    const val = (filters as any)[k];
    return val !== undefined && (Array.isArray(val) ? val.length > 0 : true);
  }) || statusFilter !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Staff</h1>
          <p className="text-muted-foreground">Staff directory and identity management</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={() => setCreatingStaff(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { key: "directory", label: "Directory" },
          { key: "pending", label: "Pending Profiles", count: stats.draft },
          { key: "inactive", label: "Inactive Staff", count: stats.inactive },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-muted rounded-full text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      {activeTab === "directory" && (
        <StatCards
          stats={stats}
          onFilterByStatus={handleFilterByStatus}
          activeStatusFilter={statusFilter}
        />
      )}

      {/* Filter Bar */}
      {activeTab === "directory" && (
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          onColumnPickerOpen={() => setColumnPickerOpen(true)}
          onClearAll={handleClearAllFilters}
          onQuickEnroll={() => setQuickEnrollOpen(true)}
          onBulkImport={() => setBulkImportOpen(true)}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Bulk Actions Toolbar */}
      {activeTab === "directory" && (
        <BulkActionsToolbar
          selectedCount={selectedIds.size}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onDownloadIdCards={handleBulkIdCards}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* Staff Table / Cards */}
      {activeTab === "directory" && (
        <>
          {/* View mode toggle */}
          <div className="flex items-center justify-end">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "cards" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {viewMode === "table" ? (
            <StaffTable
              staff={filteredStaff}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              onView={(s) => setViewingStaff(s)}
              onEdit={(s) => setEditingStaff(s)}
              onDownloadIdCard={handleDownloadIdCard}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
              dynamicColumns={dynamicColumns}
              mergedColumns={mergedColumns}
              canEdit={canEdit}
              userRole={role ?? "admin"}
              onInlineEditTag={canEdit ? handleInlineTagEdit : undefined}
            />
          ) : (
            <StaffCardView
              staff={filteredStaff}
              onView={(s) => setViewingStaff(s)}
              onEdit={(s) => setEditingStaff(s)}
              onDownloadIdCard={handleDownloadIdCard}
              onToggleStatus={handleToggleStatus}
              dynamicColumns={dynamicColumns}
              mergedColumns={mergedColumns}
              canEdit={canEdit}
            />
          )}
        </>
      )}

      {/* Pending Profiles Tab */}
      {activeTab === "pending" && (
        <PendingProfilesTab
          staff={pendingStaff}
          onResume={(s) => setEditingStaff(s)}
          onDelete={async (s) => {
            const { error } = await supabase
              .from("profiles")
              .update({ status: "archived" })
              .eq("id", s.id);
            if (!error) {
              setStaff((prev) => prev.filter((st) => st.id !== s.id));
              toast.success("Draft deleted");
            } else {
              toast.error("Failed to delete draft");
            }
          }}
          canEdit={canEdit}
        />
      )}

      {/* Inactive Staff Tab */}
      {activeTab === "inactive" && (
        <InactiveStaffTab
          staff={inactiveStaff}
          onView={(s) => setViewingStaff(s)}
          onEdit={(s) => setEditingStaff(s)}
          onReactivate={handleToggleStatus}
          onDelete={handleDelete}
          canEdit={canEdit}
        />
      )}

      {/* Column Picker Dialog */}
      <ColumnPicker
        open={columnPickerOpen}
        onOpenChange={setColumnPickerOpen}
        selectedColumns={dynamicColumns.map((c) => c.key)}
        onColumnsChange={handleColumnsChange}
        isAdmin={isAdmin}
        mergedColumns={mergedColumns}
        onMergedColumnsChange={setMergedColumns}
      />

      {/* Staff Form Overlay - Create Mode */}
      {creatingStaff && (
        <StaffFormOverlay
          schoolId={schoolId}
          onClose={async () => {
            // Always refresh on close — staff may have been created in Section 1 but user closed before Section 5
            setCreatingStaff(false);
            const updated = await getStaffWithDetails(schoolId);
            setStaff(updated);
          }}
          mode="create"
          onSave={async (data) => {
            // Section 1 already created the profile via Edge Function — just refresh
            // The form passes back data.id / data.profileId from the upsert call
            setCreatingStaff(false);
            toast.success("Staff profile completed");
            const updated = await getStaffWithDetails(schoolId);
            setStaff(updated);
          }}
        />
      )}

      {/* Staff Form Overlay - Edit Mode */}
      {editingStaff && (
        <StaffFormOverlay
          staff={editingStaff}
          schoolId={schoolId}
          onClose={() => setEditingStaff(null)}
          mode="edit"
          onSave={async (data) => {
            const success = await updateStaff(editingStaff.id, data);
            if (success) {
              setStaff((prev) =>
                prev.map((s) =>
                  s.id === editingStaff.id
                    ? {
                        ...s,
                        full_name: data.full_name ?? s.full_name,
                        salutation: data.salutation,
                        login_mobile: data.login_mobile,
                        email: data.email,
                        role: data.role ?? s.role,
                        status: data.status ?? s.status,
                        messenger_tag: data.messenger_tag,
                        employee_id: data.employee_id,
                        designation: data.designation,
                        department: data.department,
                        qualification: data.qualification,
                        joining_date: data.joining_date,
                        local_address: data.local_address,
                        permanent_address: data.permanent_address,
                        personal_email: data.personal_email,
                        whatsapp_mobile: data.whatsapp_mobile,
                        emergency_contact_name: data.emergency_contact_name,
                        emergency_contact_number: data.emergency_contact_number,
                        emergency_contact_relation: data.emergency_contact_relation,
                        employment_status: data.employment_status,
                        grade_level: data.grade_level,
                        blood_group: data.blood_group,
                        gender: data.gender,
                        dob: data.dob,
                        is_active: data.is_active,
                      }
                    : s
                )
              );
              toast.success("Staff profile updated");
              setEditingStaff(null);
            } else {
              toast.error("Failed to update staff profile");
            }
          }}
        />
      )}

      {/* Staff Profile Drawer (for View) */}
      {viewingStaff && (
        <StaffProfileDrawer
          staff={viewingStaff}
          onClose={() => setViewingStaff(null)}
          onViewInRoleManager={() => {
            setViewingStaff(null);
          }}
        />
      )}

      {/* Quick Enroll Dialog */}
      {quickEnrollOpen && (
        <QuickEnroll
          schoolId={schoolId}
          onClose={() => setQuickEnrollOpen(false)}
          onComplete={async () => {
            setQuickEnrollOpen(false);
            const data = await getStaffWithDetails(schoolId);
            setStaff(data);
          }}
        />
      )}

      {/* Bulk Import Dialog */}
      {bulkImportOpen && (
        <BulkImport
          schoolId={schoolId}
          onClose={() => setBulkImportOpen(false)}
          onComplete={async () => {
            setBulkImportOpen(false);
            const data = await getStaffWithDetails(schoolId);
            setStaff(data);
          }}
        />
      )}

      {/* Delete Staff Dialog (hard delete with cascade guard) */}
      <DeleteStaffDialog
        staff={deletingStaff}
        open={deletingStaff !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingStaff(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
}