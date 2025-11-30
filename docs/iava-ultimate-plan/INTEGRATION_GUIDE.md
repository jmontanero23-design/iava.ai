# iAVA Personalized Score Integration Guide
## From Blueprint to Production

---

## Overview

This guide walks you through integrating the PersonalizedScoreService with your existing iAVA codebase. The integration respects your existing Unicorn Score system while adding the personality layer.

---

## Files Included

```
iava-ultimate-plan/
├── ULTIMATE_INTEGRATION_BLUEPRINT.md     # Complete architecture document
├── INTEGRATION_GUIDE.md                  # This file
└── src/
    └── services/
        └── ai/
            └── PersonalizedScoreService.js  # The main integration service
```

---

## Step 1: Add PersonalizedScoreService to Your Project

Copy the service file to your existing codebase:

```bash
# From your iAVA project root
cp PersonalizedScoreService.js src/services/ai/PersonalizedScoreService.js
```

---

## Step 2: Integration with UnicornScorePanel.jsx

This is the PRIMARY integration point where personality meets Unicorn Score.

### 2.1 Import the Service

```javascript
// In src/components/UnicornScorePanel.jsx
import { personalizedScoreService } from '../services/ai/PersonalizedScoreService.js';
```

### 2.2 Add State for Personalized Data

```javascript
const [personalizedSignal, setPersonalizedSignal] = useState(null);
```

### 2.3 Get Personalized Signal After Unicorn Score Calculation

```javascript
// In your useEffect or wherever you calculate Unicorn Score
useEffect(() => {
  if (unicornResult && unicornResult.ultraUnicornScore) {
    // Get personalized interpretation
    const personalized = personalizedScoreService.getPersonalizedSignal(
      unicornResult,
      symbol,
      currentPrice
    );
    setPersonalizedSignal(personalized);
  }
}, [unicornResult, symbol, currentPrice]);
```

### 2.4 Display Archetype Badge in Panel Header

```jsx
// In your panel header section
<div className="flex items-center justify-between">
  <h3 className="text-lg font-semibold">🦄 Unicorn Score</h3>
  
  {/* NEW: Archetype Badge */}
  {personalizedSignal && (
    <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full">
      <span>{personalizedSignal.context.archetypeIcon}</span>
      <span className="text-sm text-purple-300">
        {personalizedSignal.context.archetype}
      </span>
    </div>
  )}
</div>
```

### 2.5 Add Personalized Message Section

