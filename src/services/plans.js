/**
 * The actual plans Aurevo sells. This is the single source of truth — both
 * the frontend (to render prices) and the backend checkout endpoints (to
 * know what to charge) import from here, so there's never a mismatch
 * between what's displayed and what's charged.
 *
 * Adjust these to your real pricing before launch. `amount` is in the
 * major unit of `currency` (e.g. 4.80 USD, not 480 cents) — each payment
 * adapter converts to whatever subunit its API expects.
 */
export const PLANS = [
  { id: "week", label: "1 Week", amount: 1.0, currency: "USD", billing: "Weekly" },
  { id: "biweek", label: "2 Weeks", amount: 3.0, currency: "USD", billing: "Every 2 weeks" },
  { id: "month", label: "1 Month", amount: 4.8, currency: "USD", billing: "Monthly" },
];

export function getPlanById(id) {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan id: ${id}`);
  return plan;
}
