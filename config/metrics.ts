// config/metrics.ts

// Note: the key is the part that comes before '_morning' in supabase ex: 'calf_morning'. When adding, must also add to supabase.
export const SORENESS_METRIC_CONFIG = {
  quad: {
    label: "Quad Soreness",
    shortLabel: "Quads",
    eventTypes: ["runner", "jumper", "thrower", "hurdler", "pole_vaulter"],
  },
  hamstring: {
    label: "Hamstring Soreness",
    shortLabel: "Hamstrings",
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

// Helper functions that derive from the single source of truth
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
export type SorenessMetricKey = keyof typeof SORENESS_METRIC_CONFIG;

const READINESS_METRIC_CONFIG = {
  sleep: {
    lable: "Sleep",
  },
  energy: {
    lable: "Energy",
  },
  stress: {
    lable: "Stress",
  },
  hydration: {
    lable: "Hydration",
  },
  nutrition: {
    lable: "Nutrition",
  },
}