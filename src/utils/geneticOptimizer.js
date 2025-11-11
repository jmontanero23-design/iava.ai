/**
 * Genetic Algorithm Strategy Optimizer - PhD Elite Edition
 *
 * Comprehensive evolutionary optimization system with:
 * - NSGA-II multi-objective optimization
 * - Advanced selection methods (tournament, roulette, rank, SUS)
 * - Multiple crossover operators (uniform, SBX, arithmetic, blend)
 * - Advanced mutation strategies (polynomial, Cauchy, adaptive)
 * - Constraint handling and repair mechanisms
 * - Pareto frontier calculation
 * - Convergence analysis and diversity metrics
 * - Island model for parallel evolution
 * - Self-adaptive parameter control
 *
 * @module geneticOptimizer
 */

// ============================================================================
// PARAMETER SPACE DEFINITIONS
// ============================================================================

/**
 * Parameter definitions with constraints (ORIGINAL)
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
 * Fitness function objectives (ORIGINAL)
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

// ============================================================================
// MATHEMATICAL UTILITIES
// ============================================================================

/**
 * Box-Muller transform for Gaussian random numbers
 */
function randomGaussian(mean = 0, stdDev = 1) {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  return z0 * stdDev + mean
}

/**
 * Cauchy random number generator
 */
function randomCauchy(location = 0, scale = 1) {
  const u = Math.random()
  return location + scale * Math.tan(Math.PI * (u - 0.5))
}

/**
 * Calculate Euclidean distance between two parameter sets
 */
function euclideanDistance(params1, params2, parameterSpace) {
  let sumSquares = 0
  for (const key in params1) {
    const def = parameterSpace[key]
    if (!def) continue

    // Normalize to 0-1 range
    const range = def.max - def.min
    const norm1 = (params1[key] - def.min) / range
    const norm2 = (params2[key] - def.min) / range

    sumSquares += Math.pow(norm1 - norm2, 2)
  }
  return Math.sqrt(sumSquares)
}

/**
 * Calculate diversity of population
 */
function calculateDiversity(population, parameterSpace) {
  if (population.length < 2) return 0

  let totalDistance = 0
  let comparisons = 0

  for (let i = 0; i < population.length; i++) {
    for (let j = i + 1; j < population.length; j++) {
      totalDistance += euclideanDistance(
        population[i].params || population[i],
        population[j].params || population[j],
        parameterSpace
      )
      comparisons++
    }
  }

  return comparisons > 0 ? totalDistance / comparisons : 0
}

// ============================================================================
// INDIVIDUAL CREATION AND REPAIR
// ============================================================================

/**
 * Create a random individual (ORIGINAL)
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
 * Repair individual to satisfy constraints
 */
function repairIndividual(individual, parameterSpace = PARAMETER_SPACE) {
  const repaired = {}

  for (const [param, value] of Object.entries(individual)) {
    const def = parameterSpace[param]
    if (!def) {
      repaired[param] = value
      continue
    }

    // Clamp to bounds
    let repairedValue = Math.max(def.min, Math.min(def.max, value))

    // Snap to step size
    repairedValue = Math.round(repairedValue / def.step) * def.step

    // Type conversion
    if (def.type === 'integer') {
      repairedValue = Math.round(repairedValue)
    } else {
      repairedValue = parseFloat(repairedValue.toFixed(2))
    }

    repaired[param] = repairedValue
  }

  return repaired
}

/**
 * Check if individual satisfies custom constraints
 */
function checkConstraints(individual) {
  // Example custom constraints
  const constraints = []

  // Constraint: takeProfit should be > stopLoss
  if (individual.takeProfit && individual.stopLoss) {
    constraints.push(individual.takeProfit > individual.stopLoss)
  }

  // Constraint: rsiOverbought > rsiOversold
  if (individual.rsiOverbought && individual.rsiOversold) {
    constraints.push(individual.rsiOverbought > individual.rsiOversold)
  }

  return constraints.every(c => c)
}

