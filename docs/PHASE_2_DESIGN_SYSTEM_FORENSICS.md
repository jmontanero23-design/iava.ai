# PHASE 2: DESIGN SYSTEM FORENSICS
## iAVA.ai Elite Platform Audit

**Audit Date:** November 29, 2025
**CSS File:** 1,650 lines in `src/index.css`
**Design Philosophy:** Dark mode glassmorphism with trading-inspired semantics

---

## 2.1 COLOR PALETTE EXTRACTION

### Defined CSS Variables (Design Tokens)

```css
:root {
  /* === BASE SURFACES === */
  --surface: #05070f;           /* Deepest background */
  --panel: #0f172a;             /* Standard panel (slate-900) */
  --panel-elevated: #1e293b;    /* Elevated surface (slate-800) */

  /* === TEXT HIERARCHY === */
  --text: #e5e7eb;              /* Primary text (gray-200) */
  --text-muted: #94a3b8;        /* Secondary text (slate-400) */
  --text-subtle: #64748b;       /* Tertiary text (slate-500) */

  /* === SEMANTIC COLORS === */
  --primary: #6366f1;           /* Indigo-500 - primary actions */
  --primary-hover: #4f46e5;     /* Indigo-600 */
  --primary-light: #818cf8;     /* Indigo-400 */

  --success: #10b981;           /* Emerald-500 - bullish/positive */
  --success-hover: #059669;     /* Emerald-600 */
  --success-light: #34d399;     /* Emerald-400 */

  --danger: #f43f5e;            /* Rose-500 - bearish/negative */
  --danger-hover: #e11d48;      /* Rose-600 */
  --danger-light: #fb7185;      /* Rose-400 */

  --warning: #f59e0b;           /* Amber-500 - caution */
  --warning-hover: #d97706;     /* Amber-600 */
  --warning-light: #fbbf24;     /* Amber-400 */

  --info: #22d3ee;              /* Cyan-400 - informational */
  --info-hover: #06b6d4;        /* Cyan-500 */
  --info-light: #67e8f9;        /* Cyan-300 */
}
```

### Actual Color Usage (By Frequency)

#### Backgrounds (Tailwind Classes)
| Class | Count | Hex | Usage |
|-------|-------|-----|-------|
| `bg-slate-800` | 426 | #1e293b | Primary panels, cards |
| `bg-slate-700` | 160 | #334155 | Hover states, secondary |
| `bg-slate-900` | 67 | #0f172a | Deep backgrounds |
| `bg-slate-600` | 56 | #475569 | Tertiary surfaces |
| `bg-slate-500` | 14 | #64748b | Interactive elements |
| `bg-slate-950` | 5 | #020617 | Deepest surfaces |

#### Text Colors (Tailwind Classes)
| Class | Count | Hex | Usage |
|-------|-------|-----|-------|
| `text-slate-400` | 800 | #94a3b8 | Secondary text (OVERUSED) |
| `text-slate-300` | 270 | #cbd5e1 | Primary text alternative |
| `text-slate-200` | 166 | #e2e8f0 | Emphasis text |
| `text-emerald-400` | 164 | #34d399 | Bullish/positive |
| `text-slate-500` | 149 | #64748b | Muted text |
| `text-red-400` | 119 | #f87171 | Bearish/negative |
| `text-purple-400` | 73 | #c084fc | AI/special features |
| `text-cyan-400` | 71 | #22d3ee | Informational |
| `text-amber-400` | 62 | #fbbf24 | Warnings |

#### Gradient From Colors
| Class | Count | Usage |
|-------|-------|-------|
| `from-indigo-600` | 62 | Primary gradients |
| `from-purple-600` | 39 | AI/premium features |
| `from-emerald-600` | 34 | Success states |
| `from-cyan-600` | 27 | Info/cool accent |
| `from-purple-500` | 24 | AI secondary |
| `from-indigo-500` | 19 | Primary light |

### Defined Gradients
```css
--gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6);
--gradient-success: linear-gradient(135deg, #10b981, #34d399);
--gradient-danger: linear-gradient(135deg, #f43f5e, #fb7185);
```

### Glassmorphism System
```css
--glass-border: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(34,211,238,0.2));
--glass-border-strong: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.3));

.glass-panel {
  background: rgba(15,23,42,0.75);
  border: 1px solid rgba(148,163,184,0.25);
  backdrop-filter: blur(20px) saturate(140%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.05),
              inset 0 -1px 0 rgba(0,0,0,0.2);
}
```

