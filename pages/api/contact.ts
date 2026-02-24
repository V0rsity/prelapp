// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { AIRTABLE_FEEDBACK_FIELDS as F } from '../../config/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message, user_id, feedback_type } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }

  const fields: Record<string, unknown> = {
    [F.name]:    name,
    [F.email]:   email,
    [F.message]: message,
  };

  if (user_id) fields[F.supabaseId] = user_id;
  if (feedback_type) fields[F.feedback_type] = feedback_type;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_FEEDBACK_TABLE_ID}`,
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
      console.error('[contact] Airtable error:', JSON.stringify(error, null, 2));
      return res.status(response.status).json({ error });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
