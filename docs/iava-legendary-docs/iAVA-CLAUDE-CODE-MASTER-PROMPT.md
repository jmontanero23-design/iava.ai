# 🦄 iAVA.ai LEGENDARY IMPLEMENTATION PROTOCOL
## The Ultimate Claude Code Master Prompt

---

## CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE WRITING ANY CODE

You are being tasked with building **iAVA.ai** - the AI-native trading platform that will make Robinhood, Webull, TradingView, and every other trading app look like toys. This is not a typical project. This is a **LEGENDARY** build that requires **ULTRA PhD ELITE+++ WORLD-CLASS** quality in every single line of code, every component, every pixel.

**Quality Standard:** We do not ship "good enough." We ship perfection. If something takes longer to do right, we take the time. We are building the future of trading.

---

## PHASE 0: CODEBASE AUDIT (DO THIS FIRST)

Before writing ANY new code, you must understand what already exists.

### Step 0.1: Discover Existing Architecture
```bash
# Run these commands and analyze the output
find . -name "package.json" -o -name "requirements.txt" -o -name "Cargo.toml" | head -20
find . -type f -name "*.tsx" -o -name "*.jsx" | head -50
find . -type f -name "*.py" | head -50
find . -name "README.md" | xargs cat 2>/dev/null | head -200
```

### Step 0.2: Identify Key Systems
Look for and document:
- [ ] Frontend framework (React/Next.js/React Native?)
- [ ] Backend framework (Node/Python/Rust?)
- [ ] Database (PostgreSQL/MongoDB/Redis?)
- [ ] API structure (REST/GraphQL/tRPC?)
- [ ] Authentication system
- [ ] Trading/broker integrations (Alpaca/TD Ameritrade?)
- [ ] AI/ML integrations (OpenAI/Anthropic/Custom?)
- [ ] Voice system (Deepgram/ElevenLabs/Whisper?)
- [ ] Real-time data (WebSockets/SSE?)
- [ ] Existing UI components
- [ ] State management (Zustand/Redux/Context?)
- [ ] Styling approach (Tailwind/CSS Modules/Styled Components?)

### Step 0.3: Create Architecture Map
After auditing, create a markdown file documenting:
```markdown
# iAVA.ai Current Architecture

## Frontend
- Framework: [discovered]
- Styling: [discovered]
- State: [discovered]
- Components: [list key ones]

## Backend
- Framework: [discovered]
- Database: [discovered]
- APIs: [list endpoints]

## Integrations
- Broker: [discovered]
- AI: [discovered]
- Voice: [discovered]

## Gaps to Fill
- [list what's missing vs the design spec]
```

---

## PHASE 1: DESIGN SYSTEM IMPLEMENTATION

Reference: `iAVA-ULTIMATE-DESIGN-SYSTEM.html`

### 1.1 Create Design Tokens File

Create `/src/styles/tokens.ts` (or appropriate location):

