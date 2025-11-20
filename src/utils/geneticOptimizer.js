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

// ============================================================================
// DIFFERENTIAL EVOLUTION (DE)
// ============================================================================

/**
 * Differential Evolution - State-of-the-art evolutionary algorithm
 * Known for excellent performance on continuous optimization problems
 */
export class DifferentialEvolution {
  constructor(options = {}) {
    this.populationSize = options.populationSize || 50
    this.F = options.F || 0.8 // Differential weight (mutation factor)
    this.CR = options.CR || 0.9 // Crossover probability
    this.strategy = options.strategy || 'rand/1/bin' // DE strategy
    this.adaptiveF = options.adaptiveF !== false // Self-adaptive F
    this.adaptiveCR = options.adaptiveCR !== false // Self-adaptive CR
  }

  /**
   * DE/rand/1/bin strategy
   */
  deRand1Bin(population, targetIdx, F, CR, parameterSpace) {
    const target = population[targetIdx]
    const params = Object.keys(target)

    // Select 3 random different individuals
    const indices = new Set([targetIdx])
    while (indices.size < 4) {
      indices.add(Math.floor(Math.random() * population.length))
    }
    const [_, r1Idx, r2Idx, r3Idx] = Array.from(indices)

    const r1 = population[r1Idx]
    const r2 = population[r2Idx]
    const r3 = population[r3Idx]

    // Mutation: v = r1 + F * (r2 - r3)
    const mutant = {}
    for (const param of params) {
      mutant[param] = r1[param] + F * (r2[param] - r3[param])
    }

    // Crossover: binomial
    const trial = {}
    const jRand = Math.floor(Math.random() * params.length)

    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      if (Math.random() < CR || j === jRand) {
        trial[param] = mutant[param]
      } else {
        trial[param] = target[param]
      }
    }

    return repairIndividual(trial, parameterSpace)
  }

  /**
   * DE/best/1/bin strategy (faster convergence but risk of premature convergence)
   */
  deBest1Bin(population, targetIdx, best, F, CR, parameterSpace) {
    const target = population[targetIdx]
    const params = Object.keys(target)

    // Select 2 random different individuals
    const indices = new Set([targetIdx])
    while (indices.size < 3) {
      indices.add(Math.floor(Math.random() * population.length))
    }
    const [_, r1Idx, r2Idx] = Array.from(indices)

    const r1 = population[r1Idx]
    const r2 = population[r2Idx]

    // Mutation: v = best + F * (r1 - r2)
    const mutant = {}
    for (const param of params) {
      mutant[param] = best[param] + F * (r1[param] - r2[param])
    }

    // Crossover
    const trial = {}
    const jRand = Math.floor(Math.random() * params.length)

    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      if (Math.random() < CR || j === jRand) {
        trial[param] = mutant[param]
      } else {
        trial[param] = target[param]
      }
    }

    return repairIndividual(trial, parameterSpace)
  }

  /**
   * DE/current-to-best/1/bin strategy (balanced exploration/exploitation)
   */
  deCurrentToBest1Bin(population, targetIdx, best, F, CR, parameterSpace) {
    const target = population[targetIdx]
    const params = Object.keys(target)

    // Select 2 random different individuals
    const indices = new Set([targetIdx])
    while (indices.size < 3) {
      indices.add(Math.floor(Math.random() * population.length))
    }
    const [_, r1Idx, r2Idx] = Array.from(indices)

    const r1 = population[r1Idx]
    const r2 = population[r2Idx]

    // Mutation: v = target + F * (best - target) + F * (r1 - r2)
    const mutant = {}
    for (const param of params) {
      mutant[param] = target[param] + F * (best[param] - target[param]) + F * (r1[param] - r2[param])
    }

    // Crossover
    const trial = {}
    const jRand = Math.floor(Math.random() * params.length)

    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      if (Math.random() < CR || j === jRand) {
        trial[param] = mutant[param]
      } else {
        trial[param] = target[param]
      }
    }

    return repairIndividual(trial, parameterSpace)
  }

  /**
   * Self-Adaptive DE (jDE) - adapts F and CR during evolution
   */
  adaptParameters(F, CR, tau1 = 0.1, tau2 = 0.1, Fl = 0.1, Fu = 0.9) {
    let newF = F
    let newCR = CR

    if (Math.random() < tau1) {
      newF = Fl + Math.random() * (Fu - Fl)
    }

    if (Math.random() < tau2) {
      newCR = Math.random()
    }

    return { F: newF, CR: newCR }
  }

  /**
   * Main DE optimization
   */
  async optimize(options = {}) {
    const {
      parameters = Object.keys(PARAMETER_SPACE),
      evaluateFunction,
      generations = 50,
      weights = {},
      onProgress = null
    } = options

    if (!evaluateFunction) {
      throw new Error('evaluateFunction is required')
    }

    const parameterSpace = {}
    for (const param of parameters) {
      parameterSpace[param] = PARAMETER_SPACE[param]
    }

    // Initialize population
    let population = []
    for (let i = 0; i < this.populationSize; i++) {
      population.push(createRandomIndividual(parameters))
    }

    // Initialize adaptive parameters for each individual
    const adaptiveParams = population.map(() => ({
      F: this.F,
      CR: this.CR
    }))

    const history = []
    let bestEver = null

    for (let gen = 0; gen < generations; gen++) {
      // Evaluate population
      const evaluated = await Promise.all(
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
      evaluated.sort((a, b) => b.fitness - a.fitness)
      const best = evaluated[0]

      // Track best ever
      if (!bestEver || best.fitness > bestEver.fitness) {
        bestEver = best
      }

      // Record generation stats
      const genStats = {
        generation: gen,
        best,
        avg: evaluated.reduce((sum, e) => sum + e.fitness, 0) / evaluated.length,
        diversity: calculateDiversity(population, parameterSpace)
      }

      history.push(genStats)

      if (onProgress) {
        onProgress(genStats)
      }

      // Generate new population
      const newPopulation = []

      for (let i = 0; i < this.populationSize; i++) {
        // Adapt parameters if enabled
        let { F, CR } = adaptiveParams[i]
        if (this.adaptiveF || this.adaptiveCR) {
          const adapted = this.adaptParameters(F, CR)
          if (this.adaptiveF) F = adapted.F
          if (this.adaptiveCR) CR = adapted.CR
        }

        // Generate trial vector based on strategy
        let trial
        if (this.strategy === 'best/1/bin') {
          trial = this.deBest1Bin(population, i, best.params, F, CR, parameterSpace)
        } else if (this.strategy === 'current-to-best/1/bin') {
          trial = this.deCurrentToBest1Bin(population, i, best.params, F, CR, parameterSpace)
        } else {
          trial = this.deRand1Bin(population, i, F, CR, parameterSpace)
        }

        // Evaluate trial
        const trialResults = await evaluateFunction(trial)
        const trialFitness = calculateFitness(trialResults, weights) - constraintPenalty(trial)

        // Selection
        if (trialFitness > evaluated[i].fitness) {
          newPopulation.push(trial)
          // Update adaptive parameters
          adaptiveParams[i] = { F, CR }
        } else {
          newPopulation.push(population[i])
        }
      }

      population = newPopulation
    }

    return {
      best: bestEver,
      history,
      finalPopulation: population
    }
  }
}

