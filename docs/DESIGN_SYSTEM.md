# SHARP Design System
## Premium School Management UI — Complete Specification

---

## 1. Philosophy & Style Direction

### Design Personality
**"Precision meets warmth"** — Apple-level clarity with school-friendly approachability. Every surface has intention. No decoration without purpose.

### Reference Brands & Why
| Brand | What We Borrow |
|-------|---------------|
| **Apple** | Spacing rhythm, typography hierarchy, micro-interactions, surface treatment |
| **Google** | Color accessibility contrast ratios, motion curves, component states |
| **BMW** | Premium card depth (shadows), data presentation, restrained palette |
| **Linear** | Dark mode elegance, sidebar density, icon typography alignment |
| **Notion** | Claymorphism warmth, soft borders, workspace feel |
| **Vercel** | Animation timing, gradient usage, loading states |

### Visual Style: Enhanced Claymorphism
- Soft extruded surfaces (neumorphism cousin, less 90s)
- Subtle depth through layered shadows — not flat, not skeuomorphic
- Cards lift on hover with coordinated shadow + translate
- Inputs feel recessed with inset shadow on focus
- Stat cards have gradient top-bar accent (BMW dashboard style)

---

## 2. Color System

### Color Architecture
```
HSL(hue saturation lightness)
hue:        0-360 (color wheel position)
saturation: 0-100% (intensity)
lightness:  0-100% (dark ↔ light)
Alpha on lightness only for dark mode
```

### Light Mode Palette

#### Brand Colors
| Role | HSL | Hex | Usage |
|------|-----|-----|-------|
| Primary | `262 83% 58%` | `#7C3AED` | CTAs, active states, primary actions |
| Primary Hover | `262 83% 48%` | `#6D28D9` | Hover on primary |
| Primary Light | `262 83% 58% / 0.12` | `#7C3AED1F` | Subtle tints, badges |
| Accent | `25 95% 53%` | `#F97316` | Notifications, highlights, urgent CTAs |
| Accent Hover | `25 95% 43%` | `#EA580C` | Hover on accent |

#### Semantic Colors
| Role | HSL | Hex | Usage |
|------|-----|-----|-------|
| Success | `152 60% 38%` | `#22C55E` | Active, present, good status |
| Success Light | `152 60% 38% / 0.12` | `#22C55E1F` | Success badges, confirmations |
| Warning | `38 92% 50%` | `#F59E0B` | Pending, attention needed |
| Warning Light | `38 92% 50% / 0.12` | `#F59E0B1F` | Warning badges |
| Destructive | `0 72% 50%` | `#DC2626` | Delete, error, critical |
| Destructive Light | `0 72% 50% / 0.12` | `#DC26261F` | Error badges |

#### Neutral Scale (Full — use by weight)
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| Background | `270 100% 98%` | `#FDFBFF` | Page background |
| Surface | `0 0% 100%` | `#FFFFFF` | Cards, dialogs |
| Border | `270 20% 88%` | `#E4DFF5` | Card borders, dividers |
| Muted | `270 50% 95%` | `#F3F0FC` | Table headers, secondary areas |
| Muted Foreground | `270 15% 45%` | `#8B7FA8` | Secondary text, captions |
| Foreground | `270 50% 10%` | `#1A1035` | Primary text |
| Foreground Secondary | `270 50% 20%` | `#331A62` | Subheadings |

#### Sidebar Specific
| Role | HSL | Hex |
|------|-----|-----|
| Sidebar BG | `270 50% 97%` | `#F5F1FC` |
| Sidebar FG | `270 50% 10%` | `#1A1035` |
| Sidebar Accent | `270 50% 93%` | `#EDE7F6` |
| Sidebar Active | `262 83% 58%` | `#7C3AED` |

#### Role Colors (School Context)
| Role | HSL | Purpose |
|------|-----|---------|
| Super Admin | `262 83% 58%` | Full-access badge |
| Principal | `152 60% 38%` | School-level badge |
| Staff | `25 95% 53%` | Teacher-level badge |
| Student | `199 89% 48%` | Learner-level badge |

### Dark Mode Palette