/**
 * Apply penalty for constraint violations
 */
function constraintPenalty(individual) {
  let penalty = 0

  // Penalty for takeProfit <= stopLoss
  if (individual.takeProfit && individual.stopLoss) {
    if (individual.takeProfit <= individual.stopLoss) {
      penalty += 1000
    }
  }

  // Penalty for invalid RSI range
  if (individual.rsiOverbought && individual.rsiOversold) {
    if (individual.rsiOverbought <= individual.rsiOversold) {
      penalty += 500
    }
  }

  return penalty
}

// ============================================================================
// CROSSOVER OPERATORS
// ============================================================================

/**
 * Uniform crossover (ORIGINAL)
 */
function crossover(parent1, parent2) {
  const child = {}
  const params = Object.keys(parent1)

  for (const param of params) {
    if (Math.random() < 0.5) {
      child[param] = parent1[param]
    } else {
      child[param] = parent2[param]
    }
  }

  return child
}

/**
 * Single-point crossover
 */
function singlePointCrossover(parent1, parent2) {
  const params = Object.keys(parent1)
  const crossoverPoint = Math.floor(Math.random() * params.length)

  const child = {}

  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    if (i < crossoverPoint) {
      child[param] = parent1[param]
    } else {
      child[param] = parent2[param]
    }
  }

  return child
}

/**
 * Two-point crossover
 */
function twoPointCrossover(parent1, parent2) {
  const params = Object.keys(parent1)
  const point1 = Math.floor(Math.random() * params.length)
  const point2 = Math.floor(Math.random() * params.length)

  const start = Math.min(point1, point2)
  const end = Math.max(point1, point2)

  const child = {}

  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    if (i >= start && i < end) {
      child[param] = parent2[param]
    } else {
      child[param] = parent1[param]
    }
  }

  return child
}

/**
 * Simulated Binary Crossover (SBX)
 */
function simulatedBinaryCrossover(parent1, parent2, eta = 20) {
  const child1 = {}
  const child2 = {}

  for (const param of Object.keys(parent1)) {
    const def = PARAMETER_SPACE[param]
    if (!def) continue

    const p1 = parent1[param]
    const p2 = parent2[param]

    const u = Math.random()

    let beta
    if (u <= 0.5) {
      beta = Math.pow(2 * u, 1 / (eta + 1))
    } else {
      beta = Math.pow(1 / (2 * (1 - u)), 1 / (eta + 1))
    }

    const c1 = 0.5 * ((p1 + p2) - beta * Math.abs(p2 - p1))
    const c2 = 0.5 * ((p1 + p2) + beta * Math.abs(p2 - p1))

    child1[param] = c1
    child2[param] = c2
  }

  // Return one child randomly
  return Math.random() < 0.5
    ? repairIndividual(child1)
    : repairIndividual(child2)
}

/**
 * Arithmetic crossover
 */
function arithmeticCrossover(parent1, parent2, alpha = 0.5) {
  const child = {}

  for (const param of Object.keys(parent1)) {
    const p1 = parent1[param]
    const p2 = parent2[param]

    child[param] = alpha * p1 + (1 - alpha) * p2
  }

  return repairIndividual(child)
}

/**
 * Blend crossover (BLX-α)
 */
function blendCrossover(parent1, parent2, alpha = 0.5) {
  const child = {}

  for (const param of Object.keys(parent1)) {
    const p1 = parent1[param]
    const p2 = parent2[param]

    const min = Math.min(p1, p2)
    const max = Math.max(p1, p2)
    const range = max - min

    const lower = min - alpha * range
    const upper = max + alpha * range

    child[param] = lower + Math.random() * (upper - lower)
  }

  return repairIndividual(child)
}

// ============================================================================
// MUTATION OPERATORS
// ============================================================================

/**
 * Gaussian mutation (ORIGINAL - adaptive)
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
 * Polynomial mutation
 */
