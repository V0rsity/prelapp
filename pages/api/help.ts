// pages/api/help.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { AIRTABLE_HELP_FIELDS as H } from '../../config/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message, user_id } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }

  const fields: Record<string, unknown> = {
    [H.name]:    name,
    [H.email]:   email,
    [H.message]: message,
  };

  if (user_id) fields[H.supabaseId] = user_id;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_HELP_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{ fields }],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[help] Airtable error:', JSON.stringify(error, null, 2));
      return res.status(response.status).json({ error });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
