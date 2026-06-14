import type { EditorClass } from "./types";

export function getBlockingErrors(classes: EditorClass[]): string[] {
  const errors: string[] = [];
  for (const c of classes) {
    if (!c.name.trim()) {
      errors.push("Class name is required");
    }
    if (c.sections.length === 0) {
      errors.push(`Class "${c.name || "(unnamed)"}" has no sections`);
    }
    const seenSectionNames = new Set<string>();
    for (const s of c.sections) {
      if (!s.name.trim()) {
        errors.push(`Section name is required in ${c.name || "(unnamed)"}`);
      } else {
        const key = s.name.trim().toLowerCase();
        if (seenSectionNames.has(key)) {
          errors.push(`Duplicate section name "${s.name.trim()}" in ${c.name || "(unnamed)"}`);
        }
        seenSectionNames.add(key);
      }
    }
  }
  return errors;
}

export function hasBlockingErrors(classes: EditorClass[]): boolean {
  return getBlockingErrors(classes).length > 0;
}