function polynomialMutation(individual, mutationRate = 0.1, eta = 20) {
  const mutated = { ...individual }

  for (const param of Object.keys(mutated)) {
    if (Math.random() < mutationRate) {
      const def = PARAMETER_SPACE[param]
      if (!def) continue

      const u = Math.random()
      const delta_l = (mutated[param] - def.min) / (def.max - def.min)
      const delta_u = (def.max - mutated[param]) / (def.max - def.min)

      let delta
      if (u <= 0.5) {
        const delta_q = Math.pow(2 * u + (1 - 2 * u) * Math.pow(1 - delta_l, eta + 1), 1 / (eta + 1)) - 1
        delta = delta_q * (mutated[param] - def.min)
      } else {
        const delta_q = 1 - Math.pow(2 * (1 - u) + 2 * (u - 0.5) * Math.pow(1 - delta_u, eta + 1), 1 / (eta + 1))
        delta = delta_q * (def.max - mutated[param])
      }

      mutated[param] = mutated[param] + delta
    }
  }

  return repairIndividual(mutated)
}

/**
 * Cauchy mutation (heavy-tailed distribution)
 */
function cauchyMutation(individual, mutationRate = 0.1, scale = 0.1) {
  const mutated = { ...individual }

  for (const param of Object.keys(mutated)) {
    if (Math.random() < mutationRate) {
      const def = PARAMETER_SPACE[param]
      if (!def) continue

      const range = def.max - def.min
      const mutation = randomCauchy(0, scale * range)

      mutated[param] = mutated[param] + mutation
    }
  }

  return repairIndividual(mutated)
}

/**
 * Non-uniform mutation
 */
function nonUniformMutation(individual, mutationRate = 0.1, generation = 0, maxGenerations = 50, b = 5) {
  const mutated = { ...individual }

  for (const param of Object.keys(mutated)) {
    if (Math.random() < mutationRate) {
      const def = PARAMETER_SPACE[param]
      if (!def) continue

      const tau = 1 - Math.pow(generation / maxGenerations, Math.pow(1 - generation / maxGenerations, b))

      const delta_max = Math.random() < 0.5
        ? (mutated[param] - def.min)
        : (def.max - mutated[param])

      const delta = delta_max * tau

      mutated[param] += (Math.random() < 0.5 ? delta : -delta)
    }
  }

  return repairIndividual(mutated)
}

/**
 * Boundary mutation (reset to min/max)
 */
function boundaryMutation(individual, mutationRate = 0.1) {
  const mutated = { ...individual }

  for (const param of Object.keys(mutated)) {
    if (Math.random() < mutationRate) {
      const def = PARAMETER_SPACE[param]
      if (!def) continue

      mutated[param] = Math.random() < 0.5 ? def.min : def.max
    }
  }

  return mutated
}

// ============================================================================
// SELECTION OPERATORS
// ============================================================================

/**
 * Tournament selection (ORIGINAL)
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
 * Roulette wheel selection (fitness-proportionate)
 */
function rouletteSelect(population) {
  // Shift fitness to positive if needed
  const minFitness = Math.min(...population.map(ind => ind.fitness))
  const offset = minFitness < 0 ? Math.abs(minFitness) + 1 : 0

  const totalFitness = population.reduce((sum, ind) => sum + ind.fitness + offset, 0)

  if (totalFitness === 0) {
    return population[Math.floor(Math.random() * population.length)]
  }

  const spin = Math.random() * totalFitness
  let accumulated = 0

  for (const individual of population) {
    accumulated += individual.fitness + offset
    if (accumulated >= spin) {
      return individual
    }
  }

  return population[population.length - 1]
}

/**
 * Rank selection
 */
