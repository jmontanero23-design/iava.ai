/**
 * Ultra Elite++ GPT-5 Model Selector
 *
 * Intelligently selects the most appropriate GPT-5 model based on:
 * - Task complexity
 * - Required capabilities
 * - Cost optimization
 * - Response time requirements
 *
 * Model Tiers:
 * - GPT-5: Complex reasoning, optimization, multi-step analysis ($0.15/1K tokens)
 * - GPT-5-mini: Medium tasks, pattern recognition, analysis ($0.015/1K tokens)
 * - GPT-5-nano: Simple queries, formatting, basic responses ($0.003/1K tokens)
 */

// Model definitions with capabilities and costs
export const GPT5_MODELS = {
  COMPLEX: 'gpt-5',        // Flagship model for complex tasks
  MEDIUM: 'gpt-5-mini',    // Balanced performance/cost
  SIMPLE: 'gpt-5-nano'     // Fast, cheap for simple tasks
}

// Task complexity patterns
const TASK_PATTERNS = {
  // Complex tasks requiring GPT-5
  complex: [
    /portfolio\s+optimi/i,
    /risk\s+manage/i,
    /strategy\s+generat/i,
    /multi.*analysis/i,
    /advanced\s+reasoning/i,
    /complex\s+calculation/i,
    /machine\s+learning/i,
    /deep\s+analysis/i,
    /comprehensive\s+report/i,
    /correlation\s+matrix/i,
    /monte\s+carlo/i,
    /black.*scholes/i,
    /option\s+pricing/i,
    /market\s+microstructure/i,
    /order\s+flow\s+analysis/i,
    /harmonic\s+pattern/i,
    /elliott\s+wave/i,
    /advanced\s+technical/i
  ],

  // Medium tasks for GPT-5-mini
  medium: [
    /pattern\s+detect/i,
    /chart\s+analysis/i,
    /technical\s+indicator/i,
    /trade\s+journal/i,
    /market\s+trend/i,
    /support.*resistance/i,
    /volume\s+profile/i,
    /price\s+action/i,
    /momentum\s+analysis/i,
    /volatility\s+analysis/i,
    /sector\s+rotation/i,
    /market\s+regime/i,
    /greeks\s+calculation/i,
    /order\s+book/i,
    /level\s+2/i,
    /depth\s+analysis/i,
    /smart\s+alert/i,
    /prediction/i,
    /forecast/i
  ],

  // Simple tasks for GPT-5-nano
  simple: [
    /sentiment/i,
    /summary/i,
    /quick\s+question/i,
    /basic\s+calculation/i,
    /format/i,
    /explain\s+briefly/i,
    /yes\s+or\s+no/i,
    /simple\s+answer/i,
    /define/i,
    /what\s+is/i,
    /help\s+text/i,
    /error\s+message/i,
    /status\s+update/i,
    /confirmation/i,
    /validation/i,
    /symbol\s+lookup/i,
    /price\s+alert/i,
    /news\s+headline/i
  ]
}

// Feature-to-model mapping for specific components
const FEATURE_MODEL_MAP = {
  // Complex features → GPT-5
  'ava-mind-reasoning': GPT5_MODELS.COMPLEX,
  'portfolio-optimization': GPT5_MODELS.COMPLEX,
  'ai-copilot-complex': GPT5_MODELS.COMPLEX,
  'harmonic-patterns': GPT5_MODELS.COMPLEX,
  'strategy-generation': GPT5_MODELS.COMPLEX,
  'risk-analysis': GPT5_MODELS.COMPLEX,
  'market-structure': GPT5_MODELS.COMPLEX,
  'multi-timeframe': GPT5_MODELS.COMPLEX,

  // Medium features → GPT-5-mini
  'options-greeks': GPT5_MODELS.MEDIUM,
  'level2-analysis': GPT5_MODELS.MEDIUM,
  'volume-profile': GPT5_MODELS.MEDIUM,
  'chart-patterns': GPT5_MODELS.MEDIUM,
  'trade-journal': GPT5_MODELS.MEDIUM,
  'smart-alerts': GPT5_MODELS.MEDIUM,
  'technical-analysis': GPT5_MODELS.MEDIUM,
  'price-action': GPT5_MODELS.MEDIUM,
  'trend-analysis': GPT5_MODELS.MEDIUM,
  'momentum': GPT5_MODELS.MEDIUM,
  'volatility': GPT5_MODELS.MEDIUM,
  'sector-rotation': GPT5_MODELS.MEDIUM,
  'correlation': GPT5_MODELS.MEDIUM,
  'market-regime': GPT5_MODELS.MEDIUM,
  'order-flow': GPT5_MODELS.MEDIUM,

  // Simple features → GPT-5-nano
  'sentiment-quick': GPT5_MODELS.SIMPLE,
  'trade-suggestion': GPT5_MODELS.SIMPLE,
  'basic-qa': GPT5_MODELS.SIMPLE,
  'symbol-lookup': GPT5_MODELS.SIMPLE,
  'news-summary': GPT5_MODELS.SIMPLE,
  'price-alerts': GPT5_MODELS.SIMPLE,
  'calculations': GPT5_MODELS.SIMPLE,
  'ui-help': GPT5_MODELS.SIMPLE,
  'error-explain': GPT5_MODELS.SIMPLE,
  'status-message': GPT5_MODELS.SIMPLE,
  'confirmation': GPT5_MODELS.SIMPLE,
  'validation': GPT5_MODELS.SIMPLE
}

