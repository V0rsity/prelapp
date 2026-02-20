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

// Stored in supabase as training_intensity, training_notes, training_types etc.
export const TRAINING_METRIC_CONFIG = {
  // The key is the int2 value stored in supabase, the value is what is displayed.
  intensity: {
    label: "Intensity",
    inputType: "dropdown" as const,
    defaultValue: 3,
    options: {
      1: { label: "Recovery", color: "#0000FF"},
      2: { label: "Easy", color: "#22C55E" },
      3: { label: "Moderate", color: "#FFFF00" },
      4: { label: "Difficult", color: "#F97316" },
      5: { label: "Intense", color: "#EF4444" },
    }
  },
  // training_types is a text array
  // Only present as an option if userProfile.event_types includes any of the eventTypes
  types: {
    label: "Training Types",
    inputType: "multiselect" as const,
    defaultValue: [] as string[],
    options: {
      strength: {
        label: "Weights",
        fillColor: "#000000",
        textColor: "#FFFFFF",
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"] // all
      },
      distance: {
        label: "Distance",
        fillColor: "#0000FF",
        textColor: "#FFFFFF",
        eventTypes: ["runner"]
      },
      sprints: {
        label: "Sprints",
        fillColor: "#FFFF00",
        textColor: "#000000",
        eventTypes: ["runner", "hurdler"]
      },
      crosstraining: {
        label: "Cross-Training",
        fillColor: "#567567",
        textColor: "#000000",
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"],
      }
    }
  },
  // training_muscles is a text array
  // This should only show up if the associated training type "strength" is selected
  muscles: {
    label: "Targeted Muscles (Strength)",
    inputType: "multiselect" as const,
    dependsOn: { field: "types" as const, values: ["strength"] as const },
    defaultValue: [] as string[],
    pillStyle: {
      fillColor: "#000000",
      textColor: "#ffffff",
      borderColor: "#ffffff",
    },
    options: {
      back: { label: "Back" },
      chest: { label: "Chest" },
      core: { label: "Core" },
      arms: { label: "Arms" },
      legs: { label: "Legs" },
    }
  },
  // This should only show up if the associated training type "distance" is selected
  // Mileage is a Numeric(4, 2)
  mileage: {
    label: "Mileage (Distance)",
    inputType: "mileage" as const,
    dependsOn: { field: "types" as const, values: ["distance"] as const },
    defaultValue: "",
    mileageConfig: {
      maxValue: 99.99,
      decimalPlaces: 2,
      placeholder: "0.00",
    },
    unitLabel: "miles",
  },
  notes: {
    label: "Training Notes",
    inputType: "textarea" as const,
    defaultValue: "",
    textareaConfig: {
      rows: 6,
      placeholder: "Add notes about your training session...",
    }
  }
} as const;

// Stored in Supabase as recovery_activities and recovery_notes!
export const RECOVERY_METRIC_CONFIG = {
  activities: {
    inputType: "multiselect" as const,
    defaultValue: [] as string[],
    options: {
      cooldown: {
        label: "Cool Down",
        description: "Jogging, stretching, mobility, etc",
        category: "post_training",
        requiresTraining: true,
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"],
      },
      stretching: {
        label: "Stretching",
        description: "Stretches, rolling out, etc.",
        category: "both", // Only one that is both!
        requiresTraining: false,
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"],
      },
      carbs_protein: {
        label: "Immediate Carbs / Protein",
        description: "Ideally 30 mins. after training",
        category: "post_training",
        requiresTraining: true,
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"],
      },
      hydration: {
        label: "Hydration",
        description: "Replenish electrolytes immediately",
        category: "post_training",
        requiresTraining: true,
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"],
      },
      hip_mobility: {
        label: "Hip Mobility",
        category: "additional",
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"],
        fillColor: "#000000",
        textColor: "#FFFFFF",
      },
      ice_bath: {
        label: "Ice Bath",
        category: "additional",
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"],
        fillColor: "#0000FF",
        textColor: "#FFFFFF",
      },
      rolling_out: {
        label: "Rolling Out",
        category: "additional",
        eventTypes: ["runner", "jumper", "hurdler", "thrower", "pole_vaulter"],
        fillColor: "#efbf04",
        textColor: "#000000",
      }
    },
  },
  notes: {
    label: "Recovery Notes",
    inputType: "textarea" as const,
    defaultValue: "",
    textareaConfig: {
      rows: 3,
      placeholder: "Add notes about your recovery routine...",
    }
  }
} as const;

// Activity option type derived from RECOVERY_METRIC_CONFIG
export type RecoveryActivityOption = {
  key: string;
  label: string;
  category: string;
  eventTypes: readonly string[];
  requiresTraining?: boolean;
  description?: string;
  fillColor?: string;
  textColor?: string;
};

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

// Helper functions for training metrics
export const getVisibleTrainingFields = (userEventTypes: string[]) => {
  return Object.entries(TRAINING_METRIC_CONFIG)
    .filter(([key, config]) => {
      // If field has eventTypes requirement, check if user matches
      if ('options' in config && typeof config.options === 'object') {
        const options = Object.values(config.options);
        if (options.length > 0 && 'eventTypes' in options[0]) {
          return options.some((opt: any) => 
            opt.eventTypes?.some((eventType: string) => userEventTypes.includes(eventType))
          );
        }
      }
      // Otherwise, show the field
      return true;
    })
    .map(([key, config]) => ({ key, config }));
};

export const shouldShowField = (
  fieldKey: string,
  formState: Record<string, any>
) => {
  const config = TRAINING_METRIC_CONFIG[fieldKey as keyof typeof TRAINING_METRIC_CONFIG];
  
  if (!config || !('dependsOn' in config) || !config.dependsOn) {
    return true;
  }

  const dependsOn = config.dependsOn as { field: string; values: readonly string[] };
  const { field, values } = dependsOn;
  const fieldValue = formState[field];

  if (Array.isArray(fieldValue)) {
    return (values as readonly string[]).some(v => fieldValue.includes(v));
  }

  return (values as readonly string[]).includes(fieldValue);
};

// Type helpers
export type ReadinessMetricKey = keyof typeof READINESS_METRIC_CONFIG;
export type SorenessMetricKey = keyof typeof SORENESS_METRIC_CONFIG;
export type TrainingMetricKey = keyof typeof TRAINING_METRIC_CONFIG;
export type RecoveryMetricKey = keyof typeof RECOVERY_METRIC_CONFIG;