function rankSelect(population) {
  // Sort by fitness
  const sorted = [...population].sort((a, b) => a.fitness - b.fitness)

  // Assign ranks (1 to N)
  const totalRank = (sorted.length * (sorted.length + 1)) / 2

  const spin = Math.random() * totalRank
  let accumulated = 0

  for (let i = 0; i < sorted.length; i++) {
    accumulated += i + 1
    if (accumulated >= spin) {
      return sorted[i]
    }
  }

  return sorted[sorted.length - 1]
}

/**
 * Stochastic Universal Sampling (SUS)
 */
function stochasticUniversalSampling(population, count) {
  const minFitness = Math.min(...population.map(ind => ind.fitness))
  const offset = minFitness < 0 ? Math.abs(minFitness) + 1 : 0

  const totalFitness = population.reduce((sum, ind) => sum + ind.fitness + offset, 0)
  const distance = totalFitness / count
  const start = Math.random() * distance

  const selected = []
  let accumulated = 0
  let pointer = start

  for (let i = 0; i < population.length && selected.length < count; i++) {
    accumulated += population[i].fitness + offset

    while (accumulated >= pointer && selected.length < count) {
      selected.push(population[i])
      pointer += distance
    }
  }

  return selected
}

/**
 * Boltzmann selection (simulated annealing-style)
 */
function boltzmannSelect(population, temperature = 1.0) {
  const boltzmannValues = population.map(ind =>
    Math.exp(ind.fitness / temperature)
  )

  const totalBoltzmann = boltzmannValues.reduce((sum, val) => sum + val, 0)
  const spin = Math.random() * totalBoltzmann

  let accumulated = 0
  for (let i = 0; i < population.length; i++) {
    accumulated += boltzmannValues[i]
    if (accumulated >= spin) {
      return population[i]
    }
  }

  return population[population.length - 1]
}

// ============================================================================
// NSGA-II MULTI-OBJECTIVE OPTIMIZATION
// ============================================================================

/**
 * Check if solution1 dominates solution2 (Pareto dominance)
 */
function dominates(solution1, solution2, objectives) {
  let atLeastOneBetter = false

  for (const objective of objectives) {
    const val1 = objective(solution1.results)
    const val2 = objective(solution2.results)

    if (val1 < val2) {
      return false // solution1 is worse in this objective
    }

    if (val1 > val2) {
      atLeastOneBetter = true
    }
  }

  return atLeastOneBetter
}

/**
 * Fast non-dominated sorting
 */
function fastNonDominatedSort(population, objectives) {
  const fronts = [[]]

  for (const individual of population) {
    individual.dominatedBy = []
    individual.dominates = 0

    for (const other of population) {
      if (individual === other) continue

      if (dominates(individual, other, objectives)) {
        individual.dominatedBy.push(other)
      } else if (dominates(other, individual, objectives)) {
        individual.dominates++
      }
    }

    if (individual.dominates === 0) {
      individual.rank = 0
      fronts[0].push(individual)
    }
  }

  let i = 0
  while (fronts[i].length > 0) {
    const nextFront = []

    for (const individual of fronts[i]) {
      for (const dominated of individual.dominatedBy) {
        dominated.dominates--

        if (dominated.dominates === 0) {
          dominated.rank = i + 1
          nextFront.push(dominated)
        }
      }
    }

    i++
    if (nextFront.length > 0) {
      fronts.push(nextFront)
    }
  }

  return fronts.filter(f => f.length > 0)
}

/**
 * Calculate crowding distance
 */
function calculateCrowdingDistance(front, objectives) {
  if (front.length === 0) return

  // Initialize distances
  front.forEach(ind => ind.crowdingDistance = 0)

  for (const objective of objectives) {
    // Sort by this objective
    const sorted = [...front].sort((a, b) => {
      const valA = objective(a.results)
      const valB = objective(b.results)
      return valA - valB
    })

    // Boundary points get infinite distance
    sorted[0].crowdingDistance = Infinity
    sorted[sorted.length - 1].crowdingDistance = Infinity

    // Find range
    const minVal = objective(sorted[0].results)
    const maxVal = objective(sorted[sorted.length - 1].results)
    const range = maxVal - minVal

    if (range === 0) continue

    // Calculate distances for intermediate points
    for (let i = 1; i < sorted.length - 1; i++) {
      const prev = objective(sorted[i - 1].results)
      const next = objective(sorted[i + 1].results)

      sorted[i].crowdingDistance += (next - prev) / range
    }
  }
}

