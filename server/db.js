import { db } from "./firebaseAdmin.js";
import { getPlanById } from "../src/services/plans.js";

/** Billing period length per plan, used to compute when a subscription
 *  should expire after a successful payment. */
const PLAN_DURATION_MS = {
  week: 7 * 24 * 60 * 60 * 1000,
  biweek: 14 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

export async function getUserProfile(uid) {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? snap.data() : null;
}

/** Called once, right after Firestore sign-up, to store the profile fields
 *  Firebase Auth itself doesn't hold (username, country, language). */
export async function upsertUserProfile(uid, fields) {
  await db.collection("users").doc(uid).set(fields, { merge: true });
}

/**
 * Records a confirmed payment and extends the user's subscription.
 * Called only from a verified webhook or a server-side verify call — never
 * from anything the client could spoof directly.
 */
export async function recordConfirmedPayment({ uid, planId, amount, currency, provider, providerReference }) {
  const plan = getPlanById(planId);
  const paymentRef = db.collection("payments").doc(providerReference);

  // Idempotency: webhooks can and do arrive more than once for the same
  // event. If we've already recorded this exact reference, skip re-applying
  // the subscription extension so a duplicate webhook can't double-extend.
  const existing = await paymentRef.get();
  if (existing.exists) return { alreadyRecorded: true };

  const now = Date.now();
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const currentExpiry = userSnap.exists ? userSnap.data()?.subscriptionExpiresAt ?? 0 : 0;
  // Stack on top of remaining time if they still have an active plan,
  // otherwise start counting from now.
  const base = Math.max(currentExpiry, now);
  const newExpiry = base + (PLAN_DURATION_MS[planId] ?? 0);

  const batch = db.batch();
  batch.set(paymentRef, {
    uid,
    planId,
    planLabel: plan.label,
    amount,
    currency,
    provider,
    providerReference,
    status: "confirmed",
    createdAt: now,
  });
  batch.set(userRef, { subscriptionExpiresAt: newExpiry, subscriptionPlan: planId }, { merge: true });
  await batch.commit();

  return { alreadyRecorded: false, subscriptionExpiresAt: newExpiry };
}

export async function getPaymentHistory(uid) {
  const snap = await db.collection("payments").where("uid", "==", uid).orderBy("createdAt", "desc").limit(50).get();
  return snap.docs.map((d) => {
    const p = d.data();
    return {
      id: d.id,
      date: new Date(p.createdAt).toISOString().slice(0, 10),
      plan: p.planLabel,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
    };
  });
}

export async function isSubscriptionActive(uid) {
  const profile = await getUserProfile(uid);
  return Boolean(profile?.subscriptionExpiresAt && profile.subscriptionExpiresAt > Date.now());
}

/**
 * Fallback path when a user can't get a copyable txid (rare, but some
 * wallet apps only show a screenshot). This does NOT confirm payment —
 * nothing about an image can be verified automatically — it just queues
 * it for you to look at and approve by hand via approvePendingReview().
 */
export async function submitPaymentForReview({ uid, planId, note, imageBase64 }) {
  const plan = getPlanById(planId);
  const ref = await db.collection("paymentReviews").add({
    uid,
    planId,
    planLabel: plan.label,
    note: note || null,
    imageBase64: imageBase64 || null, // small images only — this is a stopgap, not real file storage
    status: "pending_review",
    createdAt: Date.now(),
  });
  return { reviewId: ref.id };
}

export async function approvePendingReview(reviewId) {
  const ref = db.collection("paymentReviews").doc(reviewId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Review not found.");
  const review = snap.data();
  if (review.status === "approved") return { alreadyApproved: true };

  const plan = getPlanById(review.planId);
  await recordConfirmedPayment({
    uid: review.uid,
    planId: review.planId,
    amount: plan.amount,
    currency: plan.currency,
    provider: "usdt-manual-reviewed",
    providerReference: `review-${reviewId}`,
  });
  await ref.update({ status: "approved", approvedAt: Date.now() });
  return { alreadyApproved: false };
}