```typescript
// iAVA Design Tokens - THE SINGLE SOURCE OF TRUTH
// DO NOT HARDCODE VALUES ELSEWHERE - ALWAYS IMPORT FROM HERE

export const colors = {
  // THE VOID (Backgrounds)
  void: '#000000',
  voidSoft: '#030712',
  depth1: '#0a0f1a',
  depth2: '#111827',
  depth3: '#1f2937',
  
  // INTELLIGENCE (Purple) - AI Features
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // PRIMARY
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    dim: 'rgba(168, 85, 247, 0.12)',
    glow: 'rgba(168, 85, 247, 0.5)',
  },
  
  // PREDICTION (Cyan) - Chronos, Forecasts
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee', // PRIMARY
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    dim: 'rgba(34, 211, 238, 0.12)',
    glow: 'rgba(34, 211, 238, 0.5)',
  },
  
  // SUCCESS (Emerald) - Profit, Bullish
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399', // PRIMARY
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    dim: 'rgba(52, 211, 153, 0.12)',
    glow: 'rgba(52, 211, 153, 0.4)',
  },
  
  // DANGER (Red) - Loss, Bearish
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171', // PRIMARY
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    dim: 'rgba(248, 113, 113, 0.12)',
    glow: 'rgba(248, 113, 113, 0.4)',
  },
  
  // CAUTION (Amber)
  amber: {
    400: '#fbbf24',
    500: '#f59e0b',
    dim: 'rgba(251, 191, 36, 0.12)',
  },
  
  // CORE (Indigo)
  indigo: {
    400: '#818cf8',
    500: '#6366f1', // PRIMARY
    600: '#4f46e5',
    dim: 'rgba(99, 102, 241, 0.12)',
    glow: 'rgba(99, 102, 241, 0.5)',
  },
  
  // TEXT HIERARCHY
  text: {
    100: '#ffffff',
    90: '#f1f5f9',
    70: '#cbd5e1',
    50: '#94a3b8',
    30: '#64748b',
    20: '#475569',
  },
  
  // GLASS
  glass: {
    bg: 'rgba(10, 15, 26, 0.88)',
    bgHeavy: 'rgba(10, 15, 26, 0.95)',
    border: 'rgba(255, 255, 255, 0.05)',
    borderLight: 'rgba(255, 255, 255, 0.08)',
  },
} as const;

export const gradients = {
  unicorn: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
  unicornVertical: 'linear-gradient(180deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
  fire: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  forest: 'linear-gradient(135deg, #10b981 0%, #22d3ee 100%)',
  aurora: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #f43f5e 100%)',
  buyButton: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
  sellButton: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 40,
    '7xl': 48,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  letterSpacing: {
    tighter: -0.04,
    tight: -0.02,
    normal: 0,
    wide: 0.02,
    wider: 0.05,
    widest: 0.1,
  },
} as const;

export const animation = {
  easing: {
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
    slowest: 1000,
  },
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 8px 24px rgba(0, 0, 0, 0.5)',
  lg: '0 20px 60px rgba(0, 0, 0, 0.6)',
  xl: '0 32px 80px rgba(0, 0, 0, 0.7)',
  glow: {
    purple: '0 0 40px rgba(168, 85, 247, 0.5)',
    cyan: '0 0 40px rgba(34, 211, 238, 0.5)',
    emerald: '0 0 30px rgba(52, 211, 153, 0.4)',
    red: '0 0 30px rgba(248, 113, 113, 0.4)',
    indigo: '0 0 40px rgba(99, 102, 241, 0.5)',
  },
} as const;
```

### 1.2 Create Core Components

Build these components in order. Each must be PIXEL-PERFECT to the design system.

#### Component Checklist:
- [ ] `Button` - Primary, Success, Danger, Ghost variants with glow effects
- [ ] `Input` - With icon support, focus states, error states
- [ ] `Card` - Glass morphism with hover glow
- [ ] `Badge` - Live, Beta, Bullish, Bearish, Score variants
- [ ] `ScoreRing` - THE SIGNATURE COMPONENT - animated unicorn gradient ring
- [ ] `Avatar` - User avatar with online indicator
- [ ] `Logo` - The iAVA neural network logo (SVG component)
- [ ] `TabBar` - Bottom navigation for mobile
- [ ] `IconRail` - Side navigation for desktop
- [ ] `SearchBar` - With voice button
- [ ] `Modal` - Glass morphism overlay
- [ ] `Drawer` - Bottom sheet for mobile
- [ ] `Toast` - Notification system
- [ ] `Skeleton` - Loading states

### 1.3 The Logo Component (CRITICAL)

The logo is a neural network with prediction arc. Create as SVG component:

```tsx
// Logo.tsx - THE iAVA LOGO
interface LogoProps {
  size?: number;
  variant?: 'full' | 'mark' | 'wordmark';
  animated?: boolean;
}

export const Logo = ({ size = 40, variant = 'mark', animated = false }: LogoProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      
      {/* Prediction Arc */}
      <path 
        d="M20 40 Q50 15 80 40" 
        stroke="url(#logoGradient)" 
        strokeWidth="3.5" 
        fill="none" 
        strokeLinecap="round"
      />
      
      {/* Neural Network Tree - Connections */}
      <line x1="50" y1="35" x2="30" y2="55" stroke="url(#logoGradient)" strokeWidth="2.5" />
      <line x1="50" y1="35" x2="70" y2="55" stroke="url(#logoGradient)" strokeWidth="2.5" />
      <line x1="50" y1="35" x2="50" y2="60" stroke="url(#logoGradient)" strokeWidth="2.5" />
      <line x1="30" y1="55" x2="20" y2="75" stroke="url(#logoGradient)" strokeWidth="2" />
      <line x1="30" y1="55" x2="40" y2="75" stroke="url(#logoGradient)" strokeWidth="2" />
      <line x1="70" y1="55" x2="60" y2="75" stroke="url(#logoGradient)" strokeWidth="2" />
      <line x1="70" y1="55" x2="80" y2="75" stroke="url(#logoGradient)" strokeWidth="2" />
      
      {/* Neural Network Tree - Nodes */}
      <circle cx="50" cy="35" r="7" fill="url(#logoGradient)" /> {/* Central/AVA Mind */}
      <circle cx="30" cy="55" r="5" fill="url(#logoGradient)" /> {/* Left mid */}
      <circle cx="70" cy="55" r="5" fill="url(#logoGradient)" /> {/* Right mid */}
      <circle cx="20" cy="75" r="4" fill="url(#logoGradient)" /> {/* Bottom nodes */}
      <circle cx="40" cy="75" r="4" fill="url(#logoGradient)" />
      <circle cx="60" cy="75" r="4" fill="url(#logoGradient)" />
      <circle cx="80" cy="75" r="4" fill="url(#logoGradient)" />
      
      {/* Central node highlight */}
      <circle cx="50" cy="35" r="3" fill="white" opacity="0.6" />
    </svg>
  );
};
```