/**
 * NSGA-II selection
 */
function nsgaIISelect(population, objectives, count) {
  const fronts = fastNonDominatedSort(population, objectives)

  const selected = []

  for (const front of fronts) {
    if (selected.length + front.length <= count) {
      // Add entire front
      selected.push(...front)
    } else {
      // Calculate crowding distance and sort
      calculateCrowdingDistance(front, objectives)
      front.sort((a, b) => b.crowdingDistance - a.crowdingDistance)

      // Add individuals with largest crowding distance
      const remaining = count - selected.length
      selected.push(...front.slice(0, remaining))
      break
    }
  }

  return selected
}

/**
 * Get Pareto frontier from population
 */
export function getParetoFrontier(population, objectives) {
  const fronts = fastNonDominatedSort(population, objectives)
  return fronts[0] || []
}

/**
 * Calculate hypervolume indicator (quality metric for Pareto front)
 */
function calculateHypervolume(front, objectives, referencePoint) {
  // Simplified 2D hypervolume calculation
  if (objectives.length !== 2) {
    console.warn('[GA] Hypervolume only supports 2 objectives')
    return 0
  }

  // Sort by first objective
  const sorted = [...front].sort((a, b) => {
    const valA = objectives[0](a.results)
    const valB = objectives[0](b.results)
    return valB - valA // Descending
  })

  let hypervolume = 0
  let prevY = referencePoint[1]

  for (const individual of sorted) {
    const x = objectives[0](individual.results)
    const y = objectives[1](individual.results)

    if (x > referencePoint[0] && y > referencePoint[1]) {
      const width = x - referencePoint[0]
      const height = prevY - y

      hypervolume += width * height
      prevY = y
    }
  }

  return hypervolume
}

// ============================================================================
// FITNESS CALCULATION
// ============================================================================

/**
 * Calculate multi-objective fitness (ORIGINAL - weighted sum)
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

  // Apply constraint penalty
  return fitness
}

/**
 * Calculate objectives vector (for NSGA-II)
 */
function calculateObjectives(results, objectiveNames) {
  return objectiveNames.map(name => {
    const objFunc = OBJECTIVES[name]
    return objFunc ? objFunc(results) : 0
  })
}

// ============================================================================
// CONVERGENCE ANALYSIS
// ============================================================================

/**
 * Detect convergence
 */
function detectConvergence(history, window = 5, threshold = 0.001) {
  if (history.length < window) return false

  const recent = history.slice(-window)
  const avgFitness = recent.reduce((sum, gen) => sum + gen.avg, 0) / window

  const variance = recent.reduce((sum, gen) =>
    sum + Math.pow(gen.avg - avgFitness, 2), 0
  ) / window

  return variance < threshold
}

/**
 * Calculate improvement rate
 */
function calculateImprovementRate(history, window = 10) {
  if (history.length < window) return 0

  const recent = history.slice(-window)
  const firstBest = recent[0].best.fitness
  const lastBest = recent[recent.length - 1].best.fitness

  return ((lastBest - firstBest) / Math.abs(firstBest)) * 100
}

// ============================================================================
// ISLAND MODEL (PARALLEL POPULATIONS)
// ============================================================================

/**
 * Island model GA with migration
 */
export class IslandModel {
  constructor(numIslands = 4, islandSize = 20, migrationRate = 0.1, migrationInterval = 5) {
    this.numIslands = numIslands
    this.islandSize = islandSize
    this.migrationRate = migrationRate
    this.migrationInterval = migrationInterval
    this.islands = []
  }

