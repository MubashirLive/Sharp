import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { studentTab1Schema } from "@/lib/schemas";

interface Tab1IdentityProps {
  form: Partial<z.infer<typeof studentTab1Schema>>;
  onChange: (field: string, value: unknown) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export function Tab1Identity({ form, onChange, errors, disabled }: Tab1IdentityProps) {
  const { schoolId } = useAuth();

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("classes")
        .select("id, name, acronym, display_order")
        .eq("school_id", schoolId)
        .order("display_order", { ascending: true });
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  // Fetch sections when class selected
  const { data: sections = [] } = useQuery({
    queryKey: ["sections", form.class_id],
    queryFn: async () => {
      if (!form.class_id) return [];
      const { data } = await supabase
        .from("sections")
        .select("id, name, acronym, stream")
        .eq("class_id", form.class_id)
        .order("display_order", { ascending: true });
      return data ?? [];
    },
    enabled: !!form.class_id,
  });

  // Fetch houses
  const { data: houses = [] } = useQuery({
    queryKey: ["houses", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data: school } = await supabase
        .from("schools")
        .select("houses")
        .eq("id", schoolId)
        .single();
      return (school?.houses as Array<{ id: string; name: string }>) ?? [];
    },
    enabled: !!schoolId,
  });

  // Fetch subjects for Class 11/12
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", schoolId, form.class_id],
    queryFn: async () => {
      if (!schoolId || !form.class_id) return [];
      const classInfo = classes.find((c) => c.id === form.class_id);
      if (!classInfo?.name.includes("11") && !classInfo?.name.includes("12")) {
        return [];
      }
      const { data } = await supabase
        .from("school_subjects")
        .select("id, name, code")
        .eq("school_id", schoolId)
        .eq("class_id", form.class_id)
        .eq("status", "active")
        .order("display_order", { ascending: true });
      return data ?? [];
    },
    enabled: !!schoolId && !!form.class_id && classes.length > 0,
  });

  const selectedClass = classes.find((c) => c.id === form.class_id);
  const showSubjects = selectedClass?.name.includes("11") || selectedClass?.name.includes("12");

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Identity</h3>
      <p className="text-sm text-muted-foreground">
        Student ID will be generated on save. This tab must be completed to unlock other tabs.
      </p>

      {/* Student Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">First Name *</label>
          <input
            type="text"
            value={form.first_name || ""}
            onChange={(e) => onChange("first_name", e.target.value.toUpperCase())}
            className="w-full border rounded px-3 py-2"
            disabled={disabled}
          />
          {errors.first_name && <p className="text-red-500 text-sm">{errors.first_name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Middle Name</label>
          <input
            type="text"
            value={form.middle_name || ""}
            onChange={(e) => onChange("middle_name", e.target.value.toUpperCase())}
            className="w-full border rounded px-3 py-2"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Last Name *</label>
          <input
            type="text"
            value={form.last_name || ""}
            onChange={(e) => onChange("last_name", e.target.value.toUpperCase())}
            className="w-full border rounded px-3 py-2"
            disabled={disabled}
          />
          {errors.last_name && <p className="text-red-500 text-sm">{errors.last_name}</p>}
        </div>
      </div>

      {/* Father Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Father First Name *</label>
          <input
            type="text"
            value={form.father_first_name || ""}
            onChange={(e) => onChange("father_first_name", e.target.value.toUpperCase())}
            className="w-full border rounded px-3 py-2"
            disabled={disabled}
          />
          {errors.father_first_name && <p className="text-red-500 text-sm">{errors.father_first_name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Father Middle Name</label>
          <input
            type="text"
            value={form.father_middle_name || ""}
            onChange={(e) => onChange("father_middle_name", e.target.value.toUpperCase())}
            className="w-full border rounded px-3 py-2"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Father Last Name *</label>
          <input
            type="text"
            value={form.father_last_name || ""}
            onChange={(e) => onChange("father_last_name", e.target.value.toUpperCase())}
            className="w-full border rounded px-3 py-2"
            disabled={disabled}
          />
          {errors.father_last_name && <p className="text-red-500 text-sm">{errors.father_last_name}</p>}
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="text-sm font-medium">Gender *</label>
        <select
          value={form.gender || ""}
          onChange={(e) => onChange("gender", e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
      </div>

      {/* Login Mobile */}
      <div>
        <label className="text-sm font-medium">Login Mobile *</label>
        <input
          type="tel"
          value={form.login_mobile || ""}
          onChange={(e) => onChange("login_mobile", e.target.value)}
          placeholder="10-digit mobile"
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        />
        {errors.login_mobile && <p className="text-red-500 text-sm">{errors.login_mobile}</p>}
      </div>

      {/* Class & Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Class *</label>
          <select
            value={form.class_id || ""}
            onChange={(e) => {
              onChange("class_id", e.target.value);
              onChange("section_id", ""); // Reset section
              onChange("subjects", []); // Reset subjects
            }}
            className="w-full border rounded px-3 py-2"
            disabled={disabled}
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.class_id && <p className="text-red-500 text-sm">{errors.class_id}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Section *</label>
          <select
            value={form.section_id || ""}
            onChange={(e) => onChange("section_id", e.target.value)}
            className="w-full border rounded px-3 py-2"
            disabled={disabled || !form.class_id}
          >
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
                {sec.stream ? ` (${sec.stream})` : ""}
              </option>
            ))}
          </select>
          {errors.section_id && <p className="text-red-500 text-sm">{errors.section_id}</p>}
        </div>
      </div>

      {/* Subjects (Class 11/12 only) */}
      {showSubjects && subjects.length > 0 && (
        <div>
          <label className="text-sm font-medium">Subjects</label>
          <p className="text-xs text-muted-foreground mb-2">
            Select subjects for this student (Class 11/12 custom combination)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {subjects.map((subj) => (
              <label key={subj.id} className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  checked={form.subjects?.includes(subj.id) || false}
                  onChange={(e) => {
                    const current = form.subjects || [];
                    if (e.target.checked) {
                      onChange("subjects", [...current, subj.id]);
                    } else {
                      onChange("subjects", current.filter((id) => id !== subj.id));
                    }
                  }}
                  disabled={disabled}
                />
                <span className="text-sm">{subj.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* House */}
      <div>
        <label className="text-sm font-medium">House</label>
        <select
          value={form.house_id || ""}
          onChange={(e) => onChange("house_id", e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        >
          <option value="">Select House</option>
          {houses.map((house) => (
            <option key={house.id} value={house.id}>
              {house.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}