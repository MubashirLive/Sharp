import { useState, Fragment } from "react";
import { AssignedSubject } from "@/data/subjects";
import { SubjectCell } from "./SubjectCell";
import { SubjectEditModal } from "./SubjectEditModal";

interface Section {
  id: string;
  name: string;
  stream?: string | null;
  subjects: AssignedSubject[];
  displayOrder?: number;
}

interface ClassRow {
  id: string;
  name: string;
  sections: Section[];
}

interface SubjectGridProps {
  classes: ClassRow[];
  onChange: (classes: ClassRow[]) => void;
}

export function SubjectGrid({ classes, onChange }: SubjectGridProps) {
  const [editingCell, setEditingCell] = useState<{
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    subjects: AssignedSubject[];
    stream?: string;
  } | null>(null);

  // For Copy from A, find Section A subjects
  const getSectionASubjects = (classRow: ClassRow): AssignedSubject[] => {
    const sectionA = classRow.sections.find((s) => {
      const name = s.name.toUpperCase();
      return name === "A" || name === "SECTION A" || name.endsWith("-A");
    });
    return sectionA?.subjects || classRow.sections[0]?.subjects || [];
  };

  const handleCellClick = (classRow: ClassRow, section: Section) => {
    setEditingCell({
      classId: classRow.id,
      className: classRow.name,
      sectionId: section.id,
      sectionName: section.name,
      subjects: section.subjects,
      stream: section.stream,
    });
  };

  const handleSave = (
    sectionId: string,
    subjects: AssignedSubject[],
    stream?: string
  ) => {
    if (!editingCell) return;

    const updatedClasses = classes.map((cls) => {
      if (cls.id !== editingCell.classId) return cls;
      return {
        ...cls,
        sections: cls.sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return { ...sec, subjects, stream: stream || sec.stream };
        }),
      };
    });

    onChange(updatedClasses);
  };

  const handleClose = () => {
    setEditingCell(null);
  };

  // Get current class row and section for the modal
  const currentClassRow = editingCell
    ? classes.find((c) => c.id === editingCell.classId)
    : null;
  const sectionASubjects = currentClassRow
    ? getSectionASubjects(currentClassRow)
    : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>
          {classes.map((classRow) => {
            const sortedSections = [...classRow.sections].sort(
              (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
            );
            return (
              <Fragment key={classRow.id}>
                {/* CLASS header row */}
                <tr>
                  <td className="sticky left-0 z-10 min-w-[100px] p-2 text-center text-xs font-semibold text-muted-foreground bg-muted/50 border-r border-b">
                    CLASS
                  </td>
                  {sortedSections.map((section) => (
                    <td
                      key={section.id}
                      className="min-w-[140px] p-2 text-center text-xs font-semibold text-muted-foreground border-b border-l bg-muted/30"
                    >
                      {section.name}
                    </td>
                  ))}
                </tr>

                {/* Class name + subject cells row */}
                <tr className="hover:bg-muted/20">
                  <td className="sticky left-0 z-10 min-w-[100px] p-2 text-sm font-medium bg-white border-r border-b">
                    {classRow.name}
                  </td>
                  {sortedSections.map((section) => (
                    <td
                      key={section.id}
                      className="min-w-[140px] p-1 border-b border-l"
                    >
                      <SubjectCell
                        subjects={section.subjects}
                        onClick={() => handleCellClick(classRow, section)}
                      />
                    </td>
                  ))}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingCell && (
        <SubjectEditModal
          open={!!editingCell}
          onOpenChange={(open) => !open && handleClose()}
          className={editingCell.className}
          sectionId={editingCell.sectionId}
          sectionName={editingCell.sectionName}
          subjects={editingCell.subjects}
          sectionASubjects={sectionASubjects}
          onSave={handleSave}
        />
      )}
    </div>
  );
}