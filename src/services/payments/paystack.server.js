/**
 * Paystack checkout — server-side only: secret key never touches the
 * browser. This is Aurevo's card processor (Visa/Mastercard/Verve), with
 * bank transfer and USSD added for Nigerian users.
 *
 * Docs: https://paystack.com/docs/payments/accept-payments/
 */
import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function createPaystackCheckout({ plan, user, callbackUrl, country }) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not set. Add your live secret key to .env.server before accepting payments.");
  }

  // Card (Visa/Mastercard/Verve) always available. Nigerian users also get
  // bank transfer and USSD — Opay/PalmPay balances are reachable through
  // "bank_transfer" since those wallets have ordinary account numbers, it
  // just won't say "Opay"/"PalmPay" on the checkout button, only "Bank
  // Transfer" / "USSD".
  const channels = country === "NG" ? ["card", "bank_transfer", "ussd"] : ["card"];

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: Math.round(plan.amount * 100), // Paystack expects kobo, not naira
      currency: plan.currency,
      channels,
      callback_url: callbackUrl,
      reference: `aurevo-${plan.id}-${Date.now()}-${user.id}`,
      metadata: { plan_id: plan.id, uid: user.id, username: user.username },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || "Paystack failed to create the checkout session.");
  }
  return { checkoutUrl: data.data.authorization_url, reference: data.data.reference };
}

export async function verifyPaystackTransaction(reference) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not set.");
  }
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  return {
    verified: data.status === true && data.data?.status === "success",
    amount: data.data?.amount ? data.data.amount / 100 : null,
    currency: data.data?.currency,
    reference: data.data?.reference,
    planId: data.data?.metadata?.plan_id,
    uid: data.data?.metadata?.uid,
    raw: data,
  };
}

/** Verifies Paystack's webhook signature (x-paystack-signature header) —
 *  an HMAC-SHA512 of the raw request body using your secret key. Never
 *  trust a webhook body without checking this first; anyone can POST to
 *  a public URL pretending to be Paystack otherwise. */
export function verifyPaystackWebhookSignature(rawBody, signatureHeader) {
  if (!PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set.");
  const expected = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  return expected === signatureHeader;
}
