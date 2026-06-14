import { z } from "zod";
import { studentTab3Schema } from "@/lib/schemas";

interface Tab3PersonalProfileProps {
  form: Partial<z.infer<typeof studentTab3Schema>>;
  onChange: (field: string, value: unknown) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export function Tab3PersonalProfile({ form, onChange, errors, disabled }: Tab3PersonalProfileProps) {
  const primaryGuardian = form.primary_guardian || "Father";
  const showMother = primaryGuardian === "Mother";
  const showGuardian = ["Guardian", "Grandparent", "Other"].includes(primaryGuardian);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Personal Profile</h3>

      {/* DOB */}
      <div>
        <label className="text-sm font-medium">Date of Birth *</label>
        <input
          type="date"
          value={form.dob || ""}
          onChange={(e) => onChange("dob", e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        />
        {errors.dob && <p className="text-red-500 text-sm">{errors.dob}</p>}
      </div>

      {/* Primary Guardian */}
      <div>
        <label className="text-sm font-medium">Primary Guardian *</label>
        <select
          value={form.primary_guardian || "Father"}
          onChange={(e) => onChange("primary_guardian", e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        >
          <option value="Father">Father</option>
          <option value="Mother">Mother</option>
          <option value="Guardian">Guardian</option>
          <option value="Grandparent">Grandparent</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Father Contact */}
      <div className="border rounded p-4 space-y-3">
        <h4 className="font-medium">Father's Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">
              Mobile {primaryGuardian === "Father" && "*"}
            </label>
            <input
              type="tel"
              value={form.father_mobile || ""}
              onChange={(e) => onChange("father_mobile", e.target.value)}
              placeholder="10-digit mobile"
              className="w-full border rounded px-3 py-2"
              disabled={disabled}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="father_whatsapp"
              checked={form.father_mobile_whatsapp || false}
              onChange={(e) => onChange("father_mobile_whatsapp", e.target.checked)}
              disabled={disabled}
            />
            <label htmlFor="father_whatsapp" className="text-sm">
              On WhatsApp
            </label>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.father_email || ""}
              onChange={(e) => onChange("father_email", e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Mother Contact (conditional) */}
      {showMother && (
        <div className="border rounded p-4 space-y-3">
          <h4 className="font-medium">Mother's Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Mobile *</label>
              <input
                type="tel"
                value={form.mother_mobile || ""}
                onChange={(e) => onChange("mother_mobile", e.target.value)}
                placeholder="10-digit mobile"
                className="w-full border rounded px-3 py-2"
                disabled={disabled}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="mother_whatsapp"
                checked={form.mother_mobile_whatsapp || false}
                onChange={(e) => onChange("mother_mobile_whatsapp", e.target.checked)}
                disabled={disabled}
              />
              <label htmlFor="mother_whatsapp" className="text-sm">
                On WhatsApp
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.mother_email || ""}
                onChange={(e) => onChange("mother_email", e.target.value)}
                className="w-full border rounded px-3 py-2"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      {/* Guardian Contact (conditional) */}
      {showGuardian && (
        <div className="border rounded p-4 space-y-3">
          <h4 className="font-medium">Guardian's Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Mobile *</label>
              <input
                type="tel"
                value={form.guardian_mobile || ""}
                onChange={(e) => onChange("guardian_mobile", e.target.value)}
                placeholder="10-digit mobile"
                className="w-full border rounded px-3 py-2"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Relation *</label>
              <input
                type="text"
                value={form.guardian_relation || ""}
                onChange={(e) => onChange("guardian_relation", e.target.value)}
                placeholder="e.g. Uncle, Aunt"
                className="w-full border rounded px-3 py-2"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.guardian_email || ""}
                onChange={(e) => onChange("guardian_email", e.target.value)}
                className="w-full border rounded px-3 py-2"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      {/* Student Mobile */}
      <div>
        <label className="text-sm font-medium">Student Mobile</label>
        <input
          type="tel"
          value={form.student_mobile || ""}
          onChange={(e) => onChange("student_mobile", e.target.value)}
          placeholder="10-digit mobile (optional)"
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        />
      </div>

      {/* Emergency Contact */}
      <div className="border rounded p-4 space-y-3">
        <h4 className="font-medium">Emergency Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input
              type="text"
              value={form.emergency_contact_name || ""}
              onChange={(e) => onChange("emergency_contact_name", e.target.value.toUpperCase())}
              className="w-full border rounded px-3 py-2"
              disabled={disabled}
            />
            {errors.emergency_contact_name && (
              <p className="text-red-500 text-sm">{errors.emergency_contact_name}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Number *</label>
            <input
              type="tel"
              value={form.emergency_contact_number || ""}
              onChange={(e) => onChange("emergency_contact_number", e.target.value)}
              placeholder="10-digit mobile"
              className="w-full border rounded px-3 py-2"
              disabled={disabled}
            />
            {errors.emergency_contact_number && (
              <p className="text-red-500 text-sm">{errors.emergency_contact_number}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Relation *</label>
            <input
              type="text"
              value={form.emergency_contact_relation || ""}
              onChange={(e) => onChange("emergency_contact_relation", e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={disabled}
            />
            {errors.emergency_contact_relation && (
              <p className="text-red-500 text-sm">{errors.emergency_contact_relation}</p>
            )}
          </div>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          value={form.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        />
      </div>
    </div>
  );
}