  async evolve(options = {}) {
    const {
      parameters = Object.keys(PARAMETER_SPACE),
      evaluateFunction,
      generations = 30,
      weights = {},
      onProgress = null
    } = options

    // Initialize islands
    this.islands = []
    for (let i = 0; i < this.numIslands; i++) {
      const population = []
      for (let j = 0; j < this.islandSize; j++) {
        population.push(createRandomIndividual(parameters))
      }
      this.islands.push(population)
    }

    const globalHistory = []

    for (let gen = 0; gen < generations; gen++) {
      // Evolve each island independently
      const islandResults = await Promise.all(
        this.islands.map(async (island, islandIdx) => {
          // Evaluate fitness
          const evaluated = await Promise.all(
            island.map(async individual => {
              const results = await evaluateFunction(individual)
              const fitness = calculateFitness(results, weights)
              return { params: individual, results, fitness }
            })
          )

          // Sort by fitness
          evaluated.sort((a, b) => b.fitness - a.fitness)

          // Create next generation for this island
          const nextGen = []

          // Keep elite
          nextGen.push({ ...evaluated[0].params })

          // Generate offspring
          while (nextGen.length < this.islandSize) {
            const parent1 = tournamentSelect(evaluated)
            const parent2 = tournamentSelect(evaluated)

            let child = crossover(parent1.params, parent2.params)
            child = mutate(child, 0.1, gen, generations)

            nextGen.push(child)
          }

          return { population: nextGen, evaluated, best: evaluated[0] }
        })
      )

      // Update islands
      this.islands = islandResults.map(r => r.population)

      // Migration
      if ((gen + 1) % this.migrationInterval === 0) {
        this.migrate()
      }

      // Track global best
      const allBest = islandResults.map(r => r.best)
      allBest.sort((a, b) => b.fitness - a.fitness)

      globalHistory.push({
        generation: gen,
        best: allBest[0],
        islandBests: allBest
      })

      if (onProgress) {
        onProgress(globalHistory[globalHistory.length - 1])
      }
    }

    return {
      best: globalHistory[globalHistory.length - 1].best,
      history: globalHistory,
      islands: this.islands
    }
  }

  migrate() {
    const migrants = []

    // Select migrants from each island
    for (const island of this.islands) {
      const numMigrants = Math.ceil(island.length * this.migrationRate)
      // Take best individuals as migrants
      migrants.push(island.slice(0, numMigrants))
    }

    // Ring topology: send migrants to next island
    for (let i = 0; i < this.numIslands; i++) {
      const nextIsland = (i + 1) % this.numIslands
      const receivingIsland = this.islands[nextIsland]

      // Replace worst individuals with migrants
      const numMigrants = migrants[i].length
      receivingIsland.splice(-numMigrants, numMigrants, ...migrants[i])
    }
  }
}

// ============================================================================
// MAIN GENETIC ALGORITHM (ORIGINAL - ENHANCED)
// ============================================================================

/**
 * Main genetic algorithm (ORIGINAL)
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
        const fitness = calculateFitness(results, weights) - constraintPenalty(individual)
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

    // Calculate diversity
    const diversity = calculateDiversity(evaluations, PARAMETER_SPACE)

    // Record generation stats
    const genStats = {
      generation: gen,
      best: evaluations[0],
      avg: evaluations.reduce((sum, e) => sum + e.fitness, 0) / evaluations.length,
      worst: evaluations[evaluations.length - 1].fitness,
      diversity
    }

    history.push(genStats)

    if (onProgress) {
      onProgress(genStats)
    }

    // Early termination if converged
    if (detectConvergence(history)) {
      console.log('[GA] Converged early at generation', gen)
      break
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
 * NSGA-II multi-objective optimization
 */
