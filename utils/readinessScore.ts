export type ReadinessInputs = {
  sleep: number;
  energy: number;
  stress: number;
  hydration: number;
  nutrition: number;
  quad: number | null;
  hamstring: number | null;
  hip: number | null;
  calf: number | null;
  shin: number | null;
};

export type ReadinessWeights = {
  sleep: number;
  energy: number;
  stress: number;
  hydration: number;
  nutrition: number;
  soreness: number; // Combined weight for all soreness metrics
};

export const defaultReadinessWeights: ReadinessWeights = {
  sleep: 1.5,
  energy: 1.5,
  stress: 1.0,
  hydration: 1.0,
  nutrition: 1.0,
  soreness: 0.24, // 24% total for all soreness combined
};

export function calculateReadinessScore(
  inputs: ReadinessInputs,
  weights: ReadinessWeights = defaultReadinessWeights
): number {
  // Calculate general metrics (always present)
  let weightedSum = 
    inputs.sleep * weights.sleep +
    inputs.energy * weights.energy +
    inputs.stress * weights.stress +
    inputs.hydration * weights.hydration +
    inputs.nutrition * weights.nutrition;
  
  let weightTotal = 
    weights.sleep +
    weights.energy +
    weights.stress +
    weights.hydration +
    weights.nutrition;

  // Calculate soreness metrics (only include non-null values)
  const sorenessMetrics = [
    inputs.quad,
    inputs.hamstring,
    inputs.hip,
    inputs.calf,
    inputs.shin,
  ].filter((value): value is number => value !== null);

  // If there are any soreness metrics, add them to the calculation
  if (sorenessMetrics.length > 0) {
    const sorenessAverage = sorenessMetrics.reduce((sum, val) => sum + val, 0) / sorenessMetrics.length;
    weightedSum += sorenessAverage * weights.soreness;
    weightTotal += weights.soreness;
  }

  const rawAverage = weightedSum / weightTotal; // 1 → 5

  // Normalize 1–5 → 0–1
  const normalized = (rawAverage - 1) / 4;

  // Hard-coded scale: 50–99
  const scaled = 50 + normalized * (99 - 50);

  return Math.round(Math.max(50, Math.min(99, scaled)));
}