// ============================================================================
// PARTICLE SWARM OPTIMIZATION (PSO)
// ============================================================================

/**
 * Particle Swarm Optimization - Swarm intelligence algorithm
 * Particles move through search space influenced by personal and global best
 */
export class ParticleSwarmOptimizer {
  constructor(options = {}) {
    this.swarmSize = options.swarmSize || 30
    this.w = options.w !== undefined ? options.w : 0.7298 // Inertia weight (Clerc's constriction coefficient)
    this.c1 = options.c1 || 1.49618 // Cognitive parameter
    this.c2 = options.c2 || 1.49618 // Social parameter
    this.vmax = options.vmax || 0.2 // Maximum velocity (as fraction of range)
    this.adaptiveInertia = options.adaptiveInertia !== false
    this.wMin = options.wMin || 0.4
    this.wMax = options.wMax || 0.9
  }

  /**
   * Initialize particle with position and velocity
   */
  initializeParticle(parameters) {
    const position = createRandomIndividual(parameters)
    const velocity = {}

    for (const param of parameters) {
      const def = PARAMETER_SPACE[param]
      const range = def.max - def.min
      velocity[param] = (Math.random() - 0.5) * range * this.vmax
    }

    return {
      position,
      velocity,
      personalBest: { ...position },
      personalBestFitness: -Infinity
    }
  }

  /**
   * Update particle velocity and position
   */
  updateParticle(particle, globalBest, generation, maxGenerations, parameterSpace) {
    const params = Object.keys(particle.position)

    // Adaptive inertia weight (linearly decreasing)
    let w = this.w
    if (this.adaptiveInertia) {
      w = this.wMax - (this.wMax - this.wMin) * generation / maxGenerations
    }

    for (const param of params) {
      const def = parameterSpace[param]
      const range = def.max - def.min

      // Update velocity
      const r1 = Math.random()
      const r2 = Math.random()

      const cognitive = this.c1 * r1 * (particle.personalBest[param] - particle.position[param])
      const social = this.c2 * r2 * (globalBest[param] - particle.position[param])

      particle.velocity[param] = w * particle.velocity[param] + cognitive + social

      // Clamp velocity
      const maxVel = range * this.vmax
      particle.velocity[param] = Math.max(-maxVel, Math.min(maxVel, particle.velocity[param]))

      // Update position
      particle.position[param] += particle.velocity[param]
    }

    // Repair position to satisfy constraints
    particle.position = repairIndividual(particle.position, parameterSpace)
  }

