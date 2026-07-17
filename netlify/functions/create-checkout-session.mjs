// Starts a Stripe Checkout for the Pro subscription. Quantity = active crew
// seats (min 1); managers are free. The webhook flips the company to Pro.
import {
  handler, json, requireManager, activeCrewCount, stripe, STRIPE_PRICE_ID, APP_URL,
} from './_lib.mjs';

export default handler(async (req) => {
  if (!STRIPE_PRICE_ID) {
    return json(503, { error: 'Billing is not configured yet (missing STRIPE_PRICE_ID).' });
  }
  const { user, company } = await requireManager(req);
  // Any live subscription (even past_due/unpaid/incomplete) means changes
  // belong in the portal — never stack a second subscription.
  const DEAD = new Set(['canceled', 'incomplete_expired']);
  if (company.plan === 'pro'
      || (company.stripe_subscription_id && !DEAD.has(company.stripe_status))) {
    return json(409, { error: 'This company already has a subscription — use "Manage billing" instead.' });
  }

  const seats = Math.max(1, await activeCrewCount(company.id));
  const params = {
    mode: 'subscription',
    'line_items[0][price]': STRIPE_PRICE_ID,
    'line_items[0][quantity]': String(seats),
    client_reference_id: company.id,
    'subscription_data[metadata][company_id]': company.id,
    allow_promotion_codes: 'true',
    success_url: `${APP_URL}/?billing=success#settings`,
    cancel_url: `${APP_URL}/?billing=cancelled#settings`,
  };
  // Returning customers keep their Stripe history; first-timers get their
  // email prefilled and the customer is created by Checkout.
  if (company.stripe_customer_id) params.customer = company.stripe_customer_id;
  else if (user.email) params.customer_email = user.email;

  const session = await stripe('checkout/sessions', params);
  return json(200, { url: session.url });
});
