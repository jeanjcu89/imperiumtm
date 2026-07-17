// Client for the Netlify billing functions. Auth is the caller's Supabase
// access token; the functions re-verify manager role server-side.
const BASE = import.meta.env.VITE_BILLING_BASE ?? '/.netlify/functions';

export async function billingRequest(client, name, params = {}) {
  const { data } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return { data: null, error: { message: 'Not signed in.' } };
  try {
    const res = await fetch(`${BASE}/${name}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: { message: body.error ?? `Billing request failed (${res.status}).` } };
    }
    return { data: body, error: null };
  } catch {
    // Local dev without `netlify dev`, or functions not deployed yet.
    return { data: null, error: { message: 'Billing is not available in this environment.' } };
  }
}