### 1.4 The Score Ring Component (SIGNATURE)

```tsx
// ScoreRing.tsx - THE UNICORN SCORE
interface ScoreRingProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showLabel?: boolean;
}

export const ScoreRing = ({ score, size = 'md', animated = true, showLabel = true }: ScoreRingProps) => {
  const sizes = {
    sm: { ring: 48, stroke: 4, fontSize: 14 },
    md: { ring: 64, stroke: 5, fontSize: 20 },
    lg: { ring: 80, stroke: 5, fontSize: 28 },
    xl: { ring: 100, stroke: 6, fontSize: 32 },
  };
  
  const { ring, stroke, fontSize } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="score-ring" style={{ width: ring, height: ring, position: 'relative' }}>
      <svg width={ring} height={ring} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        
        {/* Background ring */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={stroke}
        />
        
        {/* Score ring */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{
            transition: animated ? 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))',
          }}
        />
      </svg>
      
      {/* Score value */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{
          fontSize,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #22d3ee)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {score}
        </span>
        {showLabel && size !== 'sm' && (
          <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>
            Score
          </span>
        )}
      </div>
    </div>
  );
};
```

---

## PHASE 2: SCREEN IMPLEMENTATION

Reference: `iAVA-ULTIMATE-LEGENDARY-MOBILE.html` and `iAVA-LEGENDARY-DESKTOP.html`

### 2.1 Mobile Screens (Build in this order)

#### Tab 1: Trade Screen
```
Components needed:
├── LogoHeader (logo + bell + settings)
├── SymbolHeader (logo, ticker, name, price, change)
├── ChartContainer
│   ├── TimeframeBar (1m, 5m, 15m, 1H, D)
│   ├── ChartTools (indicators, fullscreen)
│   └── ChartCanvas (TradingView or custom)
├── ScoreCard (expandable)
│   ├── ScoreRing
│   ├── DirectionBadge (Bullish/Bearish)
│   ├── ArchetypeChip
│   └── ScoreBreakdown (when expanded)
│       ├── Technicals bar
│       ├── Sentiment bar
│       ├── Chronos bar
│       └── AIRecommendation
└── ActionBar
    ├── BuyButton
    ├── SellButton
    ├── ChatButton
    └── AlertButton
```

#### Tab 2: Discover Screen
```
Components needed:
├── SearchBar (with voice button)
├── FilterPills (Unicorns, Squeezes, Earnings, Trending)
└── StockList
    └── StockCard (logo, ticker, name, price, change, mini score)
```

#### Tab 3: AI Hub Screen
```
Components needed:
├── HubHeader (icon, title, subtitle)
└── FeatureGrid (2-column)
    └── FeatureCard (17 total)
        ├── StatusBadge (Live/Beta)
        ├── FeatureIcon (colored)
        ├── Title
        └── Description
```

#### Tab 4: Portfolio Screen
```
Components needed:
├── PortfolioHero
│   ├── TotalValue
│   ├── ChangeAmount
│   ├── ChangePct
│   └── QuickStats (positions, buying power, win rate)
└── PositionsList
    └── PositionCard (logo, ticker, shares, value, P&L)
```

#### Tab 5: You Screen
```
Components needed:
├── ProfileHeader (avatar, name, archetype)
└── SettingsCards (expandable)
    ├── AVA Mind (emotional state)
    ├── Trade Journal (stats)
    ├── Broker (connection status)
    ├── Alerts (count)
    └── Settings
```

### 2.2 Desktop Layout

