// config/airtable.ts
// Central source of truth for Airtable field IDs.
// Using IDs instead of names makes writes resilient to field renames in Airtable.

export const AIRTABLE_USERS_FIELDS = {
  name:       'fldI2cdP3D0ENxD07',
  email:      'fldKDCMozl6VcEdyx',
  timezone:   'fldeawOCI3Alufjiw',
  eventTypes: 'fldw4sG7B69I3byd1',
  supabaseId: 'fldeQ6pT4XWpVgCbB',
  isPremium:  'fld2Do8nR8pQ2IeZo',
  activeAccount: 'fldU3yh0kjbGDGhrM',
} as const;

export const AIRTABLE_FEEDBACK_FIELDS = {
  name:        'fldzZPXStciF6OTlo',
  email:       'fldINiTlPhiNFMlA6',
  message:     'fldvbE7B05VV3dRtq',
  supabaseId:  'fld5PlnzAwN0UtJXU',
  user:        'fld04gcuLDp3K9gz6',
  feedback_type: 'fldCOhhouBcKjxXQa',
} as const;
