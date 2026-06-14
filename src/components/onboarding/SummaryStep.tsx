import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "./types";
import { sortClasses } from "@/lib/onboarding-constants";

export function SummaryStep({ data }: { data: WizardData }) {
  const { school, session } = data;
  const totalSections = session.classes.reduce((n, c) => n + c.sections.length, 0);
  const totalSubjects = session.classes.reduce(
    (n, c) => n + c.sections.reduce((sectionCount, s) => sectionCount + (s.subjects?.length ?? 0), 0),
    0,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">School</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <Row label="Name" value={`${school.name} (${school.acronym})`} />
          <Row label="Address" value={`${school.address}, ${school.city}, ${school.state}`} />
          <Row label="Contact" value={`${school.contact_phone} · ${school.contact_email}`} />
          <Row label="Board / Type" value={`${school.board} · ${school.school_type}`} />
          <Row label="Shifts" value={school.shifts.map((s) => `${s.name} (${s.start_time}–${s.end_time})`).join(", ")} />
        </CardContent>
      </Card>

      <Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Academic Session</CardTitle>
  </CardHeader>
  <CardContent className="text-sm space-y-1">
    <Row label="Year" value={session.academic_year} />
    <Row
      label="Classes"
      value={`${session.classes.length} classes · ${session.classes.reduce((n, c) => n + c.sections.length, 0)} sections`}
    />
  </CardContent>
</Card>

<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Classes & Subjects</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
  {sortClasses(session.classes).map((c, i) => (
      <div key={i} className="text-sm border-b pb-3 last:border-0 last:pb-0">
        <div className="flex items-center justify-between">
          <div className="font-medium">{c.name}</div>
          <div className="text-xs text-muted-foreground">
            {c.term_structure}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {c.start_date} → {c.end_date}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 mb-1.5">
          Sections: {c.sections.map((s) => s.name).join(", ") || "—"}
        </div>
        <div className="flex flex-wrap gap-1">
          {c.sections.flatMap((s) =>
            s.subjects.map((sub, j) => (
              <Badge key={`${s.name}-${j}`} variant="outline" className="text-xs">
                {s.name} · {sub.name}
              </Badge>
            ))
          )}
        </div>
      </div>
    ))}
  </CardContent>
</Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
      <span className="flex-1">{value}</span>
    </div>
  );
}