### Color Inconsistencies Found

| Issue | Location | Recommendation |
|-------|----------|----------------|
| `text-slate-400` overused (800x) | Throughout | Use hierarchy: 200 > 300 > 400 |
| Mixed red variants | `text-red-400`, `text-rose-400` | Standardize on rose (danger) |
| Hardcoded hex in JSX | Various components | Use CSS variables |
| Inconsistent success green | `#10b981` vs `#34d399` | Use semantic tokens |

### Missing Colors Needed

| Color | Purpose | Recommended |
|-------|---------|-------------|
| Neutral highlight | Table rows, selections | `bg-slate-750` (custom) |
| Link color | Clickable text | `text-indigo-400` |
| Disabled state | Inactive elements | `text-slate-600` |
| Chart candle green | Bullish candles | `#22c55e` (green-500) |
| Chart candle red | Bearish candles | `#ef4444` (red-500) |

---

## 2.2 TYPOGRAPHY AUDIT

### Defined Typography Scale

```css
:root {
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
}
```

### Actual Typography Usage

#### Font Sizes (By Frequency)
| Class | Count | Size | Usage |
|-------|-------|------|-------|
| `text-xs` | 1,077 | 12px | Labels, badges, hints |
| `text-sm` | 452 | 14px | Body text, inputs |
| `text-lg` | 162 | 18px | Section headers |
| `text-2xl` | 110 | 24px | Panel titles |
| `text-xl` | 85 | 20px | Subheadings |
| `text-base` | 58 | 16px | Default body |
| `text-3xl` | 25 | 30px | Page titles |
| `text-4xl` | 15 | 36px | Hero text |
| `text-5xl` | 7 | 48px | Large numbers |
| `text-6xl` | 3 | 60px | Dashboard metrics |

#### Font Weights
| Class | Count | Weight | Usage |
|-------|-------|--------|-------|
| `font-semibold` | 460 | 600 | Most common emphasis |
| `font-bold` | 399 | 700 | Strong emphasis |
| `font-medium` | 122 | 500 | Subtle emphasis |
| `font-mono` | 20 | - | Code, numbers |

### Font Family Stack
```css
body {
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
}
```

### Typography Observations

**Strengths:**
- Clean, modern Inter font
- Well-defined size scale
- Consistent 8px-based sizing

**Issues:**
- `text-xs` overused (1,077 instances) - may indicate readability problems
- No monospace font defined for numbers/data
- Missing letter-spacing definitions
- Line heights not explicitly defined

**Recommendations:**
1. Define `font-data` for tabular numbers
2. Reduce `text-xs` usage in favor of `text-sm`
3. Add line-height tokens: `leading-tight`, `leading-normal`, `leading-relaxed`

---

## 2.3 SPACING SYSTEM ANALYSIS

### Defined Spacing Tokens

```css
:root {
  --space-1: 0.25rem;  /* 4px - micro spacing */
  --space-2: 0.5rem;   /* 8px - tight */
  --space-3: 0.75rem;  /* 12px - compact */
  --space-4: 1rem;     /* 16px - standard */
  --space-6: 1.5rem;   /* 24px - generous */
  --space-8: 2rem;     /* 32px - loose */
}
```

### Actual Spacing Usage (Tailwind Classes)

#### Gap (Flex/Grid)
| Class | Count | Size | Usage |
|-------|-------|------|-------|
| `gap-2` | 378 | 8px | Most common |
| `gap-3` | 180 | 12px | Card content |
| `gap-1` | 96 | 4px | Tight groups |
| `gap-4` | 65 | 16px | Sections |

#### Padding
| Class | Count | Size | Usage |
|-------|-------|------|-------|
| `p-4` | 182 | 16px | Standard panel |
| `p-3` | 173 | 12px | Compact cards |
| `p-5` | 93 | 20px | Feature panels |
| `p-2` | 62 | 8px | Buttons, inputs |
| `p-6` | 35 | 24px | Large sections |
| `py-2` | 187 | 8px | Vertical (buttons) |
| `py-1` | 202 | 4px | Tight vertical |
| `px-3` | 172 | 12px | Horizontal |
| `px-4` | 122 | 16px | Horizontal |
| `px-2` | 146 | 8px | Compact horizontal |

