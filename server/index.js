import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

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
  createApiKey,
  listApiKeysForUser,
  revokeApiKey,
  findActiveApiKeyByRawKey,
  checkAndIncrementApiKeyUsage,
} from "./db.js";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8787;
const APP_URL = process.env.APP_URL || "http://localhost:5173";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- Health check ----------
app.get("/healthz", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------- Movies (internal — used directly by the Aurevo frontend, no key) ----------

app.get("/api/v1/movies/search", async (req, res) => {
  try {
    const { q = "", page = 1 } = req.query;
    res.json(await searchMovies(q, { page: Number(page) }));
  } catch (e) {
    console.error("GET /api/v1/movies/search error:", e);
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/v1/movies/popular", async (req, res) => {
  try {
    const { page = 1 } = req.query;
    res.json(await getPopularMovies({ page: Number(page) }));
  } catch (e) {
    console.error("GET /api/v1/movies/popular error:", e);
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/v1/movies/:id", async (req, res) => {
  try {
    res.json(await getMovieById(req.params.id));
  } catch (e) {
    console.error("GET /api/v1/movies/:id error:", e);
    res.status(502).json({ error: e.message });
  }
});

// ---------- Music videos (internal — used directly by the Aurevo frontend, no key) ----------

app.get("/api/v1/music-videos/search", async (req, res) => {
  try {
    const { q = "" } = req.query;
    res.json(await searchMusicVideos(q));
  } catch (e) {
    console.error("GET /api/v1/music-videos/search error:", e);
    res.status(502).json({ error: e.message });
  }
});

// ---------- User profile ----------

app.post("/api/v1/profile", express.json(), requireAuth, async (req, res) => {
  try {
    // NOTE: previously this only accepted username/country/language, which
    // silently dropped the playback/download preferences Settings.jsx
    // sends (streamingQuality, autoplay, subtitles, downloadWifiOnly) —
    // the UI showed "Saved!" but nothing was actually persisted. Now all
    // profile-shaped fields the client sends are merged in.
    const { username, country, language, streamingQuality, autoplay, subtitles, downloadWifiOnly } = req.body;
    await upsertUserProfile(req.firebaseUser.uid, {
      username,
      country,
      language,
      streamingQuality,
      autoplay,
      subtitles,
      downloadWifiOnly,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("POST /api/v1/profile error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/v1/profile", requireAuth, async (req, res) => {
  try {
    res.json(await getUserProfile(req.firebaseUser.uid));
  } catch (e) {
    console.error("GET /api/v1/profile error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Developer API keys (dashboard: generate/list/revoke) ----------

app.get("/api/v1/developer/keys", requireAuth, async (req, res) => {
  try {
    const keys = await listApiKeysForUser(req.firebaseUser.uid);
    // never send back the full secret after creation — just a preview
    const safeKeys = keys.map((k) => ({
      id: k.id,
      label: k.label,
      preview: k.preview,
      tier: k.tier,
      createdAt: k.createdAt,
      usedToday: k.usedToday,
      limitPerDay: k.limitPerDay,
      usedThisMonth: k.usedThisMonth,
      limitPerMonth: k.limitPerMonth,
    }));
    res.json({ keys: safeKeys });
  } catch (e) {
    console.error("GET /api/v1/developer/keys error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Real, enforced limits per tier. Free tier: 8 requests/day, hard-capped
// at 50/month total (well under the 60/month ceiling) — 8/day * 30 days
// would allow up to 240/month with no cap, so the monthly limit is what
// actually stops a user who spreads requests out evenly across the month.
// `null` means unlimited for that period.
const TIER_LIMITS = {
  free: { limitPerDay: 8, limitPerMonth: 50 },
  pro: { limitPerDay: 10000, limitPerMonth: 300000 },
  enterprise: { limitPerDay: null, limitPerMonth: null },
};

app.post("/api/v1/developer/keys", express.json(), requireAuth, async (req, res) => {
  try {
    const { label, tier = "free" } = req.body;

    const rawKey = `av_${tier}_${crypto.randomBytes(24).toString("hex")}`;
    const preview = `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}`;

    const { limitPerDay, limitPerMonth } = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

    const created = await createApiKey({
      uid: req.firebaseUser.uid,
      label: label || `Key ${Date.now()}`,
      key: rawKey,
      preview,
      tier,
      limitPerDay,
      limitPerMonth,
    });

    // full raw key is only ever returned here, on creation
    res.json({ key: { ...created, key: rawKey } });
  } catch (e) {
    console.error("POST /api/v1/developer/keys error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/v1/developer/keys/:keyId", requireAuth, async (req, res) => {
  try {
    await revokeApiKey({ uid: req.firebaseUser.uid, keyId: req.params.keyId });
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/v1/developer/keys/:keyId error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * Middleware for the PUBLIC developer API (the routes real third-party
 * developers call with a generated key). Reads the key from
 * `Authorization: Bearer <key>`, validates it, and enforces both the
 * daily and monthly limit in one atomic step — a request that would push
 * either counter over its limit is rejected with 429 before it reaches
 * TMDb/YouTube, so it costs nothing and can't be gamed by racing requests.
 */
async function requireApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const rawKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    if (!rawKey) {
      return res.status(401).json({ error: "Missing API key. Pass it as 'Authorization: Bearer YOUR_API_KEY'." });
    }

    const key = await findActiveApiKeyByRawKey(rawKey);
    if (!key) {
      return res.status(401).json({ error: "Invalid or revoked API key." });
    }

    const usage = await checkAndIncrementApiKeyUsage(key.id);
    if (!usage.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded for this API key.",
        usedToday: usage.usedToday,
        limitPerDay: usage.limitPerDay,
        usedThisMonth: usage.usedThisMonth,
        limitPerMonth: usage.limitPerMonth,
      });
    }

    req.apiKey = key;
    next();
  } catch (e) {
    console.error("requireApiKey error:", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Public Developer API (rate-limited by API key — this is what generated keys actually unlock) ----------

app.get("/api/v1/public/movies/popular", requireApiKey, async (req, res) => {
  try {
    const { page = 1 } = req.query;
    res.json(await getPopularMovies({ page: Number(page) }));
  } catch (e) {
    console.error("GET /api/v1/public/movies/popular error:", e);
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/v1/public/movies/search", requireApiKey, async (req, res) => {
  try {
    const { q = "", page = 1 } = req.query;
    res.json(await searchMovies(q, { page: Number(page) }));
  } catch (e) {
    console.error("GET /api/v1/public/movies/search error:", e);
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/v1/public/movies/:id", requireApiKey, async (req, res) => {
  try {
    res.json(await getMovieById(req.params.id));
  } catch (e) {
    console.error("GET /api/v1/public/movies/:id error:", e);
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/v1/public/music-videos/search", requireApiKey, async (req, res) => {
  try {
    const { q = "" } = req.query;
    res.json(await searchMusicVideos(q));
  } catch (e) {
    console.error("GET /api/v1/public/music-videos/search error:", e);
    res.status(502).json({ error: e.message });
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
    console.error("POST /api/v1/checkout error:", e);
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
    console.error("GET /api/v1/checkout/verify/paystack error:", e);
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

// ---------- Checkout: USDT (manual) ----------

app.post("/api/v1/checkout/usdt-manual", express.json(), requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = getPlanById(planId);
    res.json({
      address: getUsdtWalletAddress(),
      network: "TRC20",
      amount: plan.amount,
      currency: "USDT",
    });
  } catch (e) {
    console.error("POST /api/v1/checkout/usdt-manual error:", e);
    res.status(400).json({ error: e.message });
  }
});

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
      providerReference: txid,
    });
    res.json({ verified: true });
  } catch (e) {
    console.error("POST /api/v1/checkout/usdt-manual/confirm error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/v1/checkout/usdt-manual/submit-proof", express.json({ limit: "2mb" }), requireAuth, async (req, res) => {
  try {
    const { planId, note, imageBase64 } = req.body;
    if (!planId) return res.status(400).json({ error: "planId is required." });
    const result = await submitPaymentForReview({ uid: req.firebaseUser.uid, planId, note, imageBase64 });
    res.json({ status: "pending_review", ...result });
  } catch (e) {
    console.error("POST /api/v1/checkout/usdt-manual/submit-proof error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/v1/admin/payments/:reviewId/approve", express.json(), async (req, res) => {
  if (!ADMIN_SECRET || req.headers["x-admin-secret"] !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Missing or incorrect X-Admin-Secret header." });
  }
  try {
    res.json(await approvePendingReview(req.params.reviewId));
  } catch (e) {
    console.error("POST /api/v1/admin/payments/:reviewId/approve error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/v1/payments/history", requireAuth, async (req, res) => {
  try {
    res.json(await getPaymentHistory(req.firebaseUser.uid));
  } catch (e) {
    console.error("GET /api/v1/payments/history error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Serve frontend (MUST be last) ----------

app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Aurevo backend listening on http://localhost:${PORT}`);
});
