import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Search, History, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getDepartmentsWithDetails, logDepartmentAction, type DepartmentWithDetails } from "@/integrations/supabase/queries/departments";
import { DepartmentCreateModal } from "./DepartmentCreateModal";
import { DepartmentEditModal } from "./DepartmentEditModal";
import { DepartmentListRow } from "./DepartmentListRow";
import { DepartmentLogPanel } from "./DepartmentLogPanel";

interface DepartmentsTabProps {
  schoolId: string;
  canEdit: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

export function DepartmentsTab({ schoolId, canEdit, currentUserId, currentUserName }: DepartmentsTabProps) {
  const [departments, setDepartments] = useState<DepartmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentWithDetails | null>(null);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [logDeptFilter, setLogDeptFilter] = useState<string | undefined>(undefined);
  const [logDeptName, setLogDeptName] = useState<string | undefined>(undefined);

  // Per-operation loading state
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state (type-to-confirm)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetDept, setDeleteTargetDept] = useState<DepartmentWithDetails | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    if (!schoolId) return;
    setLoading(true);
    const deptData = await getDepartmentsWithDetails(schoolId);
    setDepartments(deptData);
    setLoading(false);
  };

  const handleEditDept = (dept: DepartmentWithDetails) => {
    setEditingDept(dept);
    setEditModalOpen(true);
  };

  // Delete flow (from card or edit mode)
  const handleDeleteClick = (dept: DepartmentWithDetails) => {
    setDeleteTargetDept(dept);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetDept) return;
    if (deleteConfirmText !== deleteTargetDept.name) return;

    setIsSaving(true);
    try {
      await Promise.all([
        supabase.from("department_incharges").delete().eq("department_id", deleteTargetDept.id),
        supabase.from("departments_staff").delete().eq("department_id", deleteTargetDept.id),
      ]);
      await supabase.from("departments").delete().eq("id", deleteTargetDept.id);
      await logDepartmentAction({
        schoolId,
        userId: currentUserId ?? "",
        userName: currentUserName ?? "",
        deptName: deleteTargetDept.name,
        action: "deleted",
        what: `Department "${deleteTargetDept.name}" deleted`,
      });
      toast.success("Department deleted");
      setDeleteDialogOpen(false);
      setDeleteTargetDept(null);
      setDeleteConfirmText("");
      setEditingDept(null);
      setEditModalOpen(false);
      fetchData();
      setIsSaving(false);
    } catch (error) {
      toast.error("Failed to delete department");
      setIsSaving(false); toast.error(error instanceof Error ? error.message : "Operation failed");
    }
  };

  const filteredDepartments = departments.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading departments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {departments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setLogDeptFilter(undefined); setLogDeptName(undefined); setShowLogPanel(true); }}
            >
              <History className="h-3.5 w-3.5 mr-1" />
              Log
            </Button>
          )}

          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setCreateModalOpen(true)} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add New
            </Button>
          )}
        </div>
      </div>

      {/* Department list */}
      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12 border rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">No departments yet.</p>
          {canEdit && (
            <p className="text-xs text-muted-foreground">Add your first department to get started.</p>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setCreateModalOpen(true)} className="mt-3 h-8">
              <PlusCircle className="h-4 w-4 mr-1" />
              Add First Department
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dept) => (
                <DepartmentListRow
                  key={dept.id}
                  department={dept}
                  onEdit={() => handleEditDept(dept)}
                  canEdit={canEdit}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirm Dialog — type department name to confirm */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setDeleteTargetDept(null);
          setDeleteConfirmText("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete {deleteTargetDept?.name ?? "this department"}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This action is <span className="font-medium text-foreground">permanent and cannot be undone.</span>
            </p>
            <p className="text-sm">
              The department will be permanently deleted. All incharges and members will be unassigned.
            </p>
            <div className="space-y-1.5 pt-1">
              <p className="text-sm">
                Type <span className="font-mono font-medium text-destructive">{deleteTargetDept?.name}</span> to confirm:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTargetDept?.name}
                className="text-sm"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSaving || deleteConfirmText !== deleteTargetDept?.name}
            >
              {isSaving ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Panel */}
      <DepartmentLogPanel
        open={showLogPanel}
        onOpenChange={setShowLogPanel}
        schoolId={schoolId}
        deptFilter={logDeptFilter}
        deptName={logDeptName}
      />

      {/* Create Modal */}
      <DepartmentCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        schoolId={schoolId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        existingNames={departments.map((d) => d.name)}
        onCreated={fetchData}
      />

      {/* Edit Modal */}
      {editingDept && (
        <DepartmentEditModal
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open);
            if (!open) setEditingDept(null);
          }}
          department={editingDept}
          schoolId={schoolId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          existingNames={departments.map((d) => d.name)}
          onSaved={fetchData}
          onDeleted={() => handleDeleteClick(editingDept)}
        />
      )}
    </div>
  );
}