/**
 * Intelligently select the appropriate GPT-5 model
 * @param {Object} options - Selection options
 * @param {string} options.prompt - The prompt to analyze
 * @param {string} options.feature - Feature identifier (optional)
 * @param {number} options.maxTokens - Maximum expected tokens
 * @param {string} options.preferredModel - Override model selection
 * @param {boolean} options.requireSpeed - Prioritize speed over capability
 * @param {boolean} options.requireAccuracy - Prioritize accuracy over cost
 * @returns {Object} Model selection with reasoning
 */
export function selectGPT5Model(options = {}) {
  const {
    prompt = '',
    feature = null,
    maxTokens = 500,
    preferredModel = null,
    requireSpeed = false,
    requireAccuracy = false
  } = options

  // Use preferred model if specified
  if (preferredModel && Object.values(GPT5_MODELS).includes(preferredModel)) {
    return {
      model: preferredModel,
      reasoning: 'User preference override',
      estimatedCost: calculateCost(preferredModel, maxTokens)
    }
  }

  // Check feature-specific mapping first
  if (feature && FEATURE_MODEL_MAP[feature]) {
    const model = FEATURE_MODEL_MAP[feature]

    // Override for speed requirements
    if (requireSpeed && model === GPT5_MODELS.COMPLEX) {
      return {
        model: GPT5_MODELS.MEDIUM,
        reasoning: `Feature ${feature} downgraded for speed`,
        estimatedCost: calculateCost(GPT5_MODELS.MEDIUM, maxTokens)
      }
    }

    // Override for accuracy requirements
    if (requireAccuracy && model === GPT5_MODELS.SIMPLE) {
      return {
        model: GPT5_MODELS.MEDIUM,
        reasoning: `Feature ${feature} upgraded for accuracy`,
        estimatedCost: calculateCost(GPT5_MODELS.MEDIUM, maxTokens)
      }
    }

    return {
      model,
      reasoning: `Feature-specific: ${feature}`,
      estimatedCost: calculateCost(model, maxTokens)
    }
  }

  // Analyze prompt complexity
  const promptLower = prompt.toLowerCase()
  const promptLength = prompt.length
  const promptWords = prompt.split(/\s+/).length

  // Check for complex patterns
  for (const pattern of TASK_PATTERNS.complex) {
    if (pattern.test(promptLower)) {
      if (requireSpeed) {
        return {
          model: GPT5_MODELS.MEDIUM,
          reasoning: `Complex task (${pattern}) but speed required`,
          estimatedCost: calculateCost(GPT5_MODELS.MEDIUM, maxTokens)
        }
      }
      return {
        model: GPT5_MODELS.COMPLEX,
        reasoning: `Complex pattern detected: ${pattern}`,
        estimatedCost: calculateCost(GPT5_MODELS.COMPLEX, maxTokens)
      }
    }
  }

  // Check for simple patterns
  for (const pattern of TASK_PATTERNS.simple) {
    if (pattern.test(promptLower)) {
      if (requireAccuracy) {
        return {
          model: GPT5_MODELS.MEDIUM,
          reasoning: `Simple task (${pattern}) but accuracy required`,
          estimatedCost: calculateCost(GPT5_MODELS.MEDIUM, maxTokens)
        }
      }
      return {
        model: GPT5_MODELS.SIMPLE,
        reasoning: `Simple pattern detected: ${pattern}`,
        estimatedCost: calculateCost(GPT5_MODELS.SIMPLE, maxTokens)
      }
    }
  }

  // Check for medium patterns
  for (const pattern of TASK_PATTERNS.medium) {
    if (pattern.test(promptLower)) {
      return {
        model: GPT5_MODELS.MEDIUM,
        reasoning: `Medium pattern detected: ${pattern}`,
        estimatedCost: calculateCost(GPT5_MODELS.MEDIUM, maxTokens)
      }
    }
  }

  // Heuristic-based selection if no patterns match

  // Very long prompts usually indicate complex tasks
  if (promptLength > 2000 || promptWords > 300) {
    return {
      model: GPT5_MODELS.COMPLEX,
      reasoning: 'Long prompt indicates complex task',
      estimatedCost: calculateCost(GPT5_MODELS.COMPLEX, maxTokens)
    }
  }

  // Short prompts are usually simple
  if (promptLength < 200 && promptWords < 30) {
    return {
      model: GPT5_MODELS.SIMPLE,
      reasoning: 'Short prompt indicates simple task',
      estimatedCost: calculateCost(GPT5_MODELS.SIMPLE, maxTokens)
    }
  }

  // Check for specific keywords indicating complexity
  const complexKeywords = ['analyze', 'optimize', 'calculate', 'predict', 'recommend', 'evaluate', 'compare']
  const hasComplexKeywords = complexKeywords.some(keyword => promptLower.includes(keyword))

  if (hasComplexKeywords && maxTokens > 1000) {
    return {
      model: GPT5_MODELS.COMPLEX,
      reasoning: 'Complex keywords with large token requirement',
      estimatedCost: calculateCost(GPT5_MODELS.COMPLEX, maxTokens)
    }
  }

  // Default to medium for moderate complexity
  return {
    model: GPT5_MODELS.MEDIUM,
    reasoning: 'Default selection for moderate complexity',
    estimatedCost: calculateCost(GPT5_MODELS.MEDIUM, maxTokens)
  }
}