```jsx
// Below your existing score display
{personalizedSignal && (
  <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
    <div className="flex items-start gap-3">
      <span className="text-2xl">
        {personalizedSignal.context.archetypeIcon}
      </span>
      <div>
        <p className="text-sm text-slate-300">
          {personalizedSignal.avaMessage}
        </p>
        
        {/* Warnings */}
        {personalizedSignal.personalized.warnings.map((warning, i) => (
          <div 
            key={i}
            className={`mt-2 p-2 rounded text-sm ${
              warning.severity === 'high' 
                ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            ⚠️ {warning.message}
          </div>
        ))}
        
        {/* Encouragements */}
        {personalizedSignal.personalized.encouragements.map((enc, i) => (
          <div 
            key={i}
            className="mt-2 p-2 rounded text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          >
            ✅ {enc.message}
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

---

## Step 3: Integration with AI Chat

### 3.1 Add Personality Context to System Prompt

```javascript
// In src/utils/aiContext.js or wherever you build AI prompts

import { personalizedScoreService } from '../services/ai/PersonalizedScoreService.js';

export function generateTradingSystemPrompt(baseContext) {
  // Get personality context
  const personalityContext = personalizedScoreService.getAIContextString();
  
  return `
${baseContext}

${personalityContext}

Remember to adapt your communication style based on the user's archetype and emotional state described above.
  `.trim();
}
```

### 3.2 Make AI Responses Archetype-Aware

The AI context string includes archetype-specific style instructions. Your AI responses will automatically adapt to:

- **Surgeon**: Technical, precise language
- **Sniper**: Direct, high-conviction recommendations
- **Momentum Rider**: Energetic, trend-focused
- **Contrarian**: Counter-arguments, sentiment analysis
- **Guardian**: Risk-focused, capital preservation
- **Hunter**: Bold, aggressive opportunities

---

## Step 4: Integration with Trade Execution

### 4.1 Pre-Trade Validation

```javascript
// In your order execution flow
import { personalizedScoreService } from '../services/ai/PersonalizedScoreService.js';

async function executeOrder(order, unicornResult) {
  // Get personalized signal
  const personalized = personalizedScoreService.getPersonalizedSignal(
    unicornResult,
    order.symbol,
    order.price
  );
  
  // Check if confirmation required
  if (personalized.personalized.requiresConfirmation) {
    // Show confirmation modal with warnings
    const confirmed = await showConfirmationModal({
      order,
      personalized,
      warnings: personalized.personalized.warnings
    });
    
    if (!confirmed) return { cancelled: true };
  }
  
  // Optionally apply recommended position size
  const adjustedOrder = {
    ...order,
    suggestedSize: personalized.personalized.positionSize,
    suggestedStop: personalized.personalized.stopLoss,
    suggestedTarget: personalized.personalized.takeProfit
  };
  
  // Proceed with execution
  return await alpaca.submitOrder(adjustedOrder);
}
```

### 4.2 Position Size Recommendation Display

```jsx
// In TradePanel.jsx or order entry component
{personalizedSignal && (
  <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
    <div className="text-xs text-slate-400 mb-1">AVA Recommends</div>
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div>
        <div className="text-slate-400">Position</div>
        <div className="text-emerald-400 font-medium">
          {personalizedSignal.personalized.positionPercent}
        </div>
      </div>
      <div>
        <div className="text-slate-400">Stop</div>
        <div className="text-red-400 font-medium">
          {personalizedSignal.personalized.stopLossPercent}
        </div>
      </div>
      <div>
        <div className="text-slate-400">Target</div>
        <div className="text-emerald-400 font-medium">
          {personalizedSignal.personalized.takeProfitPercent}
        </div>
      </div>
    </div>
  </div>
)}
```

---

## Step 5: Emotional State Badge in Header

### 5.1 Add Badge Component

```jsx
// In src/components/EmotionalStateBadge.jsx (or inline in Header)

const EMOTIONAL_BADGE_STYLES = {
  Confident: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: '🔥' },
  Cautious: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '⚠️' },
  Frustrated: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '😤' },
  Fearful: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: '😰' },
  Greedy: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '🤑' },
  Neutral: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: '😐' },
  Exhausted: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '😴' }
};

function EmotionalStateBadge({ state }) {
  const style = EMOTIONAL_BADGE_STYLES[state] || EMOTIONAL_BADGE_STYLES.Neutral;
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
      <span>{style.icon}</span>
      <span className="text-xs font-medium">{state}</span>
    </div>
  );
}
```

### 5.2 Add to Header

```jsx
// In your Header or AppHeader component
import { personalizedScoreService } from '../services/ai/PersonalizedScoreService.js';

function Header() {
  const [emotionalState, setEmotionalState] = useState('Neutral');
  
  useEffect(() => {
    // Get emotional state from service
    const context = personalizedScoreService.getAIContextString();
    // Extract state (or call detectEmotionalState directly)
    // This is simplified - in production you'd expose detectEmotionalState
    setEmotionalState(/* detected state */);
  }, [/* dependencies */]);
  
  return (
    <header className="...">
      {/* Other header content */}
      
      <EmotionalStateBadge state={emotionalState} />
    </header>
  );
}
```

---

## Step 6: Add Trade Logging for Emotional Detection

The emotional state detection requires trade history. Add trade logging:

```javascript
// After each trade execution
function logTrade(trade) {
  const STORAGE_KEY = 'ava.mind.trades';
  
  const trades = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  
  trades.push({
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    timestamp: new Date().toISOString(),
    outcome: trade.outcome, // 'win', 'loss', 'breakeven'
    pnlPercent: trade.pnlPercent,
    unicornScore: trade.unicornScore
  });
  
  // Keep last 100 trades
  const trimmed = trades.slice(-100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}
```

---

## Step 7: Dependencies on Wave 1 Features

The PersonalizedScoreService works best with Wave 1 personality features. If you haven't integrated Wave 1 yet:

### 7.1 Required Wave 1 Files

```
src/services/avaMindPersonality.js       # Personality system
src/components/ava-mind/ArchetypeReveal.jsx
src/components/ava-mind/EmotionalStateBadge.jsx
```

### 7.2 Personality Initialization

The service reads from `ava.mind.personality` localStorage key. Initialize with defaults or onboarding quiz:

```javascript
// Initial personality (or from onboarding quiz)
const defaultPersonality = {
  riskTolerance: 50,
  patience: 50,
  lossAversion: 50,
  fomo: 50,
  analyticalVsIntuitive: 50,
  independenceVsConformity: 50,
  convictionLevel: 50,
  adaptability: 50
};

localStorage.setItem('ava.mind.personality', JSON.stringify(defaultPersonality));
```

---

## Quick Reference: Service Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `getPersonalizedSignal(unicornResult, symbol, price)` | Full personalization | `{objective, personalized, context, avaMessage, action}` |
| `getRecommendedPositionSize(score, classification)` | Quick position size | `number` (0-0.25) |
| `getAIContextString()` | AI prompt injection | `string` |

---

## Testing the Integration

### 1. Verify Archetype Detection

```javascript
import { personalizedScoreService } from './services/ai/PersonalizedScoreService.js';

// Set test personality
localStorage.setItem('ava.mind.personality', JSON.stringify({
  riskTolerance: 30,
  patience: 80,
  lossAversion: 70,
  fomo: 20,
  analyticalVsIntuitive: 80,
  independenceVsConformity: 40,
  convictionLevel: 60,
  adaptability: 40
}));

// Get personalized signal
const signal = personalizedScoreService.getPersonalizedSignal(
  { ultraUnicornScore: 85, direction: 'LONG', classification: 'Strong' },
  'NVDA',
  140
);

console.log('Archetype:', signal.context.archetype);
console.log('Position:', signal.personalized.positionPercent);
console.log('Message:', signal.avaMessage);
```

### 2. Verify Emotional State Detection

```javascript
// Set test trades (3-loss streak)
localStorage.setItem('ava.mind.trades', JSON.stringify([
  { outcome: 'win', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { outcome: 'loss', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { outcome: 'loss', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { outcome: 'loss', timestamp: new Date().toISOString() }
]));

const signal = personalizedScoreService.getPersonalizedSignal(/* ... */);
console.log('Emotional State:', signal.context.emotionalState);
// Should be: 'Frustrated'
```

---

## Production Checklist

- [ ] PersonalizedScoreService.js added to project
- [ ] UnicornScorePanel shows archetype badge
- [ ] Personalized message displays below score
- [ ] AI Chat receives personality context
- [ ] Trade execution checks for confirmation requirement
- [ ] Emotional state badge in header
- [ ] Trade logging implemented for emotional detection
- [ ] Wave 1 personality system integrated (if not already)
- [ ] Integration tested with various archetypes
- [ ] Emotional state detection tested with trade streaks

---

## What's Next?

After this integration, consider:

1. **Wave 2 Components**: Portfolio Health Score, Trust Mode Order Confirm
2. **Onboarding Quiz**: Help users discover their archetype
3. **Settings Page**: Let users adjust personality traits
4. **Analytics**: Track alignment between recommendations and outcomes

---

**Questions?** The complete architecture is documented in `ULTIMATE_INTEGRATION_BLUEPRINT.md`.
