import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  StudentFormDialog, getInitials, statusBadge, type Student,
} from "./Students";
import {
  ArrowLeft, Edit2, Trash2, User, Mail, Phone, MapPin, BookOpen,
  Users, Heart, ClipboardList, FileText,
} from "lucide-react";

function InfoRow({ label, value }: { label: string; value?: string | React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-border/50 last:border-0">
      <dt className="text-xs text-muted-foreground w-40 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-xl bg-blue-50 p-1.5">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <dl>{children}</dl>
    </div>
  );
}

function ParentInfo({ title, name, contact, email }: { title: string; name: string; contact: string; email: string }) {
  return (
    <div className="border-b border-border/50 last:border-0 py-2">
      <p className="text-xs text-muted-foreground mb-1.5">{title}</p>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{name || "—"}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {contact && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact}</span>}
          {email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>}
        </div>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // TODO: Wire up to Supabase - student detail view pending implementation
  if (!id) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <p className="text-muted-foreground">Student detail view is under construction.</p>
          <Button asChild variant="outline">
            <Link to="/students">← Back to My Students</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const student = null; // Placeholder - wire up to Supabase query

  function handleSave(_updated: Student) {
    // TODO: Wire up to Supabase
  }

  function handleDelete() {
    // TODO: Wire up to Supabase
    navigate("/students");
  }

  return (
    <AppShell>
      <div className="space-y-5 max-w-5xl">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/students"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/students" className="hover:text-foreground transition-colors">My Students</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{student.firstName} {student.lastName}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive clay-btn cursor-pointer">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)} className="clay-btn clay-btn-primary cursor-pointer">
              <Edit2 className="h-4 w-4 mr-1.5" />
              Edit Student
            </Button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="rounded-xl border bg-card px-5 py-5 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg">
              {getInitials(student.firstName, student.lastName)}
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{student.firstName} {student.middleName && `${student.middleName} `}{student.lastName}</h2>
                {statusBadge(student.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {student.studentAppId} &nbsp;·&nbsp; Class {student.class} &nbsp;Section {student.section} &nbsp;·&nbsp; Roll #{student.rollNo}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Adm: {new Date(student.admissionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
                {student.bloodGroup && <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{student.bloodGroup}</span>}
                {student.gender && <span>{student.gender}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 6-Section Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* 1. Personal Information */}
          <SectionCard icon={User} title="Personal Information">
            <InfoRow label="Full Name" value={`${student.firstName}${student.middleName ? ` ${student.middleName}` : ""} ${student.lastName}`} />
            <InfoRow label="Student App ID" value={student.studentAppId} />
            <InfoRow label="Student ID No." value={student.studentIdNo} />
            <InfoRow label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"} />
            <InfoRow label="Gender" value={student.gender || "—"} />
            <InfoRow label="Blood Group" value={student.bloodGroup || "—"} />
          </SectionCard>

          {/* 2. Contact & Address */}
          <SectionCard icon={MapPin} title="Contact &amp; Address">
            <InfoRow label="Login Mobile" value={student.loginMobile || "—"} />
            <InfoRow label="Father's Contact" value={student.fatherContact || "—"} />
            <InfoRow label="Mother's Contact" value={student.motherContact || "—"} />
            <InfoRow label="Local Address" value={student.localAddress || "—"} />
            {student.permanentAddress && student.permanentAddress !== student.localAddress && (
              <InfoRow label="Permanent Address" value={student.permanentAddress} />
            )}
          </SectionCard>

          {/* 3. Parents / Guardian */}
          <SectionCard icon={Users} title="Parents &amp; Guardian">
            <div className="space-y-0">
              <ParentInfo
                title="Father"
                name={student.fatherName}
                contact={student.fatherContact}
                email={student.fatherEmail}
              />
              <ParentInfo
                title="Mother"
                name={student.motherName}
                contact={student.motherContact}
                email={student.motherEmail}
              />
            </div>
          </SectionCard>

          {/* 4. Enrollment */}
          <SectionCard icon={BookOpen} title="Academic Enrollment">
            <InfoRow label="Class" value={`Class ${student.class}`} />
            <InfoRow label="Section" value={student.section} />
            <InfoRow label="Roll Number" value={student.rollNo} />
            <InfoRow label="Admission Date" value={new Date(student.admissionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />
            <InfoRow label="Previous School" value={student.previousSchool || "—"} />
          </SectionCard>

          {/* 5. Attendance Summary */}
          <SectionCard icon={ClipboardList} title="Attendance Summary">
            <div className="space-y-3 py-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Current Month</span>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">89% Present</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Academic Year</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">92% Present</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Below 75%?</span>
                <Badge variant="outline" className="text-green-700">No</Badge>
              </div>
            </div>
          </SectionCard>

          {/* 6. Health & Documents */}
          <SectionCard icon={Heart} title="Health &amp; Documents">
            <InfoRow label="Blood Group" value={student.bloodGroup || "—"} />
            <InfoRow label="Medical Conditions" value="None reported" />
            <InfoRow label="Aadhaar / ID Document" value="—" />
            <InfoRow label="Birth Certificate" value="—" />
            <InfoRow label="Report Card (Last)" value="—" />
          </SectionCard>

        </div>

        {/* Delete Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Student</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong>{student.firstName} {student.lastName}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <StudentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          student={student}
          onSave={(updated) => { handleSave(updated); }}
        />

      </div>
    </AppShell>
  );
}