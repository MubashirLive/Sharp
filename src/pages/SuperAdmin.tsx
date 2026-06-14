import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import PrincipalEditDialog from "@/components/school/PrincipalEditDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Plus, Power, Loader2, Users, ImageIcon, Trash2, Copy, Check, Edit2, Eye, EyeOff, X,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

interface SchoolRow extends School {
  userCount?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function genIdempotencyKey(): string {
  return crypto.randomUUID();
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const BOARD_OPTIONS = ["CBSE", "ICSE", "IB", "IGCSE", "State Board", "Other"];
const SCHOOL_TYPE_OPTIONS = ["Private", "Public", "International", "Other"];
const SALUTATION_OPTIONS = ["Mr.", "Mrs.", "Ms.", "Dr."];
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 shadow-md flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, role } = useAuth();

  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SchoolRow | null>(null);
  const [deleting, setDeleting] = useState<SchoolRow | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [principalEditSchool, setPrincipalEditSchool] = useState<SchoolRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [emblemFile, setEmblemFile] = useState<File | null>(null);
  const [emblemPreview, setEmblemPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    schoolName: "", acronym: "", board: "", boardOther: "", affiliationNumber: "",
    schoolType: "", address: "", city: "", state: "", postalCode: "",
    contactPhone: "", contactEmail: "", website: "",
    salutation: "Mr.", principalName: "", principalEmail: "", principalMobile: "",
  });

  // Redirect if not superadmin
  useEffect(() => {
    if (!authLoading && (!user || role !== "superadmin")) {
      navigate("/auth/superadmin", { replace: true });
    }
  }, [authLoading, user, role, navigate]);

  // Load schools
  const loadSchools = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<{ schools: SchoolRow[] }>("superadmin-list-schools");
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
    } else if (data?.schools) {
      setSchools(data.schools);
    }
    setLoading(false);
  };

  useEffect(() => { loadSchools(); }, []);

  // Copy credentials
  const copyCreds = (school: SchoolRow) => {
    const text = `Login: ${school.principal_email}\nPassword: ${school.principal_temp_password}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(school.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Credentials copied" });
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Toggle active/inactive
  const toggleActive = async (school: SchoolRow) => {
    const newStatus = school.status === "active" ? "inactive" : "active";
    const idempotencyKey = genIdempotencyKey();
    const { error } = await supabase.functions.invoke("superadmin-toggle-school-status", {
      body: { schoolId: school.id, status: newStatus },
      headers: { "x-idempotency-key": idempotencyKey },
    });
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setSchools((prev) => prev.map((s) => s.id === school.id ? { ...s, status: newStatus } : s));
      toast({ title: newStatus === "active" ? "School activated" : "School deactivated" });
    }
  };

  // Delete school — calls edge function for full cleanup
  const handleDelete = async () => {
    if (!deleting) return;
    if (deleteConfirmName !== deleting.name) {
      toast({ title: "Name does not match", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("delete-school", {
        body: { schoolId: deleting.id },
      });
      if (error) throw error;
      setSchools((prev) => prev.filter((s) => s.id !== deleting.id));
      setDeleting(null);
      setDeleteConfirmName("");
      toast({ title: "School and all associated data deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Emblem preview
  const handleEmblemChange = (file: File | null) => {
    setEmblemFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setEmblemPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setEmblemPreview(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({ schoolName: "", acronym: "", board: "", boardOther: "", affiliationNumber: "",
      schoolType: "", address: "", city: "", state: "", postalCode: "",
      salutation: "Mr.", principalName: "", principalEmail: "", principalMobile: "" });
    setEmblemFile(null);
    setEmblemPreview(null);
  };

  // Open create
  const openCreate = () => { resetForm(); setShowCreate(true); };
  // Open edit
  const openEdit = (school: SchoolRow) => {
    setEditing(school);
    setForm({
      schoolName: school.name || "",
      acronym: school.acronym || "",
      board: (school.academic_board || school.board || "") as string,
      boardOther: "",
      affiliationNumber: school.affiliation_number || "",
      schoolType: school.school_type || "",
      address: school.address || "",
      city: school.city || "",
      state: school.state || "",
      postalCode: school.postal_code || "",
      contactPhone: (school as any).contact_phone || (school as any).contact_number || "",
      contactEmail: (school as any).contact_email || (school as any).email || "",
      website: school.website || "",
      salutation: "Mr.", principalName: school.principal_name || "", principalEmail: school.principal_email || "", principalMobile: school.principal_mobile || "",
    });
    setEmblemFile(null);
    setEmblemPreview(null);
  };

  // Submit create/edit
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emblemFile && !editing) {
      toast({ title: "Emblem required", description: "Upload the school emblem.", variant: "destructive" });
      return;
    }
    setBusy(true);

    try {
      const boardValue = form.board === "Other" ? form.boardOther : form.board;
      const slug = slugify(form.schoolName);

      // Convert emblem to base64 (edge function uploads it server-side)
      let emblemBase64: string | null = null;
      if (emblemFile) {
        emblemBase64 = await readFileAsBase64(emblemFile);
      }

      if (editing) {
        // Update school
        const idempotencyKey = genIdempotencyKey();
        const { error: err } = await supabase.functions.invoke("superadmin-update-school", {
          body: {
            schoolId: editing.id,
            schoolName: form.schoolName,
            acronym: form.acronym,
            slug,
            academicBoard: boardValue,
            affiliationNumber: form.affiliationNumber || null,
            schoolType: form.schoolType,
            address: form.address,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            contactPhone: form.contactPhone || null,
            contactEmail: form.contactEmail || null,
            website: form.website || null,
            emblemBase64,
            principalName: form.principalName,
            principalEmail: form.principalEmail,
            principalMobile: form.principalMobile,
          },
          headers: { "x-idempotency-key": idempotencyKey },
        });
        if (err) throw new Error(err.message);
        setEditing(null);
        toast({ title: "School updated" });
        loadSchools();
      } else {
        // Create school
        const idempotencyKey = genIdempotencyKey();
        const { data, error: createErr } = await supabase.functions.invoke<{
          schoolId: string;
          tempPassword: string;
        }>("superadmin-create-school", {
          body: {
            schoolName: form.schoolName,
            acronym: form.acronym,
            slug,
            academicBoard: boardValue,
            affiliationNumber: form.affiliationNumber || null,
            schoolType: form.schoolType,
            address: form.address,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            contactPhone: form.contactPhone || null,
            contactEmail: form.contactEmail || null,
            website: form.website || null,
            emblemBase64,
            principalName: form.principalName,
            principalEmail: form.principalEmail,
            principalMobile: form.principalMobile,
          },
          headers: { "x-idempotency-key": idempotencyKey },
        });
        if (createErr) throw new Error(createErr.message);
        if (data?.schoolId) {
          toast({
            title: "School created",
            description: `Login: ${form.principalEmail} | Password: ${data.tempPassword}`,
          });
          setShowCreate(false);
          loadSchools();
        }
      }
    } catch (err: any) {
      console.error("[SuperAdmin] handleSubmit error:", err);
      if (err.message?.includes("School name already exists")) {
        toast({ title: "School name already exists", variant: "destructive" });
      } else {
        toast({ title: "Save failed", description: err.message, variant: "destructive" });
      }
    }

    setBusy(false);
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const stats = {
    total: schools.length,
    active: schools.filter((s) => s.status === "active").length,
    pending: schools.filter((s) => !s.onboarding_complete).length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="clay-page-header">
            <h1>All Schools</h1>
            <p>Manage schools, principals, and onboarding status</p>
          </div>
          <Button onClick={openCreate} className="clay-btn clay-btn-primary cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" />
            Add School
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Building2} label="Total Schools" value={stats.total} />
          <StatCard icon={Power} label="Active" value={stats.active} />
          <StatCard icon={Users} label="Awaiting Onboarding" value={stats.pending} />
        </div>

        {/* School table */}
        {schools.length === 0 ? (
          <div className="rounded-xl border bg-card px-5 py-12 text-center shadow-md">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No schools yet. Create the first one.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="clay-table w-full">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">School</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Principal</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Onboarding</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Credentials</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => {
                    const isRevealed = revealedIds.has(school.id);
                    const pwd = school.principal_temp_password || "—";
                    return (
                      <tr key={school.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {school.emblem_url ? (
                              <img src={school.emblem_url} alt="" loading="lazy" decoding="async" className="h-9 w-9 rounded-lg object-cover border" />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center border">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{school.name}</p>
                              <p className="text-xs text-muted-foreground">{school.acronym} · {school.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm">{school.principal_name}</p>
                              <p className="text-xs text-muted-foreground">{school.principal_email}</p>
                            </div>
                            <button
                              onClick={() => setPrincipalEditSchool(school)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                              title="Edit principal"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={school.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"}>
                            {school.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={school.onboarding_complete ? "default" : "outline"}>
                            {school.onboarding_complete ? "Complete" : "Pending"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs bg-muted px-2 py-1 rounded max-w-[100px] truncate">
                              {isRevealed ? pwd : "••••••••"}
                            </code>
                            <button
                              onClick={() => toggleReveal(school.id)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                              title={isRevealed ? "Hide" : "Reveal"}
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => copyCreds(school)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                              title="Copy"
                            >
                              {copiedId === school.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleActive(school)}
                              className="cursor-pointer"
                              title={school.status === "active" ? "Deactivate" : "Activate"}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(school)} className="cursor-pointer">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setDeleting(school); setDeleteConfirmName(""); }}
                              className="cursor-pointer text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate || !!editing} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit School — ${editing.name}` : "Create School + Principal"}</DialogTitle>
            <DialogDescription>
              {editing ? "All fields are editable by Super Admin." : "Creates school record and principal account simultaneously."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Identity */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">School Identity</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input id="schoolName" value={form.schoolName} onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))} placeholder="DELHI PUBLIC SCHOOL" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acronym">Acronym *</Label>
                  <Input id="acronym" value={form.acronym} onChange={(e) => setForm((f) => ({ ...f, acronym: e.target.value.toUpperCase() }))} placeholder="DPS" maxLength={6} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Academic Board *</Label>
                  <Select value={form.board} onValueChange={(v) => setForm((f) => ({ ...f, board: v }))}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select board" /></SelectTrigger>
                    <SelectContent>
                      {BOARD_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.board === "State Board" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="boardOther">State Board Name *</Label>
                    <Input id="boardOther" value={form.boardOther} onChange={(e) => setForm((f) => ({ ...f, boardOther: e.target.value }))} placeholder="Maharashtra State Board" required />
                  </div>
                )}
                {(form.board === "CBSE" || form.board === "ICSE") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="affiliationNumber">Affiliation Number</Label>
                    <Input id="affiliationNumber" value={form.affiliationNumber} onChange={(e) => setForm((f) => ({ ...f, affiliationNumber: e.target.value }))} placeholder="1234567" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>School Type *</Label>
                  <Select value={form.schoolType} onValueChange={(v) => setForm((f) => ({ ...f, schoolType: v }))}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Location</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>State *</Label>
                  <Select value={form.state} onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="NEW DELHI" required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="12 COMMUNITY CENTRE, SECTOR 15" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input id="postalCode" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} placeholder="110001" maxLength={6} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input value="India" disabled className="clay-input bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">School Contact Number</Label>
                  <Input id="contactPhone" type="tel" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="011-27554321" maxLength={15} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">School Email</Label>
                  <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} placeholder="office@school.edu" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">School Website</Label>
                  <Input id="website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="www.school.edu" />
                </div>
              </div>
            </div>

            {/* Emblem */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">School Branding</h3>
              <div className="space-y-1.5">
                <Label>School Emblem * {editing && "(skip to keep existing)"}</Label>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => handleEmblemChange(e.target.files?.[0] || null)} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-muted/30"
                >
                  {emblemPreview || (editing as any)?.emblem_url ? (
                    <img
                      src={emblemPreview || (editing as any)?.emblem_url}
                      alt="Emblem preview"
                      loading="lazy"
                      decoding="async"
                      className="h-28 w-28 object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-1" />
                      <span className="text-xs">Click to upload · PNG or JPG · Max 2MB</span>
                    </div>
                  )}
                </button>
                {emblemPreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { handleEmblemChange(null); setEmblemPreview(null); }} className="cursor-pointer">
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Principal */}
            {!editing && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Principal Account</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Salutation *</Label>
                    <Select value={form.salutation} onValueChange={(v) => setForm((f) => ({ ...f, salutation: v }))}>
                      <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SALUTATION_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="principalName">Full Name *</Label>
                    <Input id="principalName" value={form.principalName} onChange={(e) => setForm((f) => ({ ...f, principalName: e.target.value }))} placeholder="Rajesh Kumar" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="principalEmail">Email (Login ID) *</Label>
                    <Input id="principalEmail" type="email" value={form.principalEmail} onChange={(e) => setForm((f) => ({ ...f, principalEmail: e.target.value }))} placeholder="rajesh@school.edu" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="principalMobile">Mobile *</Label>
                    <Input id="principalMobile" type="tel" value={form.principalMobile} onChange={(e) => setForm((f) => ({ ...f, principalMobile: e.target.value }))} placeholder="9876543210" maxLength={10} required />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Temporary password will be auto-generated. Share credentials manually with principal.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }} className="clay-btn cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="clay-btn clay-btn-primary cursor-pointer">
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editing ? "Save Changes" : "Create School"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o) { setDeleting(null); setDeleteConfirmName(""); } }}>
        <DialogContent className="rounded-xl bg-card border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete School</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleting?.name}</strong> and all its data. This action cannot be undone.
              <br /><br />
              Type <strong>{deleting?.name}</strong> to confirm:
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder={deleting?.name}
            className="clay-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleting(null); setDeleteConfirmName(""); }} className="clay-btn cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmName !== deleting?.name || busy}
              onClick={handleDelete}
              className="cursor-pointer"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Principal Edit Dialog */}
      {principalEditSchool && (
        <PrincipalEditDialog
          school={principalEditSchool}
          open={!!principalEditSchool}
          onOpenChange={(o) => { if (!o) setPrincipalEditSchool(null); }}
          onSaved={loadSchools}
        />
      )}
    </AppShell>
  );
}