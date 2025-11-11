/**
 * Genetic Algorithm Strategy Optimizer
 * Enhanced parameter tuning using evolutionary algorithms
 *
 * Features:
 * - Multi-objective optimization (maximize return, minimize drawdown, etc.)
 * - Population-based search with crossover and mutation
 * - Elite preservation (keep best performers)
 * - Adaptive mutation rates
 * - Parallel evaluation of candidates
 * - Constraint handling for realistic parameters
 */

/**
 * Parameter definitions with constraints
 */
const PARAMETER_SPACE = {
  threshold: {
    min: 0,
    max: 100,
    step: 1,
    type: 'integer',
    default: 50
  },
  horizon: {
    min: 1,
    max: 100,
    step: 1,
    type: 'integer',
    default: 20
  },
  atrMultiplier: {
    min: 0.5,
    max: 5.0,
    step: 0.1,
    type: 'float',
    default: 2.0
  },
  stopLoss: {
    min: 0.5,
    max: 10.0,
    step: 0.1,
    type: 'float',
    default: 2.0
  },
  takeProfit: {
    min: 1.0,
    max: 20.0,
    step: 0.5,
    type: 'float',
    default: 4.0
  },
  minADX: {
    min: 10,
    max: 50,
    step: 1,
    type: 'integer',
    default: 25
  },
  rsiOversold: {
    min: 10,
    max: 40,
    step: 1,
    type: 'integer',
    default: 30
  },
  rsiOverbought: {
    min: 60,
    max: 90,
    step: 1,
    type: 'integer',
    default: 70
  }
}

/**
 * Fitness function objectives
 */
const OBJECTIVES = {
  // Primary objective: maximize return
  return: (results) => results.avgReturn || 0,

  // Minimize drawdown
  drawdown: (results) => -(results.maxDrawdown || 0),

  // Maximize win rate
  winRate: (results) => results.winRate || 0,

  // Maximize profit factor
  profitFactor: (results) => results.profitFactor || 0,

  // Maximize Sharpe ratio
  sharpe: (results) => results.sharpeRatio || 0,

  // Minimize volatility
  volatility: (results) => -(results.volatility || 0),

  // Maximize number of trades (sample size)
  sampleSize: (results) => Math.log(results.trades || 1) / 10
}

/**
 * Create a random individual
 */
function createRandomIndividual(parameters = Object.keys(PARAMETER_SPACE)) {
  const individual = {}

  for (const param of parameters) {
    const def = PARAMETER_SPACE[param]
    if (!def) continue

    const range = def.max - def.min
    const steps = Math.floor(range / def.step)
    const randomStep = Math.floor(Math.random() * (steps + 1))

    let value = def.min + randomStep * def.step

    if (def.type === 'integer') {
      value = Math.round(value)
    } else {
      value = parseFloat(value.toFixed(2))
    }

    individual[param] = value
  }

  return individual
}

/**
 * Crossover (recombination) of two parents
 */
function crossover(parent1, parent2) {
  const child = {}
  const params = Object.keys(parent1)

  for (const param of params) {
    // Uniform crossover: randomly choose from either parent
    if (Math.random() < 0.5) {
      child[param] = parent1[param]
    } else {
      child[param] = parent2[param]
    }
  }

  return child
}

/**
 * Mutate an individual
 */
function mutate(individual, mutationRate = 0.1, generation = 0, maxGenerations = 50) {
  const mutated = { ...individual }

  // Adaptive mutation: higher mutation early on, lower later
  const adaptiveMutation = mutationRate * (1 - generation / maxGenerations * 0.7)

  for (const param of Object.keys(mutated)) {
    if (Math.random() < adaptiveMutation) {
      const def = PARAMETER_SPACE[param]
      if (!def) continue

      // Gaussian mutation around current value
      const sigma = (def.max - def.min) * 0.2 // 20% std dev
      const mutation = (Math.random() - 0.5) * 2 * sigma

      let newValue = mutated[param] + mutation

      // Constrain to bounds
      newValue = Math.max(def.min, Math.min(def.max, newValue))

      // Snap to step size
      newValue = Math.round(newValue / def.step) * def.step

      if (def.type === 'integer') {
        newValue = Math.round(newValue)
      } else {
        newValue = parseFloat(newValue.toFixed(2))
      }

      mutated[param] = newValue
    }
  }

  return mutated
}

/**
 * Calculate multi-objective fitness
 */
function calculateFitness(results, weights = {}) {
  const defaultWeights = {
    return: 0.3,
    drawdown: 0.15,
    winRate: 0.15,
    profitFactor: 0.2,
    sharpe: 0.15,
    sampleSize: 0.05
  }

  const w = { ...defaultWeights, ...weights }

  let fitness = 0

  for (const [objective, weight] of Object.entries(w)) {
    const objFunc = OBJECTIVES[objective]
    if (objFunc) {
      const value = objFunc(results)
      fitness += value * weight
    }
  }

  return fitness
}