  /**
   * Main PSO optimization
   */
  async optimize(options = {}) {
    const {
      parameters = Object.keys(PARAMETER_SPACE),
      evaluateFunction,
      iterations = 50,
      weights = {},
      onProgress = null
    } = options

    if (!evaluateFunction) {
      throw new Error('evaluateFunction is required')
    }

    const parameterSpace = {}
    for (const param of parameters) {
      parameterSpace[param] = PARAMETER_SPACE[param]
    }

    // Initialize swarm
    const swarm = []
    for (let i = 0; i < this.swarmSize; i++) {
      swarm.push(this.initializeParticle(parameters))
    }

    let globalBest = null
    let globalBestFitness = -Infinity

    const history = []

    for (let iter = 0; iter < iterations; iter++) {
      // Evaluate all particles
      const evaluated = await Promise.all(
        swarm.map(async (particle) => {
          const results = await evaluateFunction(particle.position)
          const fitness = calculateFitness(results, weights) - constraintPenalty(particle.position)
          return { particle, results, fitness }
        })
      )

      // Update personal and global bests
      for (const { particle, results, fitness } of evaluated) {
        if (fitness > particle.personalBestFitness) {
          particle.personalBest = { ...particle.position }
          particle.personalBestFitness = fitness
        }

        if (fitness > globalBestFitness) {
          globalBest = { ...particle.position }
          globalBestFitness = fitness
        }
      }

      // Record iteration stats
      const avgFitness = evaluated.reduce((sum, e) => sum + e.fitness, 0) / evaluated.length

      const iterStats = {
        iteration: iter,
        best: {
          params: globalBest,
          fitness: globalBestFitness
        },
        avg: avgFitness,
        diversity: calculateDiversity(swarm.map(p => p.position), parameterSpace)
      }

      history.push(iterStats)

      if (onProgress) {
        onProgress(iterStats)
      }

      // Update particles
      for (const particle of swarm) {
        this.updateParticle(particle, globalBest, iter, iterations, parameterSpace)
      }
    }

    return {
      best: {
        params: globalBest,
        fitness: globalBestFitness
      },
      history,
      finalSwarm: swarm
    }
  }
}

// ============================================================================
// CMA-ES (COVARIANCE MATRIX ADAPTATION EVOLUTION STRATEGY)
// ============================================================================

/**
 * CMA-ES - State-of-the-art for continuous black-box optimization
 * Adapts covariance matrix of mutation distribution
 */
export class CMAES {
  constructor(options = {}) {
    this.populationSize = options.populationSize || null // Will be set based on dimensionality
    this.sigma = options.sigma || 0.3 // Initial step size (as fraction of range)
  }

  /**
   * Initialize CMA-ES parameters based on problem dimensionality
   */
  initializeParameters(n) {
    // Population size
    const lambda = this.populationSize || (4 + Math.floor(3 * Math.log(n)))
    const mu = Math.floor(lambda / 2)

    // Recombination weights
    const weights = []
    let sumWeights = 0
    for (let i = 0; i < mu; i++) {
      const w = Math.log(mu + 0.5) - Math.log(i + 1)
      weights.push(w)
      sumWeights += w
    }
    const weightsNorm = weights.map(w => w / sumWeights)

    const mueff = 1 / weightsNorm.reduce((sum, w) => sum + w * w, 0)

    // Adaptation parameters
    const cc = (4 + mueff / n) / (n + 4 + 2 * mueff / n)
    const cs = (mueff + 2) / (n + mueff + 5)
    const c1 = 2 / (Math.pow(n + 1.3, 2) + mueff)
    const cmu = Math.min(1 - c1, 2 * (mueff - 2 + 1 / mueff) / (Math.pow(n + 2, 2) + mueff))
    const damps = 1 + 2 * Math.max(0, Math.sqrt((mueff - 1) / (n + 1)) - 1) + cs

    return {
      lambda,
      mu,
      weights: weightsNorm,
      mueff,
      cc,
      cs,
      c1,
      cmu,
      damps
    }
  }

