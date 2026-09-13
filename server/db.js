import crypto from "crypto";
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
 *  Firebase Auth itself doesn't hold (username, country, language). Also
 *  used by Settings.jsx to persist playback/download preferences — any
 *  fields passed in are merged in as-is. */
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

// ---------- Developer API keys ----------

/** We never store the raw key — only a SHA-256 hash of it — so that a
 *  Firestore read (or leak) can't hand out usable credentials. The raw
 *  key is generated in index.js and returned to the client exactly once,
 *  at creation time. */
function hashApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}
function monthKey() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM, UTC
}

/**
 * Stores a new API key for a user. `key` is the raw, one-time-visible key
 * generated by the caller (index.js); only its hash and a short preview
 * are persisted. `limitPerDay` / `limitPerMonth` may be `null` to mean
 * unlimited (used for the enterprise tier).
 */
export async function createApiKey({ uid, label, key, preview, tier, limitPerDay, limitPerMonth }) {
  const keyHash = hashApiKey(key);
  const now = Date.now();

  const ref = await db.collection("apiKeys").add({
    uid,
    label,
    keyHash,
    preview,
    tier,
    limitPerDay,
    limitPerMonth,
    usedToday: 0,
    usedThisMonth: 0,
    lastUsedDate: todayKey(),
    lastUsedMonth: monthKey(),
    revoked: false,
    createdAt: now,
  });

  return {
    id: ref.id,
    label,
    preview,
    tier,
    limitPerDay,
    limitPerMonth,
    usedToday: 0,
    usedThisMonth: 0,
    createdAt: now,
  };
}

/** Lists a user's non-revoked API keys, most recent first. Never includes
 *  keyHash or anything the raw key could be reconstructed from. */
export async function listApiKeysForUser(uid) {
  const snap = await db
    .collection("apiKeys")
    .where("uid", "==", uid)
    .where("revoked", "==", false)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => {
    const k = d.data();
    return {
      id: d.id,
      label: k.label,
      preview: k.preview,
      tier: k.tier,
      createdAt: k.createdAt,
      usedToday: k.usedToday || 0,
      limitPerDay: k.limitPerDay,
      usedThisMonth: k.usedThisMonth || 0,
      limitPerMonth: k.limitPerMonth,
    };
  });
}

/**
 * Revokes a key by id, after confirming it actually belongs to `uid` —
 * without this check, one user could revoke another user's key just by
 * guessing a Firestore doc id.
 */
export async function revokeApiKey({ uid, keyId }) {
  const ref = db.collection("apiKeys").doc(keyId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("API key not found.");
  if (snap.data().uid !== uid) throw new Error("Not authorized to revoke this key.");

  await ref.update({ revoked: true, revokedAt: Date.now() });
  return { revoked: true };
}

/**
 * Looks up an API key by its raw value (used when authenticating an
 * incoming developer API request). Returns null if not found or revoked.
 */
export async function findActiveApiKeyByRawKey(rawKey) {
  const keyHash = hashApiKey(rawKey);
  const snap = await db
    .collection("apiKeys")
    .where("keyHash", "==", keyHash)
    .where("revoked", "==", false)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * The actual enforcement point: atomically checks a key's usage against
 * both its daily and monthly limits and, only if both are still under
 * budget, increments both counters. Runs as a Firestore transaction so
 * concurrent requests on the same key can't race past the limit.
 *
 * `limitPerDay` / `limitPerMonth` of `null` on the stored key means
 * unlimited for that period (enterprise tier). Missing (`undefined`)
 * fields — from keys created before this limit system existed — fall
 * back to the free-tier defaults (8/day, 50/month) rather than unlimited.
 */
export async function checkAndIncrementApiKeyUsage(keyId) {
  const ref = db.collection("apiKeys").doc(keyId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("API key not found.");
    const k = snap.data();
    if (k.revoked) throw new Error("API key has been revoked.");

    const today = todayKey();
    const month = monthKey();

    let usedToday = k.usedToday || 0;
    let usedThisMonth = k.usedThisMonth || 0;
    if (k.lastUsedDate !== today) usedToday = 0;
    if (k.lastUsedMonth !== month) usedThisMonth = 0;

    const limitPerDay = k.limitPerDay === undefined ? 8 : k.limitPerDay;
    const limitPerMonth = k.limitPerMonth === undefined ? 50 : k.limitPerMonth;

    const dayExceeded = limitPerDay !== null && usedToday >= limitPerDay;
    const monthExceeded = limitPerMonth !== null && usedThisMonth >= limitPerMonth;

    if (dayExceeded || monthExceeded) {
      // Persist the rollover even on a rejected request, so a stale
      // lastUsedDate/lastUsedMonth doesn't linger.
      tx.update(ref, { usedToday, usedThisMonth, lastUsedDate: today, lastUsedMonth: month });
      return { allowed: false, usedToday, usedThisMonth, limitPerDay, limitPerMonth };
    }

    usedToday += 1;
    usedThisMonth += 1;
    tx.update(ref, { usedToday, usedThisMonth, lastUsedDate: today, lastUsedMonth: month });
    return { allowed: true, usedToday, usedThisMonth, limitPerDay, limitPerMonth };
  });
}
