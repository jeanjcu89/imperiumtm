// Shared plumbing for the billing functions. No SDKs: Stripe's REST API is
// form-encoded HTTPS and Supabase is PostgREST — plain fetch keeps the
// functions dependency-free and the deploy lean.
import crypto from 'node:crypto';

export const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
export const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? '';
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
export const APP_URL = (process.env.APP_URL ?? 'https://app.imperiumtm.com').replace(/\/$/, '');

// The console runs on other origins in dev (localhost:5173); auth is the
// Supabase JWT, so a permissive CORS policy is safe for these endpoints.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

export const preflight = () => new Response(null, { status: 204, headers: CORS });

export function configured() {
  return SUPABASE_URL && SERVICE_KEY && STRIPE_KEY;
}

// PostgREST request with the service role key (bypasses RLS — server only).
export async function supa(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  return data;
}

// Resolves the caller from their Supabase access token and asserts they are
// an ACTIVE MANAGER. Returns { user, profile, company } or throws HttpError.
//
// `safe` gates whether `message` reaches the browser. Default false (secure
// by default): upstream errors — e.g. a Stripe "Invalid API Key provided:
// mk_…" — are logged server-side but shown to the user as a generic line,
// so key fragments and internals never leak. Only messages WE authored pass
// `{ safe: true }`.
export class HttpError extends Error {
  constructor(status, message, { safe = false } = {}) {
    super(message);
    this.status = status;
    this.safe = safe;
  }
}

export async function requireManager(req) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw new HttpError(401, 'Missing bearer token', { safe: true });

  const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!uRes.ok) throw new HttpError(401, 'Invalid or expired session', { safe: true });
  const user = await uRes.json();

  const rows = await supa(`profiles?id=eq.${user.id}&select=id,role,active,company_id`);
  const profile = rows?.[0];
  if (!profile) throw new HttpError(403, 'No profile for this account', { safe: true });
  if (profile.role !== 'manager' || !profile.active) {
    throw new HttpError(403, 'Only an active manager can manage billing', { safe: true });
  }

  const companies = await supa(
    `companies?id=eq.${profile.company_id}&select=id,name,plan,trial_ends_at,stripe_customer_id,stripe_subscription_id,stripe_status`,
  );
  const company = companies?.[0];
  if (!company) throw new HttpError(403, 'Company not found', { safe: true });
  return { user, profile, company };
}

export async function activeCrewCount(companyId) {
  const rows = await supa(
    `profiles?company_id=eq.${companyId}&role=eq.crew&active=is.true&select=id`,
  );
  return rows?.length ?? 0;
}

// Stripe REST call. `params` is a flat object of form fields — nested keys
// are written Stripe-style by the caller (e.g. 'line_items[0][price]').
export async function stripe(path, params, { method = 'POST' } = {}) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : new URLSearchParams(params ?? {}),
  });
  const data = await res.json();
  if (!res.ok) {
    // Unsafe by default: Stripe's message can contain a key fragment or
    // other internals. Logged by the handler, shown to the user as generic.
    throw new HttpError(res.status === 401 ? 500 : 502,
      data?.error?.message ?? `Stripe ${path} failed (${res.status})`);
  }
  return data;
}

// Verifies a Stripe webhook signature header ("t=...,v1=...,v1=...") against
// the raw payload. https://docs.stripe.com/webhooks#verify-manually
export function verifyStripeSignature(payload, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  let t = null;
  const v1s = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=', 2);
    if (k?.trim() === 't') t = v;
    if (k?.trim() === 'v1') v1s.push(v);
  }
  if (!t || v1s.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${payload}`, 'utf8').digest('hex');
  const expBuf = Buffer.from(expected, 'utf8');
  return v1s.some(v => {
    const got = Buffer.from(v ?? '', 'utf8');
    return got.length === expBuf.length && crypto.timingSafeEqual(got, expBuf);
  });
}

// Shown to the user when the real error isn't safe to surface. The full
// detail always goes to the function logs (Netlify → Functions → logs).
const GENERIC_ERROR =
  'Couldn’t reach billing just now — try again in a moment. If it keeps happening, email info@margian.co.';

// Wraps a handler with OPTIONS preflight + error mapping.
export const handler = (fn) => async (req, context) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    if (!configured()) {
      return json(503, { error: 'Billing is not configured yet (missing environment variables).' });
    }
    return await fn(req, context);
  } catch (e) {
    if (e instanceof HttpError) {
      if (e.safe) return json(e.status, { error: e.message });
      // Upstream/internal detail — log it, but hand the user the generic line.
      console.error('[billing]', e.status, e.message);
      return json(e.status, { error: GENERIC_ERROR });
    }
    console.error('[billing]', e);
    return json(500, { error: GENERIC_ERROR });
  }
};
