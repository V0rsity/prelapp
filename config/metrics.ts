// config/metrics.ts

// Note: the key is the part that comes before '_morning' in supabase ex: 'calf_morning'. When adding, must also add to supabase.

// General readiness metrics available to all athletes. Remember to add the icon in MorningReadiness and EditLogModal
export const READINESS_METRIC_CONFIG = {
  sleep: {
    label: "Sleep Quality",
    shortLabel: "Sleep",
    minLabel: "Poor",
    maxLabel: "Excellent",
  },
  energy: {
    label: "Energy Level",
    shortLabel: "Energy",
    minLabel: "Low",
    maxLabel: "High",
  },
  stress: {
    label: "Stress",
    shortLabel: "Stress",
    minLabel: "Overwhelmed",
    maxLabel: "Calm",
  },
  hydration: {
    label: "Hydration",
    shortLabel: "Hydration",
    minLabel: "Poor",
    maxLabel: "Excellent",
  },
  nutrition: {
    label: "Nutrition",
    shortLabel: "Nutrition",
    minLabel: "Poor",
    maxLabel: "Excellent",
  },
} as const;

// Soreness metrics based on athlete event types
export const SORENESS_METRIC_CONFIG = {
  quad: {
    label: "Quad Soreness",
    shortLabel: "Quads",
    eventTypes: ["runner", "jumper", "thrower", "hurdler", "pole_vaulter"],
  },
  hamstring: {
    label: "Hamstring Soreness",
    shortLabel: "Hamstring",
    eventTypes: ["runner", "jumper", "hurdler", "pole_vaulter"],
  },
  hip: {
    label: "Hip Soreness",
    shortLabel: "Hips",
    eventTypes: ["runner", "jumper", "thrower", "hurdler", "pole_vaulter"],
  },
  calf: {
    label: "Calf Soreness",
    shortLabel: "Calves",
    eventTypes: ["runner", "jumper", "hurdler", "pole_vaulter"],
  },
  shin: {
    label: "Shin Soreness",
    shortLabel: "Shins",
    eventTypes: ["runner", "hurdler"],
  },
} as const;

// Helper functions for soreness metrics
export const getSorenessMetrics = () => {
  return Object.entries(SORENESS_METRIC_CONFIG).map(([key, config]) => ({
    key,
    label: config.label,
  }));
};

export const getSorenessMetricsShortView = () => {
  return Object.entries(SORENESS_METRIC_CONFIG).map(([key, config]) => ({
    key,
    label: config.shortLabel,
  }));
};

export const getSorenessMetricsArray = () => {
  return Object.entries(SORENESS_METRIC_CONFIG).map(([key, config]) => ({
    key,
    ...config,
  }));
};

// Type helpers
export type ReadinessMetricKey = keyof typeof READINESS_METRIC_CONFIG;
export type SorenessMetricKey = keyof typeof SORENESS_METRIC_CONFIG;