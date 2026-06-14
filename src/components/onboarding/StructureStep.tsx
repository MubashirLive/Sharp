import { useState } from "react";
import { Layers, Calendar } from "lucide-react";
import { ClassesStep } from "./ClassesStep";
import { SessionsStep } from "./SessionsStep";
import type { SessionStepData } from "./types";

interface Props {
  initialData?: SessionStepData;
  data: SessionStepData;
  onChange: (d: SessionStepData) => void;
  onSave?: (d: SessionStepData) => Promise<void>;
  schoolId?: string;
  academicYearId?: string;
  isOnboarding?: boolean;
  wings?: { id: string; name: string }[];
}

const TABS = [
  { id: "classes", label: "Classes", icon: Layers },
  { id: "sessions", label: "Sessions", icon: Calendar },
] as const;

export function StructureStep({
  initialData,
  data,
  onChange,
  onSave,
  schoolId,
  academicYearId,
  isOnboarding,
  wings = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<"classes" | "sessions">("classes");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const navigateToSessions = () => setActiveTab("sessions");

  return (
    <div className="w-full">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative
              ${activeTab === tab.id
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "classes" ? (
        <ClassesStep
          initialData={initialData}
          data={data}
          onChange={onChange}
          onSave={onSave}
          schoolId={schoolId}
          isOnboarding={isOnboarding}
          wings={wings}
          onNavigateToSessions={navigateToSessions}
        />
      ) : (
        <SessionsStep
          initialData={initialData}
          data={data}
          onChange={onChange}
          onSave={onSave}
          schoolId={schoolId}
          academicYearId={academicYearId}
          selectedClassId={selectedClassId}
          onClassSelect={setSelectedClassId}
        />
      )}
    </div>
  );
}