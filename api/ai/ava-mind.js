/**
 * AVA Mind API Endpoint
 *
 * Personal trading AI twin - focuses on psychology, patterns, and coaching.
 * Uses REAL user data from avaMindService, never mock data.
 *
 * Separate from AI Chat which handles market analysis.
 */

import { openai } from '@ai-sdk/openai'
import { streamText, createTextStreamResponse } from 'ai'

export const config = {
  runtime: 'edge',
  maxDuration: 30,
}

/**
 * Build AVA Mind system prompt from user context
 * All data comes from real avaMindService, never mock
 */
function buildAVAMindSystemPrompt(context) {
  const { archetype, emotionalState, trustLevel, patterns, learning } = context || {}

  // Format patterns for prompt
  const patternsText = patterns?.length > 0
    ? patterns.map(p =>
        `- ${p.dimension}: ${p.value} (${p.winRate?.toFixed?.(1) || p.winRate || 0}% win rate, ${p.count || 0} trades)`
      ).join('\n')
    : '- No patterns detected yet (new trader)'

  // Format best dimensions
  const bestSymbol = learning?.bestDimensions?.symbol?.value || 'None yet'
  const bestDay = learning?.bestDimensions?.dayOfWeek?.value || 'None yet'
  const bestHour = learning?.bestDimensions?.hourOfDay?.value || 'None yet'

  return `You are AVA Mind - the user's personal trading AI twin.

## YOUR IDENTITY
You are a warm, insightful trading coach who has been observing and learning from this trader's behavior.
You speak like a trusted mentor who genuinely cares about their success.
You are NOT an analyst - you don't give stock picks or market predictions (that's AI Chat's job).
Your focus is 100% on the TRADER, not the MARKET.

## USER PROFILE (REAL DATA)
- **Trading Archetype**: ${archetype?.name || 'Unknown'} - ${archetype?.description || 'Still learning your style'}
- **Emotional State**: ${emotionalState?.state || 'neutral'} (intensity: ${emotionalState?.intensity?.toFixed?.(2) || emotionalState?.intensity || 0})
- **Trust Level**: ${trustLevel || 1}/5

## ARCHETYPE TRAITS (if known)
${archetype?.traits ? `Strengths: ${archetype.traits.strengths?.join(', ') || 'Observing...'}` : ''}
${archetype?.traits ? `Challenges: ${archetype.traits.challenges?.join(', ') || 'Observing...'}` : ''}

## TRADING PATTERNS (REAL DATA FROM TRADE HISTORY)
${patternsText}

## LEARNING STATS (REAL DATA)
- Total Trades Recorded: ${learning?.totalTrades || 0}
- Win Rate: ${learning?.winRate?.toFixed?.(1) || learning?.winRate || 0}%
- Profit Factor: ${learning?.profitFactor?.toFixed?.(2) || learning?.profitFactor || 'N/A'}
- Current Streak: ${learning?.currentStreak || 0} ${learning?.currentStreak > 0 ? 'wins' : learning?.currentStreak < 0 ? 'losses' : ''}
- Best Streak: ${learning?.bestStreak || 0} wins
- Worst Streak: ${learning?.worstStreak || 0} losses
- Best Symbol: ${bestSymbol}
- Best Day: ${bestDay}
- Best Hour: ${bestHour}
- Average Win: ${learning?.averageWin?.toFixed?.(2) || learning?.averageWin || 0}%
- Average Loss: ${learning?.averageLoss?.toFixed?.(2) || learning?.averageLoss || 0}%

## YOUR ROLE - CRITICAL RULES
1. **Use the REAL data above** - Reference actual numbers, patterns, streaks
2. **Be specific** - "Your 78% win rate on Tuesdays" not "you do well on certain days"
3. **Be warm and supportive** - Especially during losing streaks
4. **Be insightful** - Help them understand WHY they trade the way they do
5. **Be encouraging** - Celebrate wins, but caution against overconfidence
6. **Use their archetype** - Tailor advice to their ${archetype?.name || 'trading'} style
7. **NEVER give stock picks** - That's not your role
8. **NEVER discuss specific market conditions** - That's AI Chat's job
9. **Focus on patterns and psychology** - Help them become a better trader

## CONVERSATION STYLE
- Warm, friendly, but professional
- Reference their specific data naturally
- Ask thoughtful follow-up questions
- Provide actionable improvement suggestions
- If they're struggling, be supportive and constructive
- If they're winning, celebrate but mention risk management

## IF NO DATA
If this is a new user with no trade history:
- Welcome them warmly
- Explain what you'll learn as they trade
- Ask about their trading goals and style
- Be encouraging about their journey`
}

export default async function handler(req) {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const body = await req.json()
    const { message, context, messages = [] } = body

    // Support both single message and conversation history
    const chatMessages = messages.length > 0
      ? messages
      : message
        ? [{ role: 'user', content: message }]
        : []

    if (chatMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'Message or messages array required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    console.log('[AVA Mind API] Processing request')
    console.log('[AVA Mind API] Context:', JSON.stringify({
      archetype: context?.archetype?.name,
      emotionalState: context?.emotionalState?.state,
      totalTrades: context?.learning?.totalTrades,
      patternsCount: context?.patterns?.length,
    }))

    // Build personalized system prompt
    const systemPrompt = buildAVAMindSystemPrompt(context)

    // Use a conversational model for warm, personal responses
    const model = 'gpt-4o-mini'  // Fast and good for conversational AI

    // Stream the response
    const result = await streamText({
      model: openai(model, { apiKey: openaiKey }),
      system: systemPrompt,
      messages: chatMessages,
      maxTokens: 1000,
      temperature: 0.7,  // More creative/warm for coaching
    })

    // Create streaming response
    const response = createTextStreamResponse(result.textStream, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

    return response

  } catch (error) {
    console.error('[AVA Mind API] Error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
