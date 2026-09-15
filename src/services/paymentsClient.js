import { auth } from "./firebase.js";
import { API_BASE_URL } from "./config.js";

async function authHeader() {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("You need to be signed in to do that.");
  return { Authorization: `Bearer ${token}` };
}

export async function startCardCheckout({ planId }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ planId, method: "card" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed to start.");
  return data; // { checkoutUrl, reference }
}

export async function getUsdtPaymentDetails({ planId }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/checkout/usdt-manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ planId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not load USDT payment details.");
  return data; // { address, network, amount, currency }
}

export async function confirmUsdtPayment({ planId, txid }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/checkout/usdt-manual/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ planId, txid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not verify that transaction.");
  return data;
}

export async function submitUsdtProof({ planId, note, imageBase64 }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/checkout/usdt-manual/submit-proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ planId, note, imageBase64 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not submit for review.");
  return data;
}

export async function fetchPaymentHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/payments/history`, {
      headers: await authHeader(),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveProfile({ username, country, language }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ username, country, language }),
  });
  if (!res.ok) throw new Error("Could not save profile.");
}

export async function fetchProfile() {
  const res = await fetch(`${API_BASE_URL}/api/v1/profile`, { headers: await authHeader() });
  if (!res.ok) return null;
  return res.json();
}