/**
 * Tournament selection
 */
function tournamentSelect(population, tournamentSize = 3) {
  const tournament = []

  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length)
    tournament.push(population[idx])
  }

  // Return best individual from tournament
  tournament.sort((a, b) => b.fitness - a.fitness)
  return tournament[0]
}

/**
 * Main genetic algorithm
 */
export async function optimizeWithGA(options = {}) {
  const {
    parameters = Object.keys(PARAMETER_SPACE), // Which parameters to optimize
    evaluateFunction,  // async (params) => results
    populationSize = 20,
    generations = 30,
    eliteSize = 2,
    mutationRate = 0.15,
    weights = {},
    onProgress = null,
    seed = null
  } = options

  if (!evaluateFunction) {
    throw new Error('evaluateFunction is required')
  }

  // Initialize population
  let population = []

  if (seed && Array.isArray(seed)) {
    // Include seed individuals
    population = seed.map(ind => ({ ...ind }))
  }

  // Fill rest with random individuals
  while (population.length < populationSize) {
    population.push(createRandomIndividual(parameters))
  }

  const history = []
  let bestEver = null

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness for each individual
    const evaluations = await Promise.all(
      population.map(async (individual) => {
        const results = await evaluateFunction(individual)
        const fitness = calculateFitness(results, weights)
        return {
          params: individual,
          results,
          fitness
        }
      })
    )

    // Sort by fitness
    evaluations.sort((a, b) => b.fitness - a.fitness)

    // Track best ever
    if (!bestEver || evaluations[0].fitness > bestEver.fitness) {
      bestEver = evaluations[0]
    }

    // Record generation stats
    const genStats = {
      generation: gen,
      best: evaluations[0],
      avg: evaluations.reduce((sum, e) => sum + e.fitness, 0) / evaluations.length,
      worst: evaluations[evaluations.length - 1].fitness
    }

    history.push(genStats)

    if (onProgress) {
      onProgress(genStats)
    }

    // Early termination if converged
    if (gen > 10) {
      const recentBest = history.slice(-5).map(h => h.best.fitness)
      const variance = recentBest.reduce((sum, f) => sum + Math.pow(f - genStats.avg, 2), 0) / 5
      if (variance < 0.001) {
        console.log('[GA] Converged early at generation', gen)
        break
      }
    }

    // Create next generation
    const nextGen = []

    // Elitism: keep top performers
    for (let i = 0; i < eliteSize; i++) {
      nextGen.push({ ...evaluations[i].params })
    }

    // Generate offspring through crossover and mutation
    while (nextGen.length < populationSize) {
      const parent1 = tournamentSelect(evaluations)
      const parent2 = tournamentSelect(evaluations)

      let child = crossover(parent1.params, parent2.params)
      child = mutate(child, mutationRate, gen, generations)

      nextGen.push(child)
    }

    population = nextGen
  }

  return {
    best: bestEver,
    history,
    finalPopulation: population
  }
}

/**
 * Quick optimize using grid search (faster but less thorough)
 */
export async function quickOptimize(options = {}) {
  const {
    parameters = ['threshold', 'horizon'],
    evaluateFunction,
    gridPoints = 5,
    onProgress = null
  } = options

  if (!evaluateFunction) {
    throw new Error('evaluateFunction is required')
  }

  // Generate grid
  const grid = []
  const generateGrid = (params, current = {}, index = 0) => {
    if (index >= params.length) {
      grid.push({ ...current })
      return
    }

    const param = params[index]
    const def = PARAMETER_SPACE[param]
    const step = (def.max - def.min) / (gridPoints - 1)

    for (let i = 0; i < gridPoints; i++) {
      let value = def.min + step * i
      if (def.type === 'integer') {
        value = Math.round(value)
      }
      current[param] = value
      generateGrid(params, current, index + 1)
    }
  }

  generateGrid(parameters)

  // Evaluate all grid points
  const results = await Promise.all(
    grid.map(async (params, idx) => {
      const result = await evaluateFunction(params)
      const fitness = calculateFitness(result)

      if (onProgress) {
        onProgress({
          progress: (idx + 1) / grid.length,
          current: { params, result, fitness }
        })
      }

      return { params, result, fitness }
    })
  )

  // Sort by fitness
  results.sort((a, b) => b.fitness - a.fitness)

  return {
    best: results[0],
    all: results
  }
}

export default {
  optimizeWithGA,
  quickOptimize,
  PARAMETER_SPACE,
  OBJECTIVES,
  calculateFitness
}
