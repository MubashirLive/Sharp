# Wing Tab — Feature Specification

### Module: My School > Wing Tab
### Version: 3.0 (Board-Based Direct Manipulation)
### Status: Active

---

## 1. Overview

Wings tab lives inside My School section. Principal and Master Admin create wings and assign classes to them via a **board-based drag-and-drop interface**. No modals, no staged state — everything is direct manipulation.

---

## 2. Access & Permissions

- **Principal** and **Master Admin** only: full edit access
- **Read-only roles**: view wings and classes, no edit buttons
- `canEdit` prop gates all edit UI

---

## 3. UI Layout — Board View

```
┌──────────────────────────────────────────────────────────────────┐
│  Search...                                    [Log]  [Edit]      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─ UNASSIGNED (N classes) ────────────────────────────────┐    │
│  │  [Nursery] [LKG] [UKG] [1] [2] [3] [4]                │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─ Science Wing ──────────────────────────────────────────┐      │
│  │  [6A] x  [6B] x  [6C] x  [7A] x           [🗑️ delete] │    │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                   │
│  ┌─ Commerce Wing ───────────────────────────────────────┐       │
│  │  [8A] x  [8B] x                              [🗑️ delete] │  │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                   │
│              [+ Add New Wing]   (edit mode only)                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**View mode (default):**
- Wings displayed as cards with class badges
- Wing cards show: name + class badges (acronym only, no "Class" prefix)
- Delete icon hidden
- [Log] + [Edit] buttons in top bar

**Edit mode:**
- [Edit] → [Save] + [Cancel]
- Each class badge shows × button (click → class returns to Unassigned instantly)
- Each wing card shows delete icon (empty wings only, type-to-confirm)
- [+ Add New Wing] button appears at bottom
- Wing names become inline editable inputs
- Drag-and-drop enabled
- Classes from other wings shown with yellow border when dragged in

---

## 4. Edit Mode Behavior

### Entering Edit Mode
- Click [Edit] → clones current wings state into local state
- Top bar shows [Save] + [Cancel] instead of [Edit]

### Saving Changes
- One DB transaction: update class.wing_id for all changed assignments
- Update wing names where changed
- Create new wings, delete removed wings
- Single log entry for entire batch of changes
- Exit edit mode, refresh data

### Cancelling
- Discard all local changes
- Exit edit mode

---

## 5. Class Movement

### Click × on Badge
- Class instantly moves to Unassigned
- No confirmation needed
- Undo: drag it back from Unassigned to a wing

### Drag and Drop
- `@dnd-kit/core` + `@dnd-kit/sortable`
- DragOverlay shows ghost badge following cursor
- Drop targets: each wing card + Unassigned box
- Dropping on wing: assigns class to that wing
- Dropping on Unassigned: unassigns class
- Cross-wing move: class removed from source wing, added to target in one step
- Yellow border + warning icon on badge when dragging class from another wing

### Unassigned Classes Box
- Shows all classes where `wing_id = null`
- Read-only in view mode
- Drop target in edit mode

---

## 6. Wing Management

### Create Wing
- [+ Add New Wing] only visible in edit mode
- Creates empty wing card with inline name input
- Wing auto-named from classes on save if name left blank

### Rename Wing
- In edit mode, wing name becomes inline `<Input>`
- Placeholder shows auto-derived name
- On save: custom name used if set, else auto-derived

### Delete Wing
- Only enabled when wing has zero classes
- Click → type-to-confirm dialog
- Must type exact wing name to enable delete button
- On confirm: wing deleted from DB

---

## 7. Data Rules

| Rule | Value |
|------|-------|
| Min classes to save wing | 1 |
| Class uniqueness | One wing at a time |
| Auto-name format | `Class1 – Class2 – Class3 Wing` |
| Wing ordering | By lowest class number in wing |
| Class ordering | By `display_order` field |
| `classes.wing_id` writer | Wings tab only — Classes tab never writes `wing` or `wing_id` |

---

## 8. Logging

One entry per Save action. Format:
- Create: `"N classes added: 6A, 6B, 6C"`
- Edit mixed: `"3 added: 6A, 6B, 6C | 2 removed: 5A, 5B"`
- Rename: `"Renamed: Science -> Science Wing"`
- Delete: `"Wing deleted"`

---

## 9. Validation

| Rule | Value |
|------|-------|
| Wing name max length | 50 chars |
| Wing name min length | 2 chars |
| Empty wing on save | Blocked — wing must have at least one class |
| Delete with classes | Blocked — must empty wing first |

---

## 10. Files

| File | Purpose |
|------|---------|
| `WingsTab.tsx` | Board container, DnD context, edit mode state, save/cancel logic |
| `BoardWingCard.tsx` | Wing card, drop target, inline name edit, delete button |
| `UnassignedClassesBox.tsx` | Unassigned classes, drop target |
| `WingLogPanel.tsx` | Activity log sheet |
