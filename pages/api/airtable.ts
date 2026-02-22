// pages/api/airtable.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { AIRTABLE_USERS_FIELDS as F } from '../../config/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fields, upsert } = req.body;

  if (!fields?.[F.supabaseId]) {
    return res.status(400).json({ error: 'supabaseId field is required' });
  }

  try {
    const payload = upsert
      ? {
          typecast: true,
          performUpsert: { fieldsToMergeOn: [F.supabaseId] },
          records: [{ fields }],
        }
      : { records: [{ fields }] };

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_USERS_TABLE_ID}`,
      {
        method: upsert ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[airtable] error:', JSON.stringify(error, null, 2));
      return res.status(response.status).json({ error });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