/**
 * Calculate estimated cost for a model and token count
 * @param {string} model - GPT-5 model identifier
 * @param {number} tokens - Estimated token count
 * @returns {number} Estimated cost in USD
 */
function calculateCost(model, tokens) {
  const costs = {
    [GPT5_MODELS.COMPLEX]: 0.15,   // $0.15 per 1K tokens
    [GPT5_MODELS.MEDIUM]: 0.015,   // $0.015 per 1K tokens
    [GPT5_MODELS.SIMPLE]: 0.003    // $0.003 per 1K tokens
  }

  return (tokens / 1000) * (costs[model] || costs[GPT5_MODELS.MEDIUM])
}

/**
 * Get model recommendations for a list of features
 * @param {Array<string>} features - List of feature identifiers
 * @returns {Object} Model usage breakdown and cost estimates
 */
export function getModelRecommendations(features) {
  const recommendations = {}
  let totalCost = 0
  let breakdown = {
    [GPT5_MODELS.COMPLEX]: [],
    [GPT5_MODELS.MEDIUM]: [],
    [GPT5_MODELS.SIMPLE]: []
  }

  for (const feature of features) {
    const result = selectGPT5Model({ feature })
    recommendations[feature] = result
    totalCost += result.estimatedCost
    breakdown[result.model].push(feature)
  }

  return {
    recommendations,
    totalCost,
    breakdown,
    savings: {
      vsGPT4o: totalCost * 5.67,  // GPT-4o is ~5.67x more expensive on average
      percentage: '82.4%'
    }
  }
}

/**
 * Validate model selection against usage patterns
 * @param {string} model - Selected model
 * @param {Object} usage - Usage statistics
 * @returns {boolean} Whether the selection is appropriate
 */
export function validateModelSelection(model, usage) {
  const { responseTime, accuracy, tokenCount } = usage

  // Complex model validation
  if (model === GPT5_MODELS.COMPLEX) {
    return tokenCount > 500 || accuracy > 0.9
  }

  // Simple model validation
  if (model === GPT5_MODELS.SIMPLE) {
    return tokenCount < 200 && responseTime < 1000
  }

  // Medium model is always valid (balanced choice)
  return true
}

/**
 * Migrate from GPT-4o to GPT-5 models
 * @param {string} oldModel - Current model (e.g., 'gpt-4o')
 * @param {string} context - Usage context
 * @returns {string} Recommended GPT-5 model
 */
export function migrateFromGPT4(oldModel, context = '') {
  // Direct migration mappings
  const migrationMap = {
    'gpt-4o': GPT5_MODELS.MEDIUM,       // General purpose → balanced
    'gpt-4-turbo': GPT5_MODELS.COMPLEX, // High capability → complex
    'gpt-4': GPT5_MODELS.COMPLEX,       // Original GPT-4 → complex
    'gpt-3.5-turbo': GPT5_MODELS.SIMPLE // Fast/cheap → nano
  }

  return migrationMap[oldModel] || GPT5_MODELS.MEDIUM
}

// Export all models for direct import
export default {
  GPT5_MODELS,
  selectGPT5Model,
  getModelRecommendations,
  validateModelSelection,
  migrateFromGPT4
}