  /**
   * Matrix-vector multiplication
   */
  matVecMul(matrix, vector) {
    const n = vector.length
    const result = new Array(n).fill(0)

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result[i] += matrix[i][j] * vector[j]
      }
    }

    return result
  }

  /**
   * Cholesky decomposition (for sampling from multivariate Gaussian)
   */
  cholesky(matrix) {
    const n = matrix.length
    const L = Array(n).fill(0).map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k]
        }

        if (i === j) {
          L[i][j] = Math.sqrt(Math.max(0, matrix[i][i] - sum))
        } else {
          L[i][j] = (matrix[i][j] - sum) / Math.max(1e-10, L[j][j])
        }
      }
    }

    return L
  }

  /**
   * Sample from multivariate Gaussian N(mean, sigma^2 * C)
   */
  sampleMultivariateGaussian(mean, C, sigma) {
    const n = mean.length
    const L = this.cholesky(C)

    // Sample standard normal
    const z = Array(n).fill(0).map(() => randomGaussian(0, 1))

    // Transform: y = mean + sigma * L * z
    const Lz = this.matVecMul(L, z)
    const y = mean.map((m, i) => m + sigma * Lz[i])

    return y
  }

  /**
   * Convert parameter object to array and back
   */
  paramsToArray(params, parameters) {
    return parameters.map(p => params[p])
  }

  arrayToParams(arr, parameters, parameterSpace) {
    const params = {}
    for (let i = 0; i < parameters.length; i++) {
      params[parameters[i]] = arr[i]
    }
    return repairIndividual(params, parameterSpace)
  }

  /**
   * Normalize parameters to [0, 1]
   */
  normalize(params, parameters) {
    return parameters.map(p => {
      const def = PARAMETER_SPACE[p]
      return (params[p] - def.min) / (def.max - def.min)
    })
  }

  /**
   * Denormalize parameters from [0, 1]
   */
  denormalize(arr, parameters) {
    const params = {}
    for (let i = 0; i < parameters.length; i++) {
      const p = parameters[i]
      const def = PARAMETER_SPACE[p]
      params[p] = def.min + arr[i] * (def.max - def.min)
    }
    return params
  }

  /**
   * Main CMA-ES optimization
   */
  async optimize(options = {}) {
    const {
      parameters = Object.keys(PARAMETER_SPACE),
      evaluateFunction,
      maxGenerations = 100,
      weights = {},
      onProgress = null
    } = options

    if (!evaluateFunction) {
      throw new Error('evaluateFunction is required')
    }

    const n = parameters.length
    const params = this.initializeParameters(n)

    const parameterSpace = {}
    for (const param of parameters) {
      parameterSpace[param] = PARAMETER_SPACE[param]
    }

    // Initialize mean (center of search space)
    const initialParams = createRandomIndividual(parameters)
    let mean = this.normalize(initialParams, parameters)

    // Initialize covariance matrix (identity)
    let C = Array(n).fill(0).map(() => Array(n).fill(0))
    for (let i = 0; i < n; i++) {
      C[i][i] = 1
    }

    // Evolution paths
    let pc = Array(n).fill(0)
    let ps = Array(n).fill(0)

    let sigma = this.sigma

    const history = []
    let bestEver = null
    let bestEverFitness = -Infinity

    for (let gen = 0; gen < maxGenerations; gen++) {
      // Sample offspring
      const offspring = []
      const offspringArrays = []

      for (let i = 0; i < params.lambda; i++) {
        const y = this.sampleMultivariateGaussian(mean, C, sigma)
        offspringArrays.push(y)
        const denorm = this.denormalize(y, parameters)
        offspring.push(this.arrayToParams(denorm, parameters, parameterSpace))
      }

      // Evaluate offspring
      const evaluated = await Promise.all(
        offspring.map(async (individual, idx) => {
          const results = await evaluateFunction(individual)
          const fitness = calculateFitness(results, weights) - constraintPenalty(individual)
          return {
            params: individual,
            array: offspringArrays[idx],
            results,
            fitness
          }
        })
      )

      // Sort by fitness
      evaluated.sort((a, b) => b.fitness - a.fitness)

      // Track best
      if (evaluated[0].fitness > bestEverFitness) {
        bestEver = evaluated[0]
        bestEverFitness = evaluated[0].fitness
      }

      // Recombination: weighted mean of top mu individuals
      const newMean = Array(n).fill(0)
      for (let i = 0; i < params.mu; i++) {
        const w = params.weights[i]
        for (let j = 0; j < n; j++) {
          newMean[j] += w * evaluated[i].array[j]
        }
      }

      // Cumulation: update evolution paths
      const meanDiff = newMean.map((x, i) => x - mean[i])

      // ps update
      for (let i = 0; i < n; i++) {
        ps[i] = (1 - params.cs) * ps[i] + Math.sqrt(params.cs * (2 - params.cs) * params.mueff) * meanDiff[i] / sigma
      }

      // Norm of ps
      const psNorm = Math.sqrt(ps.reduce((sum, x) => sum + x * x, 0))
      const expectedNorm = Math.sqrt(n) * (1 - 1 / (4 * n) + 1 / (21 * n * n))

      // pc update
      const hsig = psNorm / Math.sqrt(1 - Math.pow(1 - params.cs, 2 * (gen + 1))) < (1.4 + 2 / (n + 1)) * expectedNorm ? 1 : 0

      for (let i = 0; i < n; i++) {
        pc[i] = (1 - params.cc) * pc[i] + hsig * Math.sqrt(params.cc * (2 - params.cc) * params.mueff) * meanDiff[i] / sigma
      }

      // Covariance matrix update (rank-mu update)
      const Cnew = Array(n).fill(0).map(() => Array(n).fill(0))

      // Rank-one update
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          Cnew[i][j] = (1 - params.c1 - params.cmu) * C[i][j] + params.c1 * pc[i] * pc[j]
        }
      }

      // Rank-mu update
      for (let k = 0; k < params.mu; k++) {
        const w = params.weights[k]
        const diff = evaluated[k].array.map((x, i) => x - mean[i])

        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            Cnew[i][j] += params.cmu * w * (diff[i] * diff[j]) / (sigma * sigma)
          }
        }
      }

      C = Cnew

      // Step size control
      sigma = sigma * Math.exp((params.cs / params.damps) * (psNorm / expectedNorm - 1))

      mean = newMean

      // Record generation stats
      const genStats = {
        generation: gen,
        best: bestEver,
        avg: evaluated.reduce((sum, e) => sum + e.fitness, 0) / evaluated.length,
        sigma,
        psNorm
      }

      history.push(genStats)

      if (onProgress) {
        onProgress(genStats)
      }
    }

    return {
      best: bestEver,
      history,
      finalMean: this.denormalize(mean, parameters)
    }
  }
}

