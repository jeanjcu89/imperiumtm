// Stripe → Supabase mirror. Stripe is the source of truth for Pro status;
// this endpoint keeps companies.plan / stripe_* in sync. Registered in the
// Stripe dashboard for: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted.
import {
  json, preflight, configured, supa, stripe,
  verifyStripeSignature, STRIPE_WEBHOOK_SECRET,
} from './_lib.mjs';

const PRO_STATUSES = new Set(['active', 'trialing', 'past_due']);

// Event-supplied ids are interpolated into PostgREST filters — accept only
// the exact shapes Stripe/Supabase produce.
const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v ?? '');
const isSubId = (v) => /^sub_\w+$/.test(v ?? '');

// `filter` (beyond the id match) scopes the PATCH so late-retried or
// out-of-order events about a subscription that is NO LONGER the company's
// current one become no-ops instead of clobbering live Pro state.
const patchCompany = (companyId, fields, filter = '') =>
  supa(`companies?id=eq.${companyId}${filter}`, {
    method: 'PATCH',
    body: fields,
    headers: { Prefer: 'return=minimal' },
  });

async function companyIdForSubscription(sub) {
  if (isUuid(sub?.metadata?.company_id)) return sub.metadata.company_id;
  const rows = await supa(`companies?stripe_subscription_id=eq.${sub.id}&select=id`);
  return rows?.[0]?.id ?? null;
}

export default async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!configured() || !STRIPE_WEBHOOK_SECRET) {
    return json(503, { error: 'Webhook not configured' });
  }

  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!verifyStripeSignature(payload, sig, STRIPE_WEBHOOK_SECRET)) {
    return json(400, { error: 'Invalid signature' });
  }

  let event;
  try { event = JSON.parse(payload); } catch { return json(400, { error: 'Bad payload' }); }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const companyId = session.client_reference_id;
        if (!isUuid(companyId) || session.mode !== 'subscription' || !isSubId(session.subscription)) break;
        // Pull the subscription for its live status (usually 'active').
        const sub = await stripe(`subscriptions/${session.subscription}`, null, { method: 'GET' });
        // Claim only when the slot is empty, already this subscription, or
        // not currently Pro — a replayed old checkout must not displace a
        // newer live subscription.
        await patchCompany(companyId, {
          plan: PRO_STATUSES.has(sub.status) ? 'pro' : 'free',
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
          stripe_subscription_id: sub.id,
          stripe_status: sub.status,
        }, `&or=(stripe_subscription_id.is.null,stripe_subscription_id.eq.${sub.id},plan.neq.pro)`);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        if (!isSubId(sub?.id)) break;
        const companyId = await companyIdForSubscription(sub);
        if (!companyId) break;
        await patchCompany(companyId, {
          plan: PRO_STATUSES.has(sub.status) ? 'pro' : 'free',
          stripe_subscription_id: sub.id,
          stripe_status: sub.status,
        }, `&or=(stripe_subscription_id.is.null,stripe_subscription_id.eq.${sub.id})`);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        if (!isSubId(sub?.id)) break;
        const companyId = await companyIdForSubscription(sub);
        if (!companyId) break;
        // Only the company's CURRENT subscription may downgrade it — a
        // retried delete of an old subscription is a no-op.
        await patchCompany(companyId, {
          plan: 'free',
          stripe_subscription_id: null,
          stripe_status: sub.status ?? 'canceled',
        }, `&stripe_subscription_id=eq.${sub.id}`);
        break;
      }
      default:
        break; // unhandled event types are acknowledged, not errors
    }
  } catch (e) {
    // 500 → Stripe retries with backoff, which is what we want for a
    // transient Supabase hiccup.
    console.error('[stripe-webhook]', event?.type, e);
    return json(500, { error: 'Handler failed' });
  }

  return json(200, { received: true });
};
