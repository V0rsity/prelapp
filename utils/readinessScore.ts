export type ReadinessInputs = {
  sleep: number;
  energy: number;
  stress: number;
  hydration: number;
  nutrition: number;
  quad: number;
  hamstring: number;
  hip: number;
  calf: number;
  shin: number;
};

export type ReadinessWeights = {
  sleep: number;
  energy: number;
  stress: number;
  hydration: number;
  nutrition: number;
  quad: number;
  hamstring: number;
  hip: number;
  calf: number;
  shin: number;
};

export const defaultReadinessWeights: ReadinessWeights = {
  sleep: 1.5,
  energy: 1.5,
  stress: 1.0,
  hydration: 1.0,
  nutrition: 1.0,
  quad: 0.8,
  hamstring: 0.8,
  hip: 0.8,
  calf: 0.8,
  shin: 0.8,
};

export function calculateReadinessScore(
  inputs: ReadinessInputs,
  weights: ReadinessWeights = defaultReadinessWeights
): number {
  let weightedSum = 0;
  let weightTotal = 0;

  (Object.keys(inputs) as (keyof ReadinessInputs)[]).forEach((key) => {
    weightedSum += inputs[key] * weights[key];
    weightTotal += weights[key];
  });

  const rawAverage = weightedSum / weightTotal; // 1 → 5

  // Normalize 1–5 → 0–1
  const normalized = (rawAverage - 1) / 4;

  // Hard-coded scale: 50–99
  const scaled = 50 + normalized * (99 - 50);

  return Math.round(Math.max(50, Math.min(99, scaled)));
}