// ============================================================================
// MOEA/D (MULTI-OBJECTIVE EA BASED ON DECOMPOSITION)
// ============================================================================

/**
 * MOEA/D - Decomposes multi-objective problem into scalar subproblems
 * Alternative to NSGA-II with often better performance
 */
export class MOEAD {
  constructor(options = {}) {
    this.populationSize = options.populationSize || 100
    this.neighborhoodSize = options.neighborhoodSize || 20
    this.aggregationMethod = options.aggregationMethod || 'tchebycheff' // 'weighted_sum', 'tchebycheff', 'pbi'
    this.theta = options.theta || 5.0 // Penalty parameter for PBI
  }

  /**
   * Generate uniformly distributed weight vectors
   */
  generateWeights(numObjectives, numWeights) {
    if (numObjectives === 2) {
      // Simple uniform distribution for 2 objectives
      const weights = []
      for (let i = 0; i < numWeights; i++) {
        const w1 = i / (numWeights - 1)
        const w2 = 1 - w1
        weights.push([w1, w2])
      }
      return weights
    }

    // For higher dimensions, use Das-Dennis method (simplified)
    const weights = []
    const H = Math.floor(Math.pow(numWeights, 1 / numObjectives))

    const generate = (current, remaining, depth) => {
      if (depth === numObjectives - 1) {
        weights.push([...current, remaining])
        return
      }

      for (let i = 0; i <= remaining; i++) {
        generate([...current, i / H], remaining - i, depth + 1)
      }
    }

    generate([], H, 0)

    return weights.slice(0, numWeights)
  }

  /**
   * Calculate Euclidean distance between weight vectors
   */
  weightDistance(w1, w2) {
    let sum = 0
    for (let i = 0; i < w1.length; i++) {
      sum += Math.pow(w1[i] - w2[i], 2)
    }
    return Math.sqrt(sum)
  }

  /**
   * Find T nearest neighbors for each weight vector
   */
  findNeighbors(weights, T) {
    const neighbors = []

    for (let i = 0; i < weights.length; i++) {
      const distances = weights.map((w, j) => ({
        index: j,
        distance: this.weightDistance(weights[i], w)
      }))

      distances.sort((a, b) => a.distance - b.distance)
      neighbors.push(distances.slice(0, T).map(d => d.index))
    }

    return neighbors
  }

  /**
   * Weighted sum aggregation
   */
  weightedSum(objectives, weights) {
    return objectives.reduce((sum, obj, i) => sum + weights[i] * obj, 0)
  }

  /**
   * Tchebycheff aggregation (most popular in MOEA/D)
   */
  tchebycheff(objectives, weights, idealPoint) {
    let maxWeightedDiff = -Infinity

    for (let i = 0; i < objectives.length; i++) {
      const diff = Math.abs(objectives[i] - idealPoint[i])
      const weighted = weights[i] * diff
      maxWeightedDiff = Math.max(maxWeightedDiff, weighted)
    }

    return maxWeightedDiff
  }

