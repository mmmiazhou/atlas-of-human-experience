import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const { data: dreams, error } = await supabase
    .from('dreams')
    .select('id, text, region, lat, lon, themes, essence, contact, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return res.status(500).json({ error: error.message });

  const ids = (dreams ?? []).map(d => d.id);
  const { data: connections } = ids.length
    ? await supabase
        .from('dream_connections')
        .select('dream_a, dream_b, shared_themes, reason, strength')
        .or(`dream_a.in.(${ids.join(',')}),dream_b.in.(${ids.join(',')})`)
    : { data: [] };

  return res.status(200).json({ dreams: dreams ?? [], connections: connections ?? [] });
}
