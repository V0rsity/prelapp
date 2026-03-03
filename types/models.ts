// types/models.ts

import {
  ReadinessMetricKey,
  SorenessMetricKey,
  TRAINING_METRIC_CONFIG,
  RECOVERY_METRIC_CONFIG,
} from '@/config/metrics';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
  created_at: string;
  is_premium: boolean;
  event_types: string[];
}

// Existing morning metrics (unchanged)
type MorningMetrics = {
  [K in ReadinessMetricKey as `${K}_morning`]: number | null;
} & {
  [K in SorenessMetricKey as `${K}_morning`]: number | null;
};

// Map each inputType literal → TypeScript field type
type InputTypeToFieldType<T extends string> =
  T extends "dropdown"    ? number | null :
  T extends "mileage"     ? number | null :
  T extends "multiselect" ? string[] | null :
  T extends "textarea"    ? string | null :
  never;

// Generic: given a config object and a field prefix, produce { prefix_key: FieldType }
// NOTE: `string & K` is required because template literals only accept `string`,
// but `keyof TConfig` is `string | number | symbol`.
type ConfigToFields<
  TConfig extends Record<string, { inputType: string }>,
  TPrefix extends string
> = {
  [K in keyof TConfig as `${TPrefix}${string & K}`]:
    InputTypeToFieldType<TConfig[K]['inputType']>;
};

// Produces: { training_intensity, training_types, training_muscles, training_mileage, training_notes }
type TrainingFields = ConfigToFields<typeof TRAINING_METRIC_CONFIG, 'training_'>;

// Produces: { recovery_activities, recovery_notes }
type RecoveryFields = ConfigToFields<typeof RECOVERY_METRIC_CONFIG, 'recovery_'>;

export interface DailyLog extends MorningMetrics, TrainingFields, RecoveryFields {
  id: number;
  created_at: string;
  user_id: string;
  date: string;
  morning_complete: boolean;
  notes_morning: string | null;
  readiness_score: number | null;
  training_complete: boolean;
  recovery_complete: boolean;
}
