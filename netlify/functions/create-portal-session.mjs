// Opens the Stripe Billing Portal (card changes, invoices, cancel) for the
// company's Stripe customer.
import { handler, json, requireManager, stripe, APP_URL } from './_lib.mjs';

export default handler(async (req) => {
  const { company } = await requireManager(req);
  if (!company.stripe_customer_id) {
    return json(409, { error: 'No billing account yet — upgrade to Pro first.' });
  }
  const session = await stripe('billing_portal/sessions', {
    customer: company.stripe_customer_id,
    return_url: `${APP_URL}/#settings`,
  });
  return json(200, { url: session.url });
});
