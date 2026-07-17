// Aligns the Stripe subscription quantity with the company's active crew
// count. Called by the console after team changes; Stripe prorates.
import {
  handler, json, requireManager, activeCrewCount, stripe,
} from './_lib.mjs';

export default handler(async (req) => {
  const { company } = await requireManager(req);
  if (company.plan !== 'pro' || !company.stripe_subscription_id) {
    return json(200, { synced: false, reason: 'not-pro' });
  }

  const seats = Math.max(1, await activeCrewCount(company.id));
  const sub = await stripe(`subscriptions/${company.stripe_subscription_id}`, null, { method: 'GET' });
  const item = sub?.items?.data?.[0];
  if (!item) return json(502, { error: 'Subscription has no items to update.' });

  if (item.quantity === seats) return json(200, { synced: true, quantity: seats, changed: false });

  await stripe(`subscription_items/${item.id}`, {
    quantity: String(seats),
    proration_behavior: 'create_prorations',
  });
  return json(200, { synced: true, quantity: seats, changed: true });
});