| Role | HSL | Hex |
|------|-----|-----|
| Background | `262 30% 6%` | `#0D0B14` |
| Surface / Card | `262 30% 8%` | `#13111C` |
| Primary | `270 70% 68%` | `#A78BFA` |
| Primary Hover | `270 70% 58%` | `#8B6FE0` |
| Foreground | `270 20% 94%` | `#EFEFFC` |
| Border | `262 20% 16%` | `#252333` |
| Muted | `262 25% 14%` | `#1E1C28` |
| Accent | `25 90% 58%` | `#FB923C` |
| Success | `152 55% 50%` | `#4ADE80` |
| Destructive | `0 68% 55%` | `#F87171` |

---

## 3. Typography

### Font Stack
```css
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Why Plus Jakarta Sans?**
- Variable font (300–700 weight range)
- Designed for digital interfaces (not just adapted from print)
- Geometric yet warm — not cold like Inter, not quirky like Poppins
- Open-source (Google Fonts) — no licensing friction
- Excellent Devanagari support — Hindi rendering for Indian schools

### Type Scale — Premium Ratio (1.250 — Major Third)

```
Display:   3rem   / 48px  — 700 weight — -0.03em tracking — page titles
H1:        2.25rem / 36px — 700 weight — -0.02em tracking — section headers
H2:        1.875rem/ 30px — 600 weight — -0.02em tracking — card headings
H3:        1.5rem  / 24px — 600 weight — -0.015em tracking — subsection
H4:        1.25rem / 20px — 600 weight — -0.01em tracking — labels
Body LG:   1rem    / 16px — 400 weight —  0 letter-spacing — paragraphs
Body:      0.875rem/ 14px — 400 weight —  0 letter-spacing — secondary text
Caption:   0.75rem / 12px — 500 weight —  0.05em tracking — metadata, badges
Overline:  0.6875rem/11px — 600 weight —  0.08em tracking — category labels
```

### Type Rules
- **Line height**: 1.5 for body text, 1.2 for headings
- **Line length**: 65–75 characters max (≈ 35–40em)
- **Font features**: `font-feature-settings: "cv11", "ss01"` — improves ligatures and stylistic alternates
- **Weight usage**: Never use 300 for primary text. Min 400. Reserve 700 for display only.
- **Never** use font-weight numbers directly — use `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### Hindi / Multilingual Support
- Plus Jakarta Sans covers Devanagari adequately
- For premium Hindi rendering, add: `'Noto Sans Devanagari', 'Plus Jakarta Sans'`
- Test all user-facing Hindi text at 14px minimum

---

## 4. Spacing System

### Base Unit: 4px
All spacing is multiples of 4. No arbitrary values.

| Token | PX | EM | Usage |
|-------|----|----|-------|
| `space-1` | 4px | 0.25rem | Tight gaps |
| `space-2` | 8px | 0.5rem | Icon-to-text |
| `space-3` | 12px | 0.75rem | Input internal padding |
| `space-4` | 16px | 1rem | Standard padding |
| `space-5` | 20px | 1.25rem | Card internal padding |
| `space-6` | 24px | 1.5rem | Page gutters |
| `space-8` | 32px | 2rem | Section spacing |
| `space-10` | 40px | 2.5rem | Major sections |
| `space-12` | 48px | 3rem | Page-level gaps |

### Component Spacing
```
Button height (min):     44px  / 2.75rem  — touch target minimum
Input height (min):      44px  / 2.75rem  — touch target minimum
Card padding:            24px  / 1.5rem   — standard
Card gap:                16px  / 1rem      — between cards in grid
Dialog padding:          24px  / 1.5rem   — same as card
Table cell padding:       14px  / 0.875rem — horizontal, 12px vertical
Table header padding:    12px  / 0.75rem  — uppercase, compact
Stat card padding:       20px  / 1.25rem — top + sides
Sidebar item padding:    10px  / 0.625rem vertical, 14px / 0.875rem horizontal
```

---

## 5. Shadow System