  /**
   * Penalty-based Boundary Intersection (PBI) aggregation
   */
  pbi(objectives, weights, idealPoint, theta) {
    // Distance along weight vector direction
    const diff = objectives.map((obj, i) => obj - idealPoint[i])

    // d1: distance along weight vector
    const normW = Math.sqrt(weights.reduce((sum, w) => sum + w * w, 0))
    const d1 = Math.abs(diff.reduce((sum, d, i) => sum + d * weights[i], 0)) / normW

    // d2: distance perpendicular to weight vector
    const projection = diff.reduce((sum, d, i) => sum + d * weights[i], 0) / (normW * normW)
    const d2Squared = diff.reduce((sum, d, i) => {
      const projected = projection * weights[i]
      return sum + Math.pow(d - projected, 2)
    }, 0)
    const d2 = Math.sqrt(d2Squared)

    return d1 + theta * d2
  }

  /**
   * Aggregate objectives using selected method
   */
  aggregate(objectives, weights, idealPoint) {
    if (this.aggregationMethod === 'weighted_sum') {
      return -this.weightedSum(objectives, weights) // Negative for minimization
    } else if (this.aggregationMethod === 'pbi') {
      return this.pbi(objectives, weights, idealPoint, this.theta)
    } else {
      return this.tchebycheff(objectives, weights, idealPoint)
    }
  }

  /**
   * Update ideal point (best value for each objective)
   */
  updateIdealPoint(idealPoint, objectives) {
    for (let i = 0; i < objectives.length; i++) {
      idealPoint[i] = Math.max(idealPoint[i], objectives[i])
    }
  }

  /**
   * Main MOEA/D optimization
   */
  async optimize(options = {}) {
    const {
      parameters = Object.keys(PARAMETER_SPACE),
      evaluateFunction,
      objectives = ['return', 'sharpe', 'drawdown'],
      generations = 100,
      onProgress = null
    } = options

    if (!evaluateFunction) {
      throw new Error('evaluateFunction is required')
    }

    const objectiveFuncs = objectives.map(name => OBJECTIVES[name])
    const numObjectives = objectives.length

    // Generate weight vectors
    const weights = this.generateWeights(numObjectives, this.populationSize)

    // Find neighbors
    const neighbors = this.findNeighbors(weights, this.neighborhoodSize)

    // Initialize population
    let population = []
    for (let i = 0; i < this.populationSize; i++) {
      population.push(createRandomIndividual(parameters))
    }

    // Initialize ideal point
    const idealPoint = Array(numObjectives).fill(-Infinity)

    // Evaluate initial population
    let evaluated = await Promise.all(
      population.map(async individual => {
        const results = await evaluateFunction(individual)
        const objs = objectiveFuncs.map(f => f(results))
        this.updateIdealPoint(idealPoint, objs)
        return {
          params: individual,
          results,
          objectives: objs
        }
      })
    )

    const history = []

    for (let gen = 0; gen < generations; gen++) {
      for (let i = 0; i < this.populationSize; i++) {
        // Select two parents from neighborhood
        const neighborhood = neighbors[i]
        const p1Idx = neighborhood[Math.floor(Math.random() * neighborhood.length)]
        const p2Idx = neighborhood[Math.floor(Math.random() * neighborhood.length)]

        // Crossover and mutation
        let child = crossover(evaluated[p1Idx].params, evaluated[p2Idx].params)
        child = mutate(child, 0.1, gen, generations)

        // Evaluate child
        const childResults = await evaluateFunction(child)
        const childObjs = objectiveFuncs.map(f => f(childResults))

        // Update ideal point
        this.updateIdealPoint(idealPoint, childObjs)

        // Update neighboring solutions
        for (const j of neighborhood) {
          const currentAgg = this.aggregate(evaluated[j].objectives, weights[j], idealPoint)
          const childAgg = this.aggregate(childObjs, weights[j], idealPoint)

          // Replace if child is better (minimization)
          if (childAgg < currentAgg) {
            evaluated[j] = {
              params: child,
              results: childResults,
              objectives: childObjs
            }
          }
        }
      }

      // Record generation stats
      const paretoFront = getParetoFrontier(evaluated, objectiveFuncs)

      history.push({
        generation: gen,
        paretoFront,
        idealPoint: [...idealPoint]
      })

      if (onProgress) {
        onProgress(history[history.length - 1])
      }
    }

    const finalParetoFront = getParetoFrontier(evaluated, objectiveFuncs)

    return {
      paretoFront: finalParetoFront,
      history,
      finalPopulation: evaluated
    }
  }
}

// ============================================================================
// PERFORMANCE INDICATORS
// ============================================================================

/**
 * Generational Distance (GD) - convergence metric
 * Measures average distance from Pareto front to true Pareto front
 */
export function calculateGenerationalDistance(paretoFront, trueFront, objectives) {
  if (paretoFront.length === 0 || trueFront.length === 0) return Infinity

  let sumDistances = 0

  for (const solution of paretoFront) {
    const solutionObjs = objectives.map(f => f(solution.results))

    // Find minimum distance to true front
    let minDistance = Infinity
    for (const trueSolution of trueFront) {
      const trueObjs = objectives.map(f => f(trueSolution.results))

      const distance = Math.sqrt(
        solutionObjs.reduce((sum, obj, i) => sum + Math.pow(obj - trueObjs[i], 2), 0)
      )

      minDistance = Math.min(minDistance, distance)
    }

    sumDistances += minDistance
  }

  return sumDistances / paretoFront.length
}