export async function optimizeWithNSGAII(options = {}) {
  const {
    parameters = Object.keys(PARAMETER_SPACE),
    evaluateFunction,
    objectives = ['return', 'sharpe', 'drawdown'], // Objective names
    populationSize = 100,
    generations = 50,
    mutationRate = 0.1,
    crossoverOperator = 'sbx', // 'uniform', 'sbx', 'blend'
    mutationOperator = 'polynomial', // 'gaussian', 'polynomial', 'cauchy'
    onProgress = null
  } = options

  if (!evaluateFunction) {
    throw new Error('evaluateFunction is required')
  }

  // Get objective functions
  const objectiveFuncs = objectives.map(name => OBJECTIVES[name])

  // Initialize population
  let population = []
  for (let i = 0; i < populationSize; i++) {
    population.push(createRandomIndividual(parameters))
  }

  const history = []

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate all individuals
    const evaluated = await Promise.all(
      population.map(async individual => {
        const results = await evaluateFunction(individual)
        return {
          params: individual,
          results,
          objectives: calculateObjectives(results, objectives)
        }
      })
    )

    // Non-dominated sorting and crowding distance
    const selected = nsgaIISelect(evaluated, objectiveFuncs, populationSize)

    // Get Pareto frontier
    const paretoFront = getParetoFrontier(evaluated, objectiveFuncs)

    // Record generation stats
    history.push({
      generation: gen,
      paretoFront,
      populationSize: evaluated.length
    })

    if (onProgress) {
      onProgress(history[history.length - 1])
    }

    // Generate offspring
    const offspring = []

    while (offspring.length < populationSize) {
      const parent1 = tournamentSelect(selected, 2)
      const parent2 = tournamentSelect(selected, 2)

      // Crossover
      let child
      if (crossoverOperator === 'sbx') {
        child = simulatedBinaryCrossover(parent1.params, parent2.params)
      } else if (crossoverOperator === 'blend') {
        child = blendCrossover(parent1.params, parent2.params)
      } else {
        child = crossover(parent1.params, parent2.params)
      }

      // Mutation
      if (mutationOperator === 'polynomial') {
        child = polynomialMutation(child, mutationRate)
      } else if (mutationOperator === 'cauchy') {
        child = cauchyMutation(child, mutationRate)
      } else {
        child = mutate(child, mutationRate, gen, generations)
      }

      offspring.push(child)
    }

    population = offspring
  }

  // Final evaluation
  const finalEvaluated = await Promise.all(
    population.map(async individual => {
      const results = await evaluateFunction(individual)
      return {
        params: individual,
        results,
        objectives: calculateObjectives(results, objectives)
      }
    })
  )

  const finalParetoFront = getParetoFrontier(finalEvaluated, objectiveFuncs)

  return {
    paretoFront: finalParetoFront,
    history,
    finalPopulation: finalEvaluated
  }
}

// ============================================================================
// QUICK OPTIMIZATION (ORIGINAL)
// ============================================================================

/**
 * Quick optimize using grid search (faster but less thorough) (ORIGINAL)
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

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Main algorithms
  optimizeWithGA,
  optimizeWithNSGAII,
  quickOptimize,

  // Classes
  IslandModel,

  // Crossover operators
  crossover,
  singlePointCrossover,
  twoPointCrossover,
  simulatedBinaryCrossover,
  arithmeticCrossover,
  blendCrossover,

  // Mutation operators
  mutate,
  polynomialMutation,
  cauchyMutation,
  nonUniformMutation,
  boundaryMutation,

  // Selection operators
  tournamentSelect,
  rouletteSelect,
  rankSelect,
  stochasticUniversalSampling,
  boltzmannSelect,

  // NSGA-II
  getParetoFrontier,
  fastNonDominatedSort,
  calculateCrowdingDistance,

  // Utilities
  createRandomIndividual,
  repairIndividual,
  checkConstraints,
  calculateFitness,
  calculateDiversity,
  detectConvergence,

  // Constants
  PARAMETER_SPACE,
  OBJECTIVES
}
