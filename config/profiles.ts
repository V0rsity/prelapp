// config/profiles.ts

// ─── Event Types ───────────────────────────────────────────────────────────────

export interface EventTypeOption {
  value: string;
  title: string;
  description: string;
}

// Single source of truth for all athlete event types.
// value must match the string stored in users.event_types[] in Supabase.
export const EVENT_TYPE_CONFIG: EventTypeOption[] = [
  {
    value: 'runner',
    title: 'Runner',
    description: 'Distance and sprint events (100m-10000m), Cross Country',
  },
  {
    value: 'jumper',
    title: 'Jumper',
    description: 'Long jump, high jump, triple jump',
  },
  {
    value: 'thrower',
    title: 'Thrower',
    description: 'Shot put, discus, javelin, hammer',
  },
  {
    value: 'hurdler',
    title: 'Hurdler',
    description: '100m/110m hurdles, 300m hurdles',
  },
  {
    value: 'pole_vaulter',
    title: 'Pole Vaulter',
    description: 'Pole vault events',
  },
];

// Returns the display title for an event type value, falling back to the raw value.
export function getEventTypeTitle(value: string): string {
  return EVENT_TYPE_CONFIG.find(e => e.value === value)?.title ?? value;
}