#### Margin
| Class | Count | Usage |
|-------|-------|-------|
| `mb-1` | 233 | Between lines |
| `mb-2` | 161 | Between elements |
| `mb-3` | 85 | Between sections |
| `mt-1` | 92 | Top spacing |
| `mt-2` | 59 | Top sections |

#### Stack Spacing
| Class | Count | Usage |
|-------|-------|-------|
| `space-y-4` | 52 | Standard stacks |
| `space-y-3` | 52 | Compact stacks |
| `space-y-2` | 52 | Tight stacks |
| `space-y-1` | 37 | Micro stacks |

### Spacing Observations

**Strengths:**
- Consistent 4px-based system
- Good variety of spacing options
- Proper use of gap for flex/grid

**Issues:**
- Heavy reliance on `mb-*` instead of `space-y-*`
- Inconsistent padding across similar components
- Missing `space-5` and `space-7` tokens

---

## 2.4 COMPONENT LIBRARY AUDIT

### Button System (Excellent)

| Class | Purpose | Visual Treatment |
|-------|---------|------------------|
| `.btn` | Base button | bg-slate-800, border, rounded-lg |
| `.btn-primary` | Critical actions | Gradient + glow |
| `.btn-secondary` | Standard actions | Solid indigo |
| `.btn-tertiary` | Low priority | Ghost with border |
| `.btn-success` | Bullish/positive | Green gradient + glow |
| `.btn-danger` | Bearish/destructive | Red gradient + glow |
| `.btn-warning` | Caution | Amber solid |
| `.btn-ghost` | Minimal | Transparent + blur |
| `.btn-outline` | Bordered | Transparent + border |
| `.btn-toggle` | State-aware | Active/inactive states |
| `.btn-icon` | Icon-only | Square aspect ratio |

**Size Variants:**
- `.btn-xs` - 4px 12px padding
- `.btn-sm` - 8px 12px padding
- `.btn-lg` - 12px 24px padding

### Input System (Good)

```css
.input, .select, textarea {
  @apply bg-slate-800 border border-slate-700 rounded-lg text-slate-200;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}
```

- Focus: 3px indigo ring
- Hover: Lighter border
- Placeholder: Subtle gray

### Panel System (Premium)

```css
.glass-panel {
  background: rgba(15,23,42,0.75);
  backdrop-filter: blur(20px) saturate(140%);
  border-radius: 20px;
  /* Gradient border via ::before pseudo-element */
}

.panel-header {
  /* Animated gradient background */
  /* Variants: success, danger, info */
}
```

### Card System (Standard)

```css
.card {
  @apply bg-slate-900/85 border border-slate-800 rounded-xl;
  backdrop-filter: blur(8px) saturate(120%);
  /* Hover: lift + glow effect */
}
```

### Loading States (Comprehensive)

| Component | Animation | Duration |
|-----------|-----------|----------|
| `.skeleton-loader` | Shimmer | 1.5s |
| `.spinner` | Rotate | 0.8s |
| `.spinner-sm/lg` | Size variants | - |
| `.skeleton-text` | 1rem height | - |
| `.skeleton-card` | 8rem height | - |

### Component Coverage Matrix

| Component | Exists | States | A11y | Mobile | Quality |
|-----------|--------|--------|------|--------|---------|
| Button | ✅ Full | hover, active, disabled, focus | ✅ | ✅ | 9/10 |
| Input | ✅ Full | focus, hover, disabled | ⚠️ | ✅ | 8/10 |
| Select | ✅ Basic | focus | ⚠️ | ⚠️ | 6/10 |
| Checkbox | ✅ Basic | - | ⚠️ | ✅ | 7/10 |
| Card | ✅ Full | hover | ⚠️ | ✅ | 8/10 |
| Panel | ✅ Premium | variants | ⚠️ | ✅ | 9/10 |
| Modal | ❌ Missing | - | - | - | - |
| Toast | ✅ Full | enter, exit | ⚠️ | ✅ | 8/10 |
| Dropdown | ⚠️ Partial | - | ⚠️ | ⚠️ | 5/10 |
| Tabs | ⚠️ Inline | - | ⚠️ | ⚠️ | 6/10 |
| Badge/Pill | ✅ Full | variants | ⚠️ | ✅ | 8/10 |
| Tooltip | ✅ Full | - | ⚠️ | ⚠️ | 7/10 |
| Skeleton | ✅ Full | variants | N/A | ✅ | 9/10 |
| Spinner | ✅ Full | sizes | N/A | ✅ | 9/10 |
| Toggle | ❌ Missing | - | - | - | - |
| Slider | ❌ Missing | - | - | - | - |
| Avatar | ❌ Missing | - | - | - | - |
| Table | ⚠️ Inline | - | ⚠️ | ❌ | 5/10 |

