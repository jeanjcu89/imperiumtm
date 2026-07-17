// Newsletter signup → Resend Audience. Ships dark: until RESEND_API_KEY and
// RESEND_AUDIENCE_ID are set on the LANDING site's Netlify env, it answers
// 503 and the page shows a friendly "not open yet" message.
const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const key = process.env.RESEND_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audience) {
    return json(503, { error: 'Newsletter signup isn’t open yet — email info@margian.co and we’ll add you.' });
  }

  let email = '';
  try { email = String((await req.json())?.email ?? '').trim(); } catch { /* fall through */ }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Enter a valid email address.' });
  }

  const res = await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  // 409 = already subscribed — success from the visitor's point of view.
  if (!res.ok && res.status !== 409) {
    console.error('[subscribe] resend error', res.status, await res.text().catch(() => ''));
    return json(502, { error: 'Something went wrong — try again in a moment.' });
  }
  return json(200, { ok: true });
};
