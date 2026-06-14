import { useState, useRef } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { SchoolStepData } from "./types";

const DEFAULT_HOUSES = [
  { name: "RED HOUSE", color: "#ef4444" },
  { name: "BLUE HOUSE", color: "#3b82f6" },
  { name: "GREEN HOUSE", color: "#22c55e" },
  { name: "YELLOW HOUSE", color: "#eab308" },
];

const DEFAULT_DEPARTMENTS = [
  "Administration", "Academics", "Transport",
  "Fees", "Sports", "Library", "Lab", "Marketing",
];

interface Props {
  data: SchoolStepData;
  onChange: (d: SchoolStepData) => void;
  errors?: Partial<Record<keyof SchoolStepData, string>>;
  lockedFields?: Partial<Record<keyof SchoolStepData, boolean>>;
}

export function SchoolStep({
  data,
  onChange,
}: Props) {
  const set = <K extends keyof SchoolStepData>(k: K, v: SchoolStepData[K]) =>
    onChange({ ...data, [k]: v });

  // Houses
  const initHouses = () => {
    if (data.houses.length === 0) {
      return DEFAULT_HOUSES.map((h) => ({ name: h.name, color: h.color, emblem_url: "" }));
    }
    return data.houses;
  };

  const [houses, setHouses] = useState(initHouses);
  const emblemFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [emblemPreviews, setEmblemPreviews] = useState<(string | null)[]>(
    initHouses().map((h) => h.emblem_url || null),
  );

  const setHousesAndData = (newHouses: typeof houses) => {
    setHouses(newHouses);
    onChange({ ...data, houses: newHouses });
  };

  const handleHouseEmblemChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    const updated = houses.map((h, idx) => idx === i ? { ...h, emblem_url: url } : h);
    const newPreviews = [...emblemPreviews];
    newPreviews[i] = url;
    setEmblemPreviews(newPreviews);
    setHousesAndData(updated);
  };

  const removeHouseEmblem = (i: number) => {
    const updated = houses.map((h, idx) => idx === i ? { ...h, emblem_url: "" } : h);
    const newPreviews = [...emblemPreviews];
    newPreviews[i] = null;
    setEmblemPreviews(newPreviews);
    setHousesAndData(updated);
  };

  const updateHouseName = (i: number, name: string) =>
    setHousesAndData(houses.map((h, idx) => idx === i ? { ...h, name } : h));

  // Shifts
  const addShift = () =>
    set("shifts", [
      ...data.shifts,
      { name: `Shift ${data.shifts.length + 1}`, start_time: "08:00", end_time: "14:00" },
    ]);
  const removeShift = (i: number) =>
    set("shifts", data.shifts.filter((_, idx) => idx !== i));
  const updateShift = (
    i: number, key: keyof typeof data.shifts[number], val: string,
  ) =>
    set("shifts", data.shifts.map((s, idx) =>
      idx === i ? { ...s, [key]: val } : s,
    ));

  // Departments
  const toggleDept = (dept: string) => {
    const exists = data.departments.includes(dept);
    set(
      "departments",
      exists
        ? data.departments.filter((d) => d !== dept)
        : [...data.departments, dept],
    );
  };
  const addCustomDept = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || data.departments.includes(trimmed)) return;
    set("departments", [...data.departments, trimmed]);
  };

  return (
    <div className="space-y-6">

      {/* ── Shifts ── */}
      <Section title="School Shifts">
        <div className="space-y-2">
          {data.shifts.map((s, i) => (
            <div key={i}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-2 border rounded-md">
              <Input value={s.name}
                onChange={(e) => updateShift(i, "name", e.target.value)}
                placeholder="Shift name" />
              <Input type="time" value={s.start_time}
                onChange={(e) => updateShift(i, "start_time", e.target.value)}
                className="w-28" />
              <Input type="time" value={s.end_time}
                onChange={(e) => updateShift(i, "end_time", e.target.value)}
                className="w-28" />
              <Button type="button" size="icon" variant="ghost"
                disabled={data.shifts.length <= 1}
                onClick={() => removeShift(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addShift}>
            <Plus className="h-4 w-4 mr-1" /> Add Shift
          </Button>
        </div>
      </Section>

      {/* ── Houses ── */}
      <Section title="School Houses *">
        <p className="text-xs text-muted-foreground -mt-1">
          4 default houses are provided. You can rename them. Upload an emblem for each — a colour box is shown by default.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {houses.map((h, i) => (
            <div key={i}
              className="flex items-center gap-3 p-3 border rounded-lg">
              {/* Emblem / colour box */}
              <div className="relative shrink-0">
                <div
                  className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/30 grid place-items-center overflow-hidden bg-muted/30 cursor-pointer"
                  onClick={() => emblemFileRefs.current[i]?.click()}
                  title="Click to upload emblem"
                >
                  {emblemPreviews[i]
                    ? <img src={emblemPreviews[i]!} alt={h.name} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                    : <div className="h-full w-full" style={{ backgroundColor: h.color }} />
                  }
                </div>
                {emblemPreviews[i] && (
                  <button
                    type="button"
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] grid place-items-center hover:opacity-80"
                    onClick={(e) => { e.stopPropagation(); removeHouseEmblem(i); }}
                  >
                    ×
                  </button>
                )}
                <input
                  ref={(el: HTMLInputElement | null) => { emblemFileRefs.current[i] = el; }}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => handleHouseEmblemChange(i, e)}
                />
                <div className="absolute -bottom-4 left-0 right-0 flex justify-center">
                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground bg-background px-1 rounded">
                    <Upload className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>

              {/* Name */}
              <Input
                value={h.name}
                className="flex-1"
                placeholder="House name"
                onChange={(e) => updateHouseName(i, e.target.value.toUpperCase())}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Departments ── */}
      <Section title="Departments">
        <p className="text-xs text-muted-foreground -mt-1">
          Select active departments. You can add custom ones below.
        </p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_DEPARTMENTS.map((dept) => {
            const active = data.departments.includes(dept);
            return (
              <button key={dept} type="button"
                onClick={() => toggleDept(dept)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}>
                {dept}
              </button>
            );
          })}
        </div>
        <AddCustomRow
          placeholder="Add custom department"
          onAdd={addCustomDept} />
        {data.departments.filter((d) => !DEFAULT_DEPARTMENTS.includes(d)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.departments
              .filter((d) => !DEFAULT_DEPARTMENTS.includes(d))
              .map((d) => (
                <span key={d}
                  className="px-3 py-1 rounded-full text-sm border bg-primary text-primary-foreground flex items-center gap-1">
                  {d}
                  <button type="button" onClick={() => toggleDept(d)}
                    className="hover:opacity-70">
                    ×
                  </button>
                </span>
              ))}
          </div>
        )}
      </Section>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function AddCustomRow({
  placeholder, onAdd,
}: {
  placeholder: string; onAdd: (v: string) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2 mt-2">
      <Input value={val} placeholder={placeholder}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(val);
            setVal("");
          }
        }} />
      <Button type="button" size="sm" variant="outline"
        onClick={() => { onAdd(val); setVal(""); }}>
        <Plus className="h-4 w-4" /> Add
      </Button>
    </div>
  );
}