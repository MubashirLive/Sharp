export interface EditorClass {
  /** Stable internal id. UUID for unsaved, or _id/name for saved. */
  id: string;
  /** DB id. Undefined for unsaved. */
  _id?: string;
  name: string;
  sections: EditorSection[];
  /** Read from data.classes baseline; not editable in the Classes tab. */
  wing_id?: string | null;
}

export interface EditorSection {
  id: string;
  _id?: string;
  name: string;
}

export interface DepCount {
  students: number;
  subjects: number;
  teachers: number;
}

export interface DeleteDialogState {
  open: boolean;
  itemName: string;
  itemType: "class" | "section";
  cls: EditorClass;
  /** Section id if itemType is "section". */
  si?: string;
  deps: DepCount | null;
  loading: boolean;
}