```
Grid: 72px | 280px | 1fr | 380px
Rows: 56px | 1fr

├── TopBar (spans all columns)
│   ├── Logo
│   ├── MarketStatus
│   ├── GlobalSearch
│   ├── NotificationButton
│   ├── VoiceButton ("Hey AVA")
│   └── UserAvatar
├── IconRail (72px)
│   ├── Trade
│   ├── Discover
│   ├── AI Hub
│   ├── Portfolio
│   ├── --- divider ---
│   ├── Chronos
│   ├── AVA Mind
│   ├── Journal
│   ├── Sentiment
│   ├── --- spacer ---
│   └── Settings
├── WatchlistPanel (280px)
│   ├── PanelHeader
│   ├── Filters (All, Unicorns, Squeezes)
│   └── WatchlistItems (with mini ScoreRing)
├── MainContent (1fr)
│   ├── SymbolBar (symbol info + actions)
│   ├── ChartToolbar (timeframes, tools, indicators)
│   ├── ChartCanvas
│   └── BottomStats (Open, High, Low, Volume, etc)
└── AIPanel (380px)
    ├── PanelHeader (AVA Mind)
    ├── Tabs (Score, Insights, Chronos, Chat)
    ├── Content
    │   ├── ScoreSection (large ring + breakdown)
    │   ├── InsightCards
    │   └── ChronosForecast
    └── ChatInput
```

---

## PHASE 3: FEATURE IMPLEMENTATION

### 3.1 The 17 AI Features

Each feature needs:
1. **Data model** - What data does it consume/produce?
2. **API endpoints** - How does frontend get this data?
3. **UI components** - Feature card + detail view
4. **Real-time updates** - WebSocket subscriptions

| # | Feature | Priority | Dependencies |
|---|---------|----------|--------------|
| 1 | Unicorn Score | P0 | Technicals, Sentiment, Chronos |
| 2 | AVA Mind | P0 | User history, preferences |
| 3 | Chronos Forecast | P0 | ML models, price data |
| 4 | AI Sentiment | P0 | News API, social API |
| 5 | Market Regime | P1 | Technical indicators |
| 6 | Voice Trading | P1 | Deepgram, ElevenLabs, broker |
| 7 | Pattern Recognition | P1 | Chart data, ML |
| 8 | Risk Advisor | P1 | Portfolio data |
| 9 | Trade Journal | P1 | Trade history |
| 10 | Smart Watchlist | P2 | User preferences, scores |
| 11 | Emotional State | P2 | Trading patterns, psychology |
| 12 | Genetic Optimizer | P2 | Backtesting engine |
| 13 | Predictive Confidence | P2 | ML confidence scores |
| 14 | NLP Scanner | P2 | NLP model |
| 15 | Multi-Timeframe | P2 | Chart data |
| 16 | Learning Path | P3 | Education content |
| 17 | Social Rooms | P3 | Real-time messaging |

### 3.2 Unicorn Score Calculation

```typescript
interface UnicornScore {
  total: number; // 0-100
  breakdown: {
    technicals: number; // 0-50
    sentiment: number;  // 0-25
    chronos: number;    // 0-25
  };
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: 'low' | 'medium' | 'high';
  signals: Signal[];
}

// Technical Score (50 points max)
// - EMA alignment: 10 pts
// - TTM Squeeze status: 10 pts
// - RSI position: 8 pts
// - MACD signal: 8 pts
// - Volume analysis: 7 pts
// - Support/Resistance: 7 pts

// Sentiment Score (25 points max)
// - News sentiment: 10 pts
// - Social sentiment: 8 pts
// - Institutional flow: 7 pts

// Chronos Score (25 points max)
// - Price forecast confidence: 15 pts
// - Direction alignment: 10 pts
```

### 3.3 Voice Trading Flow

```
User: "Hey AVA, buy 100 shares of SPY"

1. Wake word detection ("Hey AVA")
2. Speech-to-text (Deepgram)
3. Intent parsing (OpenAI/Claude)
4. Order construction
5. Confirmation prompt (TTS via ElevenLabs)
6. User confirms ("Yes" / "Confirm")
7. Order execution (Broker API)
8. Confirmation response (TTS)

States:
- Idle (listening for wake word)
- Listening (recording speech)
- Processing (STT + intent)
- Confirming (awaiting user confirmation)
- Executing (sending order)
- Complete (order filled)
- Error (retry or manual fallback)
```

---

## PHASE 4: INTEGRATION & POLISH

### 4.1 Animation Implementation

Every interaction should feel ALIVE. Use spring physics.

```typescript
// React Native (Reanimated 3)
const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

// Web (Framer Motion)
const springTransition = {
  type: "spring",
  damping: 15,
  stiffness: 150,
};

// CSS fallback
const springEasing = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
```

### 4.2 Haptic Feedback (Mobile)

```typescript
// iOS Haptics
import * as Haptics from 'expo-haptics';

const haptics = {
  buttonTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  tabSwitch: () => Haptics.selectionAsync(),
  tradeExecute: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  profitCelebration: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  alertTrigger: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
```