### Shadow Philosophy
Shadows create **depth hierarchy**, not decoration. Three layers:
- `shadow-sm`: Subtle lift — hover states, secondary cards
- `shadow-md`: Standard lift — most cards, dialogs
- `shadow-lg`: Heavy lift — modals, floating elements, active states
- `shadow-inset`: Recessed feel — inputs on focus

### Shadow Recipes (Light Mode)
```css
/* Card default */
--shadow-sm:   0 2px 8px hsl(262 83% 58% / 0.07),
               0 1px 3px hsl(262 83% 58% / 0.05);

/* Card hover / dialog */
--shadow-md:   0 4px 20px hsl(262 83% 58% / 0.10),
               0 2px 6px hsl(262 83% 58% / 0.06);

/* Modal / heavy lift */
--shadow-lg:   0 8px 40px hsl(262 83% 58% / 0.14),
               0 4px 12px hsl(262 83% 58% / 0.08);

/* Input focus / recessed */
--shadow-inset: inset 0 2px 4px hsl(262 83% 58% / 0.08),
               inset 0 1px 2px hsl(262 83% 58% / 0.05);

/* Primary button glow */
--shadow-btn-primary: 0 4px 14px hsl(262 83% 58% / 0.35);
--shadow-btn-primary-hover: 0 6px 20px hsl(262 83% 58% / 0.45);
```

### Shadow Recipes (Dark Mode)
```css
--shadow-sm:   0 2px 8px hsl(262 30% 4% / 0.4),
               0 1px 3px hsl(262 30% 4% / 0.3);
--shadow-md:   0 4px 20px hsl(262 30% 4% / 0.5),
               0 2px 6px hsl(262 30% 4% / 0.35);
--shadow-lg:   0 8px 40px hsl(262 30% 4% / 0.6),
               0 4px 12px hsl(262 30% 4% / 0.4);
```

### Premium Shadow Principle
**Color-tinted shadows** — shadow color matches primary hue, not pure black. Creates cohesive brand feel. Black shadows look generic.

---

## 6. Border Radius

### Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `calc(var(--radius) - 4px)` | Small chips, badges |
| `rounded-md` | `calc(var(--radius) - 2px)` | Inputs, medium elements |
| `rounded-lg` | `var(--radius)` | Cards, buttons (14px) |
| `rounded-xl` | `calc(var(--radius) + 4px)` | Large cards, dialogs |
| `rounded-2xl` | `calc(var(--radius) + 8px)` | Modal containers |
| `rounded-full` | `9999px` | Avatars, pills |

**Base radius**: `0.875rem` (14px) — set via `--radius` CSS variable for shadcn compatibility.

### Border Rules
- **Card borders**: `1.5px solid hsl(var(--border))` — visible, soft violet-tinted
- **Input borders**: Same weight, transitions on focus
- **No border-radius on table rows** — use cell padding instead
- **Avatar borders**: `0 0 0 3px hsl(var(--primary) / 0.15)` — ring effect, no border-radius overlap

---

## 7. Animation System

### Animation Philosophy
Motion communicates state, not decoration. Three categories:
- **Micro** (50–150ms): Button press, input focus, toggle — instant feedback
- **UI** (200–300ms): Card hover, modal open, sidebar expand — spatial awareness
- **Macro** (400–600ms): Page transitions, loading sequences — orientation

### Timing Functions
```css
/* Micro-interactions — snappy, responsive */
transition-timing-function: cubic-bezier(0.2, 0, 0, 1); /* fast-in-fast-out */

/* UI transitions — smooth, natural */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* ease-in-out */

/* Spring-like — for playful elements (badges, toggles) */
transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); /* slight overshoot */
```

### Duration Scale
| Token | Duration | Usage |
|-------|----------|-------|
| `duration-instant` | 50ms | Cursor, immediate feedback |
| `duration-fast` | 100ms | Button press, toggle |
| `duration-normal` | 200ms | Hover states, color transitions |
| `duration-slow` | 300ms | Card lift, modal open |
| `duration-slower` | 400ms | Page elements appearing |