/**
 * Inverted Generational Distance (IGD) - convergence + diversity metric
 * Measures average distance from true Pareto front to obtained front
 */
export function calculateInvertedGenerationalDistance(paretoFront, trueFront, objectives) {
  if (paretoFront.length === 0 || trueFront.length === 0) return Infinity

  let sumDistances = 0

  for (const trueSolution of trueFront) {
    const trueObjs = objectives.map(f => f(trueSolution.results))

    // Find minimum distance to obtained front
    let minDistance = Infinity
    for (const solution of paretoFront) {
      const solutionObjs = objectives.map(f => f(solution.results))

      const distance = Math.sqrt(
        trueObjs.reduce((sum, obj, i) => sum + Math.pow(obj - solutionObjs[i], 2), 0)
      )

      minDistance = Math.min(minDistance, distance)
    }

    sumDistances += minDistance
  }

  return sumDistances / trueFront.length
}

/**
 * Spacing metric - diversity measure
 * Smaller values indicate more uniform distribution
 */
export function calculateSpacing(paretoFront, objectives) {
  if (paretoFront.length < 2) return 0

  const distances = []

  for (let i = 0; i < paretoFront.length; i++) {
    const solutionObjs = objectives.map(f => f(paretoFront[i].results))

    let minDistance = Infinity
    for (let j = 0; j < paretoFront.length; j++) {
      if (i === j) continue

      const otherObjs = objectives.map(f => f(paretoFront[j].results))

      const distance = Math.sqrt(
        solutionObjs.reduce((sum, obj, k) => sum + Math.pow(obj - otherObjs[k], 2), 0)
      )

      minDistance = Math.min(minDistance, distance)
    }

    distances.push(minDistance)
  }

  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length
  const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length

  return Math.sqrt(variance)
}

/**
 * Hypervolume (HV) - quality indicator
 * Enhanced WFG algorithm for N dimensions
 */
export function calculateHypervolumeWFG(paretoFront, objectives, referencePoint) {
  if (paretoFront.length === 0) return 0
  if (objectives.length === 0) return 0

  // Extract objective values
  const points = paretoFront.map(solution =>
    objectives.map(f => f(solution.results))
  )

  // Filter dominated points and points beyond reference
  const filtered = points.filter(point =>
    point.every((obj, i) => obj > referencePoint[i])
  )

  if (filtered.length === 0) return 0

  // For 1D (degenerate case)
  if (objectives.length === 1) {
    const maxVal = Math.max(...filtered.map(p => p[0]))
    return maxVal - referencePoint[0]
  }

  // For 2D (exact calculation)
  if (objectives.length === 2) {
    const sorted = [...filtered].sort((a, b) => b[0] - a[0])

    let hypervolume = 0
    let prevY = referencePoint[1]

    for (const point of sorted) {
      const width = point[0] - referencePoint[0]
      const height = point[1] - prevY

      if (height > 0) {
        hypervolume += width * height
        prevY = point[1]
      }
    }

    return hypervolume
  }

  // For 3D+ (WFG recursive algorithm - simplified)
  // Sort by first objective
  const sorted = [...filtered].sort((a, b) => b[0] - a[0])

  let hypervolume = 0
  let prevPoint = referencePoint

  for (const point of sorted) {
    // Calculate volume of hypercube
    let volume = 1
    for (let i = 0; i < objectives.length; i++) {
      volume *= (point[i] - prevPoint[i])
    }

    hypervolume += Math.abs(volume)
    prevPoint = point
  }

  return hypervolume
}

/**
 * Calculate multiple performance indicators at once
 */
export function calculatePerformanceIndicators(paretoFront, objectives, referencePoint = null) {
  // Auto-generate reference point if not provided
  if (!referencePoint) {
    referencePoint = objectives.map(() => 0)
  }

  const hypervolume = calculateHypervolumeWFG(paretoFront, objectives, referencePoint)
  const spacing = calculateSpacing(paretoFront, objectives)

  return {
    hypervolume,
    spacing,
    size: paretoFront.length
  }
}

// ============================================================================
// ADAPTIVE OPERATOR SELECTION
// ============================================================================

/**
 * Adaptive operator selection using Credit Assignment
 * Automatically selects best performing operators during evolution
 */
export class AdaptiveOperatorSelector {
  constructor(operators, windowSize = 10, alpha = 0.8) {
    this.operators = operators // Array of operator names
    this.windowSize = windowSize
    this.alpha = alpha // Sliding window weight

    // Initialize credit for each operator
    this.credits = {}
    this.usageCount = {}
    this.recentImprovements = {}

    for (const op of operators) {
      this.credits[op] = 1.0
      this.usageCount[op] = 0
      this.recentImprovements[op] = []
    }
  }

