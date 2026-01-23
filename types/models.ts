// types/models.ts

import { ReadinessMetricKey, SorenessMetricKey } from '@/config/metrics';

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

// Create a dynamic type for all morning metrics
type MorningMetrics = {
  [K in ReadinessMetricKey as `${K}_morning`]: number | null;
} & {
  [K in SorenessMetricKey as `${K}_morning`]: number | null;
};

export interface DailyLog extends MorningMetrics {
  id: number;
  created_at: string;
  user_id: string;
  date: string;
  morning_complete: boolean;
  notes_morning: string | null;
  readiness_score: number | null;
}