### Specific Animations
```css
/* Card hover lift */
.card-hover {
  transition: box-shadow 200ms ease-out, transform 200ms ease-out;
}
.card-hover:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Button press */
.btn-press:active {
  transform: scale(0.98);
}

/* Active nav item */
.nav-item-active {
  box-shadow: 0 4px 12px hsl(var(--sidebar-primary) / 0.30);
}

/* Badge pulse (for notifications) */
@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.badge-pulse { animation: badge-pulse 2s ease-in-out infinite; }

/* Skeleton shimmer */
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--secondary)) 50%,
    hsl(var(--muted)) 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
**Always wrap animations** — never assume user wants motion.

---

## 8. Gradient System

### Background Gradients
```css
/* Page background — subtle lavender */
--gradient-soft: linear-gradient(135deg,
  hsl(270 100% 98%) 0%,
  hsl(262 100% 96%) 100%);

/* Primary brand gradient */
--gradient-primary: linear-gradient(135deg,
  hsl(262 83% 58%) 0%,
  hsl(270 67% 76%) 100%);

/* Sidebar gradient */
--gradient-sidebar: linear-gradient(180deg,
  hsl(270 50% 97%) 0%,
  hsl(270 50% 94%) 100%);

/* Accent gradient — for premium CTAs */
--gradient-accent: linear-gradient(135deg,
  hsl(25 95% 53%) 0%,
  hsl(25 90% 65%) 100%);
```

### Premium Gradient Usage Rules
- Background gradients: max 2 stops, same hue family
- Never use rainbow gradients on large surfaces
- Accent gradient: orange only for premium CTAs, not default buttons
- Stat card top bar: use `--gradient-primary` only (3px height)
- Button hover: shift primary hue darker 10% + scale 1px up — no gradient shift

---

## 9. Component Specifications

### Button Hierarchy
| Variant | Shadow | Border | Usage |
|---------|--------|--------|-------|
| Primary | `--shadow-btn-primary` | none | Main action per section |
| Secondary | `var(--shadow-sm)` | `1.5px solid var(--border)` | Alternative action |
| Accent | `--shadow-accent` | none | Urgent / important CTA |
| Ghost | none | none | Tertiary actions |
| Destructive | `--shadow-destructive` | none | Delete actions |

**Button rules:**
- Min height: 44px (touch target)
- Font weight: 600
- Letter spacing: 0.01em
- Disabled: opacity 0.55, no hover transform
- Loading: show spinner, disable pointer events
- Focus: `box-shadow: 0 0 0 3px hsl(var(--ring) / 0.25)`

### Card Specifications
| Card Type | Padding | Shadow | Border | Radius |
|-----------|---------|--------|--------|--------|
| Standard card | 24px | `shadow-md` | 1.5px | `14px` |
| Stat card | 20px | `shadow-md` | 1.5px + top gradient bar | `14px` |
| Interactive card | 24px | `shadow-md` → `shadow-lg` on hover | 1.5px | `14px` |
| Dialog | 24px | `shadow-lg` | 1.5px | `14px` |

### Form Input Specifications
```css
.input-spec {
  border-radius: calc(var(--radius) - 2px); /* 12px */
  border: 1.5px solid hsl(var(--border));
  background: hsl(270 100% 99%);
  min-height: 44px;
  font-size: 1rem;           /* prevent iOS zoom */
  transition: border-color 200ms, box-shadow 200ms;
}
.input-spec:focus {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.20);
}
.input-spec::placeholder {
  color: hsl(var(--muted-foreground));
}
```

### Table Specifications
```css
.table-container {
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1.5px solid hsl(var(--border));
  overflow: hidden; /* corners clip to radius */
}
.table-header {
  background: hsl(var(--muted));
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: hsl(var(--muted-foreground));
}
.table-row {
  min-height: 52px;  /* comfortable tap target */
  transition: background 150ms, box-shadow 150ms;
  cursor: pointer;
}
.table-row:hover {
  background: hsl(var(--secondary));
}
```

### Badge Specifications
```css
.badge {
  border-radius: 9999px;     /* pill shape */
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  /* Each role gets its own color (see Role Colors above) */
}
```

### Avatar Specifications
```css
.avatar {
  border-radius: 9999px;
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15), var(--shadow-sm);
  object-fit: cover;
  /* Sizes */
  --avatar-sm: 32px;
  --avatar-md: 40px;
  --avatar-lg: 48px;
  --avatar-xl: 64px;
}
```

---

## 10. Dark Mode Implementation

### Dark Mode Strategy
- Toggle via `.dark` class on `<html>` — same as shadcn default
- CSS variables swap on `.dark` selector
- No separate dark-mode CSS file needed — all in `index.css`
- System preference: use `class` strategy with manual toggle (not `media`)

### Dark Mode Rules
- Surface color: never pure black — `#0D0B14` (slight violet tint)
- Primary: lighter violet `#A78BFA` — sufficient contrast on dark bg
- Text: off-white `#EFEFFC` — easier on eyes than pure white
- Shadows: purple-tinted, lower opacity (see shadow section)
- Borders: visible but subtle — `hsl(262 20% 16%)`
- Cards: slightly elevated from background — `8%` vs `6%` lightness

