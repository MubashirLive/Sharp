import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Pencil, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/text-utils";
import { HouseLogPanel } from "./HouseLogPanel";

interface House {
  name: string;
  color: string;
  emblem_url: string;
}

interface HouseIncharge {
  house_name: string;
  staff_profile_id: string;
  staff: { id: string; full_name: string | null } | null;
}

const DEFAULT_HOUSES: House[] = [
  { name: "Red", color: "#ef4444", emblem_url: "" },
  { name: "Blue", color: "#3b82f6", emblem_url: "" },
  { name: "Green", color: "#22c55e", emblem_url: "" },
  { name: "Yellow", color: "#eab308", emblem_url: "" },
];

interface HousesTabProps {
  schoolId: string;
  canEdit: boolean;
}

export function HousesTab({ schoolId, canEdit }: HousesTabProps) {
  const [houses, setHouses] = useState<House[]>(DEFAULT_HOUSES.map((h) => ({ ...h })));
  const [savedHouses, setSavedHouses] = useState<House[]>(DEFAULT_HOUSES.map((h) => ({ ...h })));
  const [houseIncharges, setHouseIncharges] = useState<HouseIncharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Direct save function
  const saveHouses = async (dataToSave: House[]) => {
    setSaving(true);
    const { error } = await supabase
      .from("schools")
      .update({ houses: dataToSave })
      .eq("id", schoolId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      setSavedHouses(JSON.parse(JSON.stringify(dataToSave)));
      setIsDirty(false);
      toast.success("House saved");
    }
  };

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmblemUrl, setEditEmblemUrl] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [originalName, setOriginalName] = useState("");
  const [originalEmblemUrl, setOriginalEmblemUrl] = useState("");

  // Reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  // Log panel
  const [showLogPanel, setShowLogPanel] = useState(false);

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    if (!schoolId) return;
    setLoading(true);

    const [{ data: schoolData }, { data: inchargeData }] = await Promise.all([
      supabase.from("schools").select("houses").eq("id", schoolId).single(),
      supabase.from("house_incharges").select("house_name, staff_profile_id, staff:profiles(id, full_name)").eq("school_id", schoolId),
    ]);

    const savedHousesData = (schoolData as any)?.houses as House[] | null;
    let loaded: House[];
    if (savedHousesData && Array.isArray(savedHousesData) && savedHousesData.length > 0) {
      loaded = DEFAULT_HOUSES.map((def, i) => ({
        ...def,
        ...(savedHousesData[i] || {}),
        name: savedHousesData[i]?.name || def.name,
        color: def.color,
        emblem_url: savedHousesData[i]?.emblem_url || "",
      }));
    } else {
      loaded = DEFAULT_HOUSES.map((h) => ({ ...h }));
    }
    setHouses(loaded);
    setSavedHouses(JSON.parse(JSON.stringify(loaded)));
    setHouseIncharges((inchargeData ?? []) as HouseIncharge[]);
    setLoading(false);
  };

  const getInchargeForHouse = (houseName: string): HouseIncharge | undefined =>
    houseIncharges.find((i) => i.house_name.toLowerCase() === houseName.toLowerCase());

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditName(houses[index].name);
    setEditEmblemUrl(houses[index].emblem_url);
    setOriginalName(houses[index].name);
    setOriginalEmblemUrl(houses[index].emblem_url);
    setEditErrors({});
    setIsDirty(false);
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setEditingIndex(null);
    setEditName("");
    setEditEmblemUrl("");
    setEditErrors({});
    setIsDirty(false);
  };

  const validateName = (name: string, excludeIndex: number): string | null => {
    if (!name.trim()) return "House name is required.";
    if (name.trim().length < 2) return "House name must be at least 2 characters.";
    if (name.trim().length > 30) return "House name must be 30 characters or less.";
    const trimmed = name.trim();
    const isDuplicate = houses.some((h, i) => i !== excludeIndex && h.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) return "This house name is already in use.";
    const validChars = /^[a-zA-Z0-9\s&()\-]+$/;
    if (!validChars.test(trimmed)) return "House name can only contain letters, numbers, spaces, & ( ) -";
    return null;
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const err = validateName(editName, editingIndex);
    if (err) {
      setEditErrors({ name: err });
      return;
    }
    const updatedHouses = houses.map((h, i) =>
      i === editingIndex ? { ...h, name: toTitleCase(editName.trim()), emblem_url: editEmblemUrl } : h
    );
    setHouses(updatedHouses);
    saveHouses(updatedHouses);
    handleCloseModal();
  };

  const handleEmblemUpload = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png", "svg"].includes(ext ?? "")) {
      toast.error("Only JPG, PNG, or SVG files are allowed.");
      return;
    }

    const path = `${schoolId}/houses/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload emblem: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
    setEditEmblemUrl(urlData.publicUrl);
    setIsDirty(true);

    // Update house and save if editing
    if (editingIndex !== null) {
      const updatedHouses = houses.map((h, i) =>
        i === editingIndex ? { ...h, emblem_url: urlData.publicUrl } : h
      );
      setHouses(updatedHouses);
      saveHouses(updatedHouses);
    }
  };

  // Check if house is at default state (no modifications made)
  const isHouseDefault = editingIndex !== null && (
    houses[editingIndex]?.name === DEFAULT_HOUSES[editingIndex]?.name &&
    houses[editingIndex]?.emblem_url === ""
  );

  const handleResetClick = () => {
    setResetConfirmText("");
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    if (editingIndex === null) return;
    const houseToReset = houses[editingIndex];
    const defaultHouse = DEFAULT_HOUSES[editingIndex];
    const updatedHouses = houses.map((h, i) =>
      i === editingIndex ? { ...h, name: defaultHouse.name, emblem_url: "" } : h
    );
    setHouses(updatedHouses);
    saveHouses(updatedHouses);
    handleCloseModal();
    setResetDialogOpen(false);
    setResetConfirmText("");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading houses...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Houses</h2>
          <p className="text-xs text-muted-foreground">Edit house name and emblem. Staff assignment is done in Role Manager.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowLogPanel(true)}>
            <History className="h-3.5 w-3.5 mr-1" />
            Log
          </Button>
        </div>
      </div>

      {/* Houses table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Emblem</th>
              <th className="text-left p-3 font-medium">House Name</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {houses.map((house, index) => (
              <tr key={index} className="border-b hover:bg-muted/20">
                <td className="p-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden"
                    style={{ background: house.emblem_url ? "transparent" : house.color }}
                  >
                    {house.emblem_url ? (
                      <img src={house.emblem_url} alt={house.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      house.name[0]
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className="font-medium">{house.name}</span>
                </td>
                <td className="p-3 text-right">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleEditClick(index)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit House</DialogTitle>
            <DialogDescription>
              Change the name and emblem for this house. Staff assignment is managed in Role Manager.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Emblem */}
            <div className="flex flex-col items-center gap-2">
              <label htmlFor="emblem-upload" className="cursor-pointer group relative block">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-sm overflow-hidden border-2 border-dashed border-muted-foreground"
                  style={{ background: editEmblemUrl ? "transparent" : houses[editingIndex ?? 0]?.color }}
                >
                  {editEmblemUrl ? (
                    <img src={editEmblemUrl} alt={editName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    houses[editingIndex ?? 0]?.name[0] ?? "?"
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">Upload</span>
                </div>
              </label>
              <input
                id="emblem-upload"
                type="file"
                accept="image/jpeg,image/png,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleEmblemUpload(file);
                  e.target.value = "";
                }}
              />
              <p className="text-xs text-muted-foreground">Click to upload JPG, PNG, or SVG</p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">House Name</label>
              <Input
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setEditErrors({}); setIsDirty(e.target.value !== originalName || editEmblemUrl !== originalEmblemUrl); }}
                className={`text-sm ${editErrors.name ? "border-destructive" : ""}`}
                placeholder="House name"
                maxLength={30}
              />
              {editErrors.name && <p className="text-xs text-destructive">{editErrors.name}</p>}
            </div>

            {/* Reset — only show if house has been modified from default */}
            {!isHouseDefault && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-destructive border-destructive/50 hover:text-destructive"
                  onClick={handleResetClick}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset to Default
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !isDirty}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(open) => { if (!open) { setResetDialogOpen(false); setResetConfirmText(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Reset House?</DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-2">
            <p>This will restore "{houses[editingIndex ?? 0]?.name}" to its default name and clear the emblem. This cannot be undone.</p>
            <div className="space-y-1.5 pt-2">
              <p className="text-sm">
                Type <span className="font-mono font-medium text-destructive">{houses[editingIndex ?? 0]?.name}</span> to confirm:
              </p>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder={houses[editingIndex ?? 0]?.name}
                className="text-sm"
                autoComplete="off"
              />
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetDialogOpen(false); setResetConfirmText(""); }} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReset}
              disabled={saving || resetConfirmText.trim() !== houses[editingIndex ?? 0]?.name}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Reset House
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log panel */}
      <HouseLogPanel
        open={showLogPanel}
        onOpenChange={setShowLogPanel}
        schoolId={schoolId}
      />
    </div>
  );
}

async function logHouseAction({
  schoolId,
  userId,
  userName,
  houseName,
  action,
  oldValue,
  newValue,
  what,
}: {
  schoolId: string;
  userId: string;
  userName: string;
  houseName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  what: string;
}) {
  await supabase.from("houses_audit_log").insert({
    school_id: schoolId,
    house_name: houseName,
    action,
    actor_id: userId,
    actor_name: userName,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}