### 4.3 Celebration Moments

When user has a profitable trade close:
1. Confetti animation (green particles)
2. Success haptic
3. Score ring pulse
4. Toast notification with P&L

When score > 90:
1. Rainbow ring glow
2. Unicorn sparkle sound
3. Special badge animation

### 4.4 Loading States

Every component needs:
- Skeleton state (pulsing gray shapes)
- Error state (retry button)
- Empty state (helpful message)

---

## PHASE 5: QUALITY ASSURANCE

### 5.1 Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| App Launch | < 2s cold start | Flipper/Performance Monitor |
| Tab Switch | < 100ms | React DevTools |
| Score Calc | < 500ms | API timing |
| Voice Response | < 1s | End-to-end timing |
| Chart FPS | 60 FPS | Performance Monitor |
| Animation FPS | 60 FPS | React DevTools |
| Bundle Size | < 5MB (mobile) | Metro bundler |
| TTI (web) | < 3s | Lighthouse |

### 5.2 Testing Requirements

- [ ] Unit tests for all utilities
- [ ] Component tests for all UI components
- [ ] Integration tests for critical flows
- [ ] E2E tests for:
  - [ ] User authentication
  - [ ] Order placement
  - [ ] Voice trading
  - [ ] Score calculation
  - [ ] Real-time updates

### 5.3 Accessibility

- [ ] Screen reader support
- [ ] Keyboard navigation (web)
- [ ] Color contrast (WCAG AA)
- [ ] Touch targets (44px minimum)
- [ ] Reduce motion option

---

## REFERENCE DOCUMENTS

1. **iAVA-ULTIMATE-DESIGN-SYSTEM.html** - Complete design tokens, components, colors, typography
2. **iAVA-ULTIMATE-LEGENDARY-MOBILE.html** - Mobile UI reference (5 tabs, all states)
3. **iAVA-LEGENDARY-DESKTOP.html** - Desktop UI reference (4-column layout)
4. **iAVA-LEGENDARY-MASTER-PLAN.docx** - Strategic overview, feature list, roadmap

---

## CRITICAL REMINDERS

### DO:
- ✅ Audit existing codebase FIRST
- ✅ Use design tokens from tokens.ts - NEVER hardcode
- ✅ Match the previews PIXEL-FOR-PIXEL
- ✅ Implement spring physics for all animations
- ✅ Add haptic feedback on mobile
- ✅ Create loading/error/empty states for everything
- ✅ Test on real devices
- ✅ Optimize for 60 FPS
- ✅ Document as you build

### DON'T:
- ❌ Skip the audit phase
- ❌ Hardcode colors, spacing, or fonts
- ❌ Use linear easing (always spring)
- ❌ Forget mobile haptics
- ❌ Ship without loading states
- ❌ Ignore performance
- ❌ Cut corners on animations

---

## EXECUTION CHECKLIST

```markdown
## Phase 0: Audit
- [ ] Discovered frontend framework
- [ ] Discovered backend framework
- [ ] Mapped existing components
- [ ] Identified gaps

## Phase 1: Design System
- [ ] Created tokens.ts
- [ ] Built Button component
- [ ] Built Input component
- [ ] Built Card component
- [ ] Built Badge component
- [ ] Built ScoreRing component
- [ ] Built Logo component
- [ ] Built TabBar component
- [ ] Built all other components

## Phase 2: Screens
- [ ] Trade tab complete
- [ ] Discover tab complete
- [ ] AI Hub tab complete
- [ ] Portfolio tab complete
- [ ] You tab complete
- [ ] Desktop layout complete

## Phase 3: Features
- [ ] Unicorn Score working
- [ ] AVA Mind integrated
- [ ] Chronos Forecast working
- [ ] Voice Trading working
- [ ] All 17 features functional

## Phase 4: Polish
- [ ] All animations spring-based
- [ ] Haptics implemented
- [ ] Celebrations working
- [ ] Loading states complete
- [ ] Error states complete

## Phase 5: QA
- [ ] Performance targets met
- [ ] Tests passing
- [ ] Accessibility checked
- [ ] Real device testing done
```

---

## FINAL WORDS

You are building something LEGENDARY. This is not another trading app. This is the future. Every line of code matters. Every pixel matters. Every millisecond matters.

When you're done, Robinhood should look like a children's toy. TradingView should feel outdated. Webull should seem cluttered.

iAVA.ai is the AI partner every trader wishes they had.

Now go build something LEGENDARY. 🦄

---

*Document Version: 3.0*
*Last Updated: November 2025*
*Classification: CONFIDENTIAL - IMPLEMENTATION GUIDE*