### Theme Transition
```css
html {
  transition: background-color 0.15s ease, color 0.15s ease;
}
```
**No layout reflow** — theme swap doesn't shift layout. Applied to `html` not `body`.

---

## 11. Accessibility Requirements

### Color Contrast (WCAG AA Minimum)
| Combination | Ratio | Target |
|-------------|-------|--------|
| Primary text on white | 4.5:1 | Body text |
| Primary on primary-foreground | 4.5:1 | Buttons |
| Muted text on muted bg | 4.5:1 | Table headers |
| White on primary | 4.5:1 | Primary buttons |

### Touch Targets
- All interactive elements: minimum 44×44px
- Mobile: 48px preferred
- Icon buttons: 44×44px minimum

### Focus States
```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.25);
}
```
Never use `outline: none` without replacement focus indicator.

### Motion
- All animations wrapped in `prefers-reduced-motion` check
- No flashing or rapid color cycling
- Loading states use opacity, not spinner rotation speed

### Screen Reader
- All icons have `aria-label` or adjacent visible text
- Dialogs trap focus (`@radix-ui/react-dialog`)
- Form errors announced via `aria-live`

---

## 12. Responsive Breakpoints

### SHARP Breakpoints (Mobile-First)
| Breakpoint | Width | Columns | Gutter | Usage |
|------------|-------|---------|--------|-------|
| Mobile | 360px+ | 4 | 16px | Core experience |
| Phablet | 480px+ | 4 | 20px | Larger phones |
| Tablet | 768px+ | 8 | 24px | iPad portrait |
| Desktop | 1024px+ | 12 | 32px | Laptop |
| Wide | 1280px+ | 12 | 40px | Desktop |
| Ultrawide | 1536px+ | 12 | 48px | Large monitors |

### Layout Patterns
```css
/* Mobile-first: single column */
.page-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

/* Tablet: 2-column */
@media (min-width: 768px) {
  .page-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: 3-column stat cards */
@media (min-width: 1024px) {
  .stat-grid { grid-template-columns: repeat(3, 1fr); }
}
```

---

## 13. Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| Base | 0 | Default content |
| Raised | 10 | Cards at rest |
| Dropdown | 20 | `<select>`, `<Combobox>` |
| Sticky | 30 | Fixed headers |
| Overlay | 40 | Modal backdrop |
| Modal | 50 | Dialogs |
| Popover | 60 | Tooltips, popovers |
| Toast | 70 | Notifications |
|highest | 80 | System overlays |

---

## 14. Icon System

### Icon Rules
- **Library**: Lucide React (already in use)
- **Size standard**: 24×24 viewBox, `w-5 h-5` (20px) or `w-6 h-6` (24px) in UI
- **No emojis as icons** — ever
- **Consistent stroke weight**: `stroke-width="2"` default
- **Color inheritance**: `currentColor` — icons match parent text color

### Icon Sizing by Context
| Context | Size | Class |
|---------|------|-------|
| Inline with text | 16px | `w-4 h-4` |
| Button icon | 18px | `w-[18px] h-[18px]` |
| Sidebar nav | 20px | `w-5 h-5` |
| Card header | 20px | `w-5 h-5` |
| Dialog header | 24px | `w-6 h-6` |
| Empty state | 48px | `w-12 h-12` |