---

## 2.5 ANIMATION & MOTION INVENTORY

### Defined Keyframe Animations (23 total)

| Animation | Duration | Easing | Purpose |
|-----------|----------|--------|---------|
| `fadeIn` | 0.3s | ease-in-out | Element entrance |
| `gradient` | 8s | ease-in-out | Background gradient shift |
| `pulse-slow` | 4s | ease-in-out | Subtle attention |
| `gradient-shift` | 8s | ease-in-out | Panel header glow |
| `pulse-data` | 0.4s | ease-out | Data update flash |
| `slideInRight` | 0.3s | cubic-bezier | Toast entrance |
| `slideOutRight` | 0.3s | cubic-bezier | Toast exit |
| `shimmer` | 2s | infinite | Skeleton loading |
| `glow-pulse` | 2s | ease-in-out | Signal highlight |
| `ai-setup-highlight` | 2s | ease-in-out | AI recommendation |
| `skeleton-shimmer` | 1.5s | ease-in-out | Premium skeleton |
| `spin-gradient` | 0.8s | linear | Spinner rotation |
| `progress-shimmer` | 1s | linear | Progress bar |
| `dot-bounce` | 1.4s | infinite | Loading dots |
| `fade-in-up` | 0.5s | cubic-bezier | Modal entrance |
| `pulse-ring` | 1.5s | cubic-bezier | Notification ring |
| `loading-text` | 1s | steps(3) | Loading... text |
| `ripple` | 0.6s | ease-out | Click ripple |
| `icon-bounce` | 0.4s | cubic-bezier | Icon interaction |
| `gradient-shift-hover` | 0.5s | ease-in-out | Hover gradient |
| `expand-height` | 0.3s | cubic-bezier | Accordion expand |
| `toast-slide-in` | 0.3s | cubic-bezier | Toast variant |
| `toast-progress` | 4s | linear | Toast timer |

### Tailwind Animation Usage

| Class | Count | Purpose |
|-------|-------|---------|
| `animate-pulse` | 118 | Loading states (OVERUSED) |
| `animate-spin` | 18 | Spinners |
| `animate-bounce` | 5 | Attention |
| `animate-ping` | 3 | Notification dots |

### Transition System

```css
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Global smooth transitions */
* {
  transition-property: color, background-color, border-color,
                       text-decoration-color, fill, stroke;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Motion Observations

**Strengths:**
- Comprehensive animation library
- Consistent easing (cubic-bezier)
- Premium glassmorphism effects
- Trading-specific animations (glow-pulse, ai-setup)

**Issues:**
- `animate-pulse` overused (118x) - fatiguing
- No reduced-motion media query support
- Some animations too long (8s gradients)

**Recommendations:**
1. Add `@media (prefers-reduced-motion: reduce)` support
2. Replace many `animate-pulse` with static states
3. Consider shorter gradient cycles (4s max)

---

## 2.6 ICONOGRAPHY ANALYSIS

### Icon System: Lucide React

**Package:** `lucide-react` v0.554.0

### Icons Found in Codebase

| Icon | Count | Usage Context |
|------|-------|---------------|
| Trophy | 1 | Achievements |
| Star | 1 | Ratings/favorites |
| Zap | 2 | Quick actions |
| Target | 1 | Goals/targets |
| TrendingUp | 1 | Positive trends |
| Award | 1 | Recognition |
| Medal | 1 | Rankings |
| Crown | 1 | Premium/top |
| Brain | 2 | AI features |
| Sparkles | 2 | AI/magic |
| Send | 1 | Submit actions |
| RefreshCw | 1 | Refresh/reload |
| AlertCircle | 1 | Warnings |
| CheckCircle | - | Success |
| XCircle | - | Error/close |
| Info | - | Information |
| Loader | - | Loading |
| Clock | - | Time |
| Activity | - | Activity |
| BarChart | - | Charts |

### Custom UI Components Using Icons

| Component | Icon Usage |
|-----------|------------|
| `InfoPopover` | 32 instances |
| `SkeletonText` | 17 instances |
| Achievement System | Trophy, Star, Medal, Crown |
| AI Components | Brain, Sparkles, Zap |

### Icon Styling Pattern

```jsx
// Typical icon usage
<Sparkles className="w-4 h-4 text-purple-400" />
<Brain className="w-5 h-5 text-cyan-400" />
```

### Iconography Observations

**Strengths:**
- Consistent icon library (Lucide)
- Good semantic usage (Brain for AI, etc.)
- Size consistency (w-4, w-5)

**Issues:**
- Limited icon variety (only ~20 unique icons found)
- No icon component wrapper
- Inconsistent sizing patterns
- Missing trading-specific icons

**Recommendations:**
1. Create `<Icon>` wrapper component for consistent sizing/colors
2. Add trading-specific icons (candle, chart patterns)
3. Consider icon font for better performance
4. Define icon size tokens: `icon-xs`, `icon-sm`, `icon-md`, `icon-lg`

---

## 2.7 BORDER RADIUS SYSTEM

### Defined Tokens

```css
:root {
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.25rem;   /* 20px */
  --radius-full: 9999px;   /* pills */
}
```

### Actual Usage

| Class | Count | Size | Usage |
|-------|-------|------|-------|
| `rounded-lg` | 417 | 8px | Most common |
| `rounded-xl` | 154 | 12px | Panels |
| `rounded-full` | 153 | pill | Badges, avatars |
| `rounded-md` | 15 | 6px | Small elements |
| `rounded-2xl` | 12 | 16px | Large cards |

### Observation
Good consistency with `rounded-lg` as default. Glass panels use custom 20px (`rounded-[20px]`).

---

## 2.8 SHADOW SYSTEM

### Defined Tokens

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.2);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.3);

  /* Glow variants */
  --shadow-glow-primary: 0 0 20px rgba(99,102,241,0.4);
  --shadow-glow-success: 0 0 20px rgba(16,185,129,0.4);
  --shadow-glow-danger: 0 0 20px rgba(244,63,94,0.4);
}
```

### Glass Panel Shadow
```css
.glass-panel {
  box-shadow: 0 8px 32px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.05),
              inset 0 -1px 0 rgba(0,0,0,0.2);
}
```

---

## PHASE 2 SUMMARY

### Design System Maturity: 7.5/10

**Strengths:**
1. **Comprehensive CSS variables** - Well-defined design tokens
2. **Premium glassmorphism** - Consistent, modern aesthetic
3. **Button system** - Full hierarchy with proper states
4. **Animation library** - Rich but controlled
5. **Color semantics** - Trading-aware (bullish/bearish)

**Weaknesses:**
1. **Typography overuse** - `text-xs` and `text-slate-400` overused
2. **Missing components** - Modal, Toggle, Slider, Avatar
3. **Inconsistent usage** - Tokens defined but not always used
4. **Accessibility gaps** - Limited focus states, no reduced-motion
5. **Animation fatigue** - `animate-pulse` overused

### Priority Fixes

| Priority | Issue | Fix |
|----------|-------|-----|
| HIGH | `text-slate-400` overused | Implement text hierarchy |
| HIGH | Missing Modal component | Create reusable modal |
| HIGH | No reduced-motion | Add media query support |
| MEDIUM | Icon inconsistency | Create Icon wrapper |
| MEDIUM | Animation fatigue | Replace pulse with static |
| LOW | Missing components | Add Toggle, Slider, Avatar |

### Competitive Alignment (vs Research)

| Trend | iAVA Status | Gap |
|-------|-------------|-----|
| Dark mode + glassmorphism | ✅ Implemented | None |
| Mobile-first responsive | ✅ Implemented | Minor tweaks |
| Micro-interactions | ⚠️ Partial | Need more |
| Biometric auth UI | ❌ Missing | Future feature |
| Voice UI indicators | ❌ Missing | Priority add |
| Swipe gestures | ✅ Implemented | None |

---

*Phase 2 Complete - November 29, 2025*
