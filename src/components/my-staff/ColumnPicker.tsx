import { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface MergedColumn {
  id: string;
  name: string;
  fields: string[];
  delimiter: string;
}

interface ColumnPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  isAdmin: boolean;
  mergedColumns?: MergedColumn[];
  onMergedColumnsChange?: (merged: MergedColumn[]) => void;
}

const ALL_COLUMNS: { key: string; label: string; category: string; sensitive?: boolean }[] = [
  { key: "profile_completion", label: "Profile Completion", category: "Personal Info" },
  { key: "gender", label: "Gender", category: "Personal Info" },
  { key: "dob", label: "Date of Birth", category: "Personal Info" },
  { key: "blood_group", label: "Blood Group", category: "Personal Info" },
  { key: "qualification", label: "Qualification", category: "Personal Info" },
  { key: "login_mobile", label: "Login Mobile", category: "Contact" },
  { key: "whatsapp_mobile", label: "WhatsApp", category: "Contact" },
  { key: "email", label: "Official Email", category: "Contact" },
  { key: "personal_email", label: "Personal Email", category: "Contact", sensitive: true },
  { key: "emergency_contact_name", label: "Emergency Contact", category: "Contact" },
  { key: "emergency_contact_number", label: "Emergency Number", category: "Contact" },
  { key: "local_address", label: "Local Address", category: "Address" },
  { key: "permanent_address", label: "Permanent Address", category: "Address", sensitive: true },
  { key: "employment_status", label: "Employment Type", category: "Employment" },
  { key: "designation", label: "Designation", category: "Employment" },
  { key: "department", label: "Department", category: "Employment" },
  { key: "joining_date", label: "Joining Date", category: "Employment" },
  { key: "grade_level", label: "Grade Level", category: "Employment" },
];

const DELIMITER_OPTIONS = [
  { val: " - ", disp: "-" },
  { val: ", ", disp: "," },
  { val: " | ", disp: "|" },
  { val: " / ", disp: "/" },
];

export function ColumnPicker({
  open,
  onOpenChange,
  selectedColumns,
  onColumnsChange,
  isAdmin,
  mergedColumns = [],
  onMergedColumnsChange,
}: ColumnPickerProps) {
  const [search, setSearch] = useState("");
  const [mergedDialogOpen, setMergedDialogOpen] = useState(false);
  const [newMergedName, setNewMergedName] = useState("");
  const [newMergedFields, setNewMergedFields] = useState<string[]>([]);
  const [newMergedDelimiter, setNewMergedDelimiter] = useState(" - ");

  const filteredColumns = ALL_COLUMNS.filter((col) => {
    if (isAdmin && col.sensitive) return false;
    if (search) {
      return col.label.toLowerCase().includes(search.toLowerCase()) ||
             col.key.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const categories = filteredColumns.reduce((acc, col) => {
    if (!acc[col.category]) acc[col.category] = [];
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, typeof ALL_COLUMNS>);

  const handleToggle = (key: string) => {
    if (selectedColumns.includes(key)) {
      onColumnsChange(selectedColumns.filter((k) => k !== key));
    } else {
      if (selectedColumns.length >= 20) return;
      onColumnsChange([...selectedColumns, key]);
    }
  };

  const selectedCount = selectedColumns.length;

  const handleCreateMerged = () => {
    if (!onMergedColumnsChange || !newMergedName.trim() || newMergedFields.length < 2) return;
    const newMerged: MergedColumn = {
      id: `merged_${Date.now()}`,
      name: newMergedName.trim(),
      fields: newMergedFields,
      delimiter: newMergedDelimiter,
    };
    onMergedColumnsChange([...mergedColumns, newMerged]);
    setNewMergedName("");
    setNewMergedFields([]);
    setNewMergedDelimiter(" - ");
    setMergedDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Column Picker</span>
              <Badge variant="secondary">{selectedCount} / 20</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4">
            <Input
              placeholder="Search columns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Fixed Columns</p>
              <div className="flex flex-wrap gap-2">
                {["Staff", "Staff ID", "Messenger Tag", "Role", "Status", "Joined", "Actions"].map((col) => (
                  <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
                ))}
              </div>
            </div>

            {Object.entries(categories).map(([category, cols]) => (
              <div key={category}>
                <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
                <div className="space-y-1">
                  {cols.map((col) => (
                    <label
                      key={col.key}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedColumns.length >= 20 && !selectedColumns.includes(col.key) && "opacity-50"
                      )}
                    >
                      <Checkbox
                        checked={selectedColumns.includes(col.key)}
                        onCheckedChange={() => handleToggle(col.key)}
                        disabled={selectedColumns.length >= 20 && !selectedColumns.includes(col.key)}
                      />
                      <span className="text-sm">{col.label}</span>
                      {col.sensitive && (
                        <Badge variant="outline" className="text-xs ml-auto">Sensitive</Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {onMergedColumnsChange && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Merged Columns</p>
                  <Button variant="outline" size="sm" onClick={() => setMergedDialogOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Create Merged
                  </Button>
                </div>
                {mergedColumns.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Combine 2+ fields into one column</p>
                ) : (
                  <div className="space-y-1">
                    {mergedColumns.map((mc) => (
                      <div key={mc.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">{mc.name}</p>
                          <p className="text-xs text-muted-foreground">{mc.fields.join(mc.delimiter)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMergedColumnsChange(mergedColumns.filter((m) => m.id !== mc.id))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedCount === 20 ? "Max columns reached" : `${20 - selectedCount} remaining`}
            </p>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mergedDialogOpen} onOpenChange={setMergedDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Merged Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Column Name</label>
              <Input
                value={newMergedName}
                onChange={(e) => setNewMergedName(e.target.value)}
                placeholder="e.g. City - State"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fields (select 2+)</label>
              <div className="mt-2 space-y-1 max-h-[150px] overflow-auto">
                {ALL_COLUMNS.filter((c) => !c.sensitive || !isAdmin).map((col) => {
                  const checked = newMergedFields.includes(col.key);
                  return (
                    <label key={col.key} className="flex items-center gap-2 p-1 cursor-pointer hover:bg-muted/50 rounded">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => {
                          if (checked) {
                            setNewMergedFields(newMergedFields.filter((f) => f !== col.key));
                          } else {
                            setNewMergedFields([...newMergedFields, col.key]);
                          }
                        }}
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Delimiter</label>
              <div className="flex gap-2 mt-1">
                {DELIMITER_OPTIONS.map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setNewMergedDelimiter(item.val)}
                    className={cn(
                      "px-3 py-1 text-xs rounded border",
                      newMergedDelimiter === item.val ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {item.disp}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergedDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!newMergedName.trim() || newMergedFields.length < 2}
              onClick={handleCreateMerged}
            >
              <Check className="h-4 w-4 mr-1" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}