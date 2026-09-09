import "dotenv/config";
import express from "express";
import cors from "cors";

import { searchMovies, getPopularMovies, getMovieById } from "../src/services/providers/movieProvider.server.js";
import { searchMusicVideos } from "../src/services/providers/youtubeProvider.server.js";
import { createPaystackCheckout, verifyPaystackTransaction, verifyPaystackWebhookSignature } from "../src/services/payments/paystack.server.js";
import { getUsdtWalletAddress, verifyUsdtTransaction } from "../src/services/payments/usdtManual.server.js";
import { getPlanById } from "../src/services/plans.js";
import { requireAuth } from "./firebaseAdmin.js";
import {
  getUserProfile,
  upsertUserProfile,
  recordConfirmedPayment,
  getPaymentHistory,
  submitPaymentForReview,
  approvePendingReview,
} from "./db.js";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8787;
const APP_URL = process.env.APP_URL || "http://localhost:5173";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

// ---------- Health check ----------
// Point UptimeRobot (or any uptime monitor) at this to keep a free-tier
// Render instance from spinning down after 15 minutes idle. No auth, no
// dependencies checked — just "is the process alive and responding."
app.get("/healthz", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------- Movies ----------

app.get("/api/v1/movies/search", async (req, res) => {
  try {
    const { q = "", page = 1 } = req.query;
    res.json(await searchMovies(q, { page: Number(page) }));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/v1/movies/popular", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    res.json(await getPopularMovies({ page: Number(page) }));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/v1/movies/:id", async (req, res) => {
  try {
    res.json(await getMovieById(req.params.id));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ---------- Music videos ----------

app.get("/api/v1/music-videos/search", async (req, res) => {
  try {
    const { q = "" } = req.query;
    res.json(await searchMusicVideos(q));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ---------- User profile ----------

app.post("/api/v1/profile", express.json(), requireAuth, async (req, res) => {
  try {
    const { username, country, language } = req.body;
    await upsertUserProfile(req.firebaseUser.uid, { username, country, language });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/v1/profile", requireAuth, async (req, res) => {
  try {
    res.json(await getUserProfile(req.firebaseUser.uid));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Checkout: card (Paystack) ----------

app.post("/api/v1/checkout", express.json(), requireAuth, async (req, res) => {
  try {
    const { planId, method } = req.body;
    if (!planId || method !== "card") {
      return res.status(400).json({ error: "planId is required and method must be 'card' (use the /checkout/usdt-manual routes for USDT)." });
    }
    const plan = getPlanById(planId);
    const { uid, email } = req.firebaseUser;
    const profile = await getUserProfile(uid);

    const result = await createPaystackCheckout({
      plan,
      user: { id: uid, email, username: profile?.username },
      country: profile?.country,
      callbackUrl: `${APP_URL}/payments/callback`,
    });
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/v1/checkout/verify/paystack", requireAuth, async (req, res) => {
  try {
    const result = await verifyPaystackTransaction(req.query.reference);
    if (result.verified && result.uid === req.firebaseUser.uid) {
      await recordConfirmedPayment({
        uid: result.uid,
        planId: result.planId,
        amount: result.amount,
        currency: result.currency,
        provider: "paystack",
        providerReference: result.reference,
      });
    }
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/v1/webhooks/paystack", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];
    const rawBody = req.body.toString("utf8");
    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: "Invalid signature." });
    }
    const event = JSON.parse(rawBody);
    if (event.event === "charge.success") {
      const { reference, amount, currency, metadata } = event.data;
      await recordConfirmedPayment({
        uid: metadata?.uid,
        planId: metadata?.plan_id,
        amount: amount / 100,
        currency,
        provider: "paystack",
        providerReference: reference,
      });
    }
    res.sendStatus(200);
  } catch (e) {
    console.error("Paystack webhook error:", e);
    res.sendStatus(500);
  }
});

// ---------- Checkout: USDT (manual, self-verified on-chain) ----------

app.post("/api/v1/checkout/usdt-manual", express.json(), requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = getPlanById(planId);
    res.json({
      address: getUsdtWalletAddress(),
      network: "TRC20",
      amount: plan.amount, // USDT is a USD-pegged stablecoin, so plan.amount (USD) is used 1:1
      currency: "USDT",
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** The real, automatic confirmation path — looks the txid up on-chain. */
app.post("/api/v1/checkout/usdt-manual/confirm", express.json(), requireAuth, async (req, res) => {
  try {
    const { planId, txid } = req.body;
    if (!planId || !txid) return res.status(400).json({ error: "planId and txid are required." });
    const plan = getPlanById(planId);

    const result = await verifyUsdtTransaction(txid, plan.amount);
    if (!result.verified) {
      return res.status(402).json({ verified: false, error: result.error });
    }

    await recordConfirmedPayment({
      uid: req.firebaseUser.uid,
      planId,
      amount: result.amountUsdt,
      currency: "USDT",
      provider: "usdt-manual",
      providerReference: txid, // doc id = txid, so resubmitting the same txid can't double-credit
    });
    res.json({ verified: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Fallback only — for when a user genuinely can't get a copyable txid.
 *  This does NOT confirm payment, it queues it for you to check by hand. */
app.post("/api/v1/checkout/usdt-manual/submit-proof", express.json({ limit: "2mb" }), requireAuth, async (req, res) => {
  try {
    const { planId, note, imageBase64 } = req.body;
    if (!planId) return res.status(400).json({ error: "planId is required." });
    const result = await submitPaymentForReview({ uid: req.firebaseUser.uid, planId, note, imageBase64 });
    res.json({ status: "pending_review", ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** You approve a pending review yourself — e.g. by opening this URL with
 *  the X-Admin-Secret header set (Postman, curl, or a small admin page).
 *  Set ADMIN_SECRET in your env to something long and random. */
app.post("/api/v1/admin/payments/:reviewId/approve", express.json(), async (req, res) => {
  if (!ADMIN_SECRET || req.headers["x-admin-secret"] !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Missing or incorrect X-Admin-Secret header." });
  }
  try {
    res.json(await approvePendingReview(req.params.reviewId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/v1/payments/history", requireAuth, async (req, res) => {
  try {
    res.json(await getPaymentHistory(req.firebaseUser.uid));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Aurevo backend listening on http://localhost:${PORT}`);
});