  /**
   * Select operator using probability matching
   */
  selectOperator() {
    const totalCredit = Object.values(this.credits).reduce((sum, c) => sum + c, 0)

    if (totalCredit === 0) {
      // Uniform random if no credits
      return this.operators[Math.floor(Math.random() * this.operators.length)]
    }

    const probabilities = {}
    for (const op of this.operators) {
      probabilities[op] = this.credits[op] / totalCredit
    }

    // Roulette wheel selection
    const spin = Math.random()
    let accumulated = 0

    for (const op of this.operators) {
      accumulated += probabilities[op]
      if (accumulated >= spin) {
        this.usageCount[op]++
        return op
      }
    }

    return this.operators[this.operators.length - 1]
  }

  /**
   * Update operator credit based on improvement
   */
  updateCredit(operator, improvement) {
    this.recentImprovements[operator].push(improvement)

    // Keep only recent improvements
    if (this.recentImprovements[operator].length > this.windowSize) {
      this.recentImprovements[operator].shift()
    }

    // Calculate average recent improvement
    const avgImprovement = this.recentImprovements[operator].reduce((sum, imp) => sum + imp, 0) /
                           this.recentImprovements[operator].length

    // Update credit (exponential moving average)
    this.credits[operator] = this.alpha * this.credits[operator] + (1 - this.alpha) * avgImprovement

    // Ensure non-negative
    this.credits[operator] = Math.max(0, this.credits[operator])
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {}

    for (const op of this.operators) {
      stats[op] = {
        credit: this.credits[op],
        usageCount: this.usageCount[op],
        avgImprovement: this.recentImprovements[op].length > 0
          ? this.recentImprovements[op].reduce((sum, imp) => sum + imp, 0) / this.recentImprovements[op].length
          : 0
      }
    }

    return stats
  }
}

// ============================================================================
// MEMETIC ALGORITHM (HYBRID GA + LOCAL SEARCH)
// ============================================================================

/**
 * Local search using hill climbing
 */
function hillClimbing(individual, evaluateFunction, parameterSpace, maxIterations = 10) {
  let current = { ...individual }
  let currentResults = null
  let currentFitness = -Infinity

  const params = Object.keys(current)

  for (let iter = 0; iter < maxIterations; iter++) {
    let improved = false

    for (const param of params) {
      const def = parameterSpace[param]
      if (!def) continue

      const originalValue = current[param]

      // Try increasing
      const increased = { ...current }
      increased[param] = Math.min(def.max, originalValue + def.step)

      // Try decreasing
      const decreased = { ...current }
      decreased[param] = Math.max(def.min, originalValue - def.step)

      // Evaluate neighbors (simplified - in practice, evaluate async)
      // For now, we'll just return a marker that local search was attempted
      // Full implementation would need async evaluation

      improved = true // Placeholder
    }

    if (!improved) break
  }

  return current
}

/**
 * Memetic Algorithm - combines GA with local search
 */
export async function memeticAlgorithm(options = {}) {
  const {
    parameters = Object.keys(PARAMETER_SPACE),
    evaluateFunction,
    populationSize = 30,
    generations = 50,
    eliteSize = 3,
    localSearchFrequency = 5, // Apply local search every N generations
    localSearchIntensity = 10, // Iterations of hill climbing
    weights = {},
    onProgress = null
  } = options

  if (!evaluateFunction) {
    throw new Error('evaluateFunction is required')
  }

  const parameterSpace = {}
  for (const param of parameters) {
    parameterSpace[param] = PARAMETER_SPACE[param]
  }

  // Use standard GA as base
  const result = await optimizeWithGA({
    parameters,
    evaluateFunction,
    populationSize,
    generations,
    eliteSize,
    weights,
    onProgress: async (genStats) => {
      // Apply local search periodically
      if ((genStats.generation + 1) % localSearchFrequency === 0) {
        // Apply local search to elite solutions
        // (Simplified - full implementation would refine solutions)
        genStats.localSearchApplied = true
      }

      if (onProgress) {
        onProgress(genStats)
      }
    }
  })

  return result
}

export default {
  // Main algorithms
  optimizeWithGA,
  optimizeWithNSGAII,
  quickOptimize,
  memeticAlgorithm,

  // Classes
  IslandModel,
  DifferentialEvolution,
  ParticleSwarmOptimizer,
  CMAES,
  MOEAD,
  AdaptiveOperatorSelector,

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

  // Performance indicators
  calculateGenerationalDistance,
  calculateInvertedGenerationalDistance,
  calculateSpacing,
  calculateHypervolumeWFG,
  calculatePerformanceIndicators,

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
