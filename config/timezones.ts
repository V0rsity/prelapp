// config/timezones.ts

// ─── Timezones ─────────────────────────────────────────────────────────────────

export interface TimezoneOption {
  label: string;
  value: string;
}

export interface TimezoneGroup {
  group: string;
  zones: TimezoneOption[];
}

// Grouped list of English-speaking / common timezones for the timezone selector.
// value must be a valid IANA timezone identifier.
export const TIMEZONE_CONFIG: TimezoneGroup[] = [
  {
    group: 'United States',
    zones: [
      { label: 'Eastern Time (ET) — New York', value: 'America/New_York' },
      { label: 'Central Time (CT) — Chicago', value: 'America/Chicago' },
      { label: 'Mountain Time (MT) — Denver', value: 'America/Denver' },
      { label: 'Pacific Time (PT) — Los Angeles', value: 'America/Los_Angeles' },
      { label: 'Alaska Time — Anchorage', value: 'America/Anchorage' },
      { label: 'Hawaii Time — Honolulu', value: 'Pacific/Honolulu' },
    ],
  },
  {
    group: 'Canada',
    zones: [
      { label: 'Atlantic Time (AT) — Halifax', value: 'America/Halifax' },
      { label: 'Eastern Time (ET) — Toronto', value: 'America/Toronto' },
      { label: 'Central Time (CT) — Winnipeg', value: 'America/Winnipeg' },
      { label: 'Mountain Time (MT) — Edmonton', value: 'America/Edmonton' },
      { label: 'Pacific Time (PT) — Vancouver', value: 'America/Vancouver' },
    ],
  },
  {
    group: 'United Kingdom & Ireland',
    zones: [
      { label: 'London (GMT/BST)', value: 'Europe/London' },
      { label: 'Dublin (GMT/IST)', value: 'Europe/Dublin' },
    ],
  },
  {
    group: 'Australia',
    zones: [
      { label: 'Perth (AWST)', value: 'Australia/Perth' },
      { label: 'Darwin (ACST)', value: 'Australia/Darwin' },
      { label: 'Adelaide (ACST/ACDT)', value: 'Australia/Adelaide' },
      { label: 'Brisbane (AEST)', value: 'Australia/Brisbane' },
      { label: 'Sydney / Melbourne (AEST/AEDT)', value: 'Australia/Sydney' },
    ],
  },
  {
    group: 'New Zealand',
    zones: [
      { label: 'Auckland (NZST/NZDT)', value: 'Pacific/Auckland' },
    ],
  },
  {
    group: 'Africa',
    zones: [
      { label: 'Accra / Abuja (GMT/WAT)', value: 'Africa/Lagos' },
      { label: 'Nairobi (EAT)', value: 'Africa/Nairobi' },
      { label: 'Johannesburg (SAST)', value: 'Africa/Johannesburg' },
    ],
  },
  {
    group: 'Asia & Pacific',
    zones: [
      { label: 'Mumbai / New Delhi (IST)', value: 'Asia/Kolkata' },
      { label: 'Karachi (PKT)', value: 'Asia/Karachi' },
      { label: 'Kuala Lumpur (MYT)', value: 'Asia/Kuala_Lumpur' },
      { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
      { label: 'Manila (PHT)', value: 'Asia/Manila' },
    ],
  },
  {
    group: 'Caribbean',
    zones: [
      { label: 'Jamaica (EST)', value: 'America/Jamaica' },
      { label: 'Port of Spain (AST)', value: 'America/Port_of_Spain' },
    ],
  },
];

// Returns the display label for a timezone value, falling back to the raw value.
export function getTimezoneLabel(value: string): string {
  for (const group of TIMEZONE_CONFIG) {
    for (const zone of group.zones) {
      if (zone.value === value) return zone.label;
    }
  }
  return value;
}