---

## 15. Implementation Roadmap

### Phase 1 — Foundation (DONE)
- [x] CSS variable system (`index.css` lines 18–131)
- [x] Plus Jakarta Sans import
- [x] Claymorphism utility classes (`.clay-*`)
- [ ] Audit hardcoded colors → CSS variables
- [ ] Audit hardcoded font-sizes → Tailwind type scale
- [ ] Replace hardcoded `shadow-*` → `--shadow-*` variables

### Phase 2 — Component audit (next sprint)
- [ ] Button: all variants match spec
- [ ] Card: stat card has gradient top bar
- [ ] Input: focus ring uses `box-shadow` not `outline`
- [ ] Table: row height ≥ 52px
- [ ] Dialog: uses `.dark .clay-dialog-content` variant
- [ ] Avatar: ring shadow per spec

### Phase 3 — Premium touches
- [ ] Skeleton shimmer for loading states
- [ ] Staggered entrance animation for list items
- [ ] Badge pulse animation for unread notifications
- [ ] Page transition: fade + slight translate (300ms)
- [ ] Stat counter animation on mount

### Phase 4 — Polish
- [ ] Custom scrollbar (thin, violet-tinted, light/dark)
- [ ] `::selection` color: `hsl(262 83% 58% / 0.25)`
- [ ] Smooth scroll on `<html>`
- [ ] Backdrop blur on modal overlay
- [ ] Custom focus ring (`:focus-visible`) — always violet

### Phase 5 — Documentation
- [ ] Storybook for all components
- [ ] Figma token export (if design handoff needed)
- [ ] Per-page design notes in `docs/`

---

## 16. Anti-Patterns (Never Do)

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| `bg-gray-100` | Hardcoded gray, breaks dark mode | `bg-muted` |
| `text-gray-500` | Hardcoded gray text | `text-muted-foreground` |
| `shadow-xl` | Tailwind default, wrong color | Custom `--shadow-*` var |
| `rounded-lg` without `--radius` | Inconsistent with shadcn | Use `--radius` |
| `text-sm` for critical labels | Too small | `text-base` minimum |
| `transition-all` | Unnecessary repaints | Specify `transition-colors` or `transition-transform` |
| `opacity-60` on buttons | Poor contrast | `opacity-0.55` + check contrast |
| `#FFFFFF` in dark mode | Pure white jarring | `hsl(var(--foreground))` |
| `cursor-default` on cards | Unclear interactivity | `cursor-pointer` |
| No `hover` state on nav | Can't tell active area | Always implement hover |
| `font-weight: 300` for body | Too light, poor contrast | `400` minimum |

---

## 17. File Reference

| File | Purpose |
|------|---------|
| `src/index.css` | All CSS variables, claymorphism utilities, gradient definitions |
| `tailwind.config.ts` | Tailwind token mapping to CSS variables |
| `src/components/ui/button.tsx` | Button component (shadcn) |
| `src/components/ui/card.tsx` | Card component (shadcn) |
| `src/components/ui/input.tsx` | Input component (shadcn) |
| `src/components/AppShell.tsx` | Layout shell (sidebar + header) |
| `src/components/ui/sidebar.tsx` | Sidebar (shadcn) |
| `docs/PRD.md` | Product requirements |
| `docs/PERMISSION_MATRIX.md` | Role-based access control |

---

## Quick Reference Card

```
PRIMARY:        #7C3AED  (262 83% 58%)
ACCENT:         #F97316  (25 95% 53%)
SUCCESS:        #22C55E  (152 60% 38%)
BG:             #FDFBFF  (270 100% 98%)
FG:             #1A1035  (270 50% 10%)
BORDER:         #E4DFF5  (270 20% 88%)

RADIUS:         14px / 0.875rem
SHADOW:         violet-tinted, 3-tier (sm/md/lg)
TYPOGRAPHY:     Plus Jakarta Sans, 1.250 ratio
ANIMATION:      200ms ease-out default, cubic-bezier curves
TOUCH TARGET:   44px minimum
CONTRAST:       WCAG AA 4.5:1 minimum
```
