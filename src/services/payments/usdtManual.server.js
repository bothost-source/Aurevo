/**
 * Manual USDT (TRC20) checkout — no payment processor, no KYC. You show
 * the user your wallet address; they pay from their own wallet; they paste
 * back the transaction ID; this file looks that txid up on Tronscan (a
 * public TRON blockchain explorer with a free, keyless API) and confirms
 * it really sent the right amount to your address before granting access.
 *
 * Why this is trustworthy: blockchain transactions are public and
 * immutable. Once confirmed on-chain, nobody can fake or edit one — unlike
 * a screenshot, which proves nothing on its own. This is the same
 * verification method crypto payment processors use internally; you're
 * just doing it directly instead of paying a middleman.
 *
 * Set YOUR receiving address below via env var — this is NOT secret, it's
 * a public wallet address, safe to expose to the frontend too.
 */

const TRONSCAN_API = "https://apilist.tronscanapi.com/api/transaction-info";
// USDT's official TRC20 contract address on TRON mainnet — this never
// changes, it's how we confirm the transfer was really USDT and not some
// other token or plain TRX.
const USDT_TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

const YOUR_WALLET_ADDRESS = process.env.USDT_TRC20_WALLET_ADDRESS;

export function getUsdtWalletAddress() {
  if (!YOUR_WALLET_ADDRESS) {
    throw new Error("USDT_TRC20_WALLET_ADDRESS is not set. Add your receiving wallet address to .env.");
  }
  return YOUR_WALLET_ADDRESS;
}

/**
 * Looks up a txid on Tronscan and checks it really paid the expected
 * amount to your wallet. Returns { verified, amountUsdt, error }.
 * `expectedAmount` should allow a small tolerance for rounding — callers
 * pass the plan's exact price; we accept anything >= that minus a cent.
 */
export async function verifyUsdtTransaction(txid, expectedAmount) {
  if (!txid || typeof txid !== "string" || txid.length < 10) {
    return { verified: false, error: "That doesn't look like a valid transaction ID." };
  }

  const res = await fetch(`${TRONSCAN_API}?hash=${encodeURIComponent(txid)}`);
  if (!res.ok) {
    return { verified: false, error: "Could not reach the blockchain explorer — try again in a moment." };
  }
  const tx = await res.json();

  if (!tx || tx.confirmed !== true) {
    return { verified: false, error: "Transaction not found or not yet confirmed on-chain. Wait a minute and try again." };
  }

  // TRC20 transfers show up in trc20TransferInfo, not the top-level amount
  // field (that's for plain TRX transfers).
  const transfer = (tx.trc20TransferInfo || []).find(
    (t) => t.contract_address === USDT_TRC20_CONTRACT && t.to_address === YOUR_WALLET_ADDRESS
  );

  if (!transfer) {
    return { verified: false, error: "This transaction doesn't show a USDT payment to our wallet address." };
  }

  const amountUsdt = Number(transfer.amount_str) / 10 ** Number(transfer.decimals || 6);

  if (amountUsdt < expectedAmount - 0.01) {
    return { verified: false, error: `Amount received (${amountUsdt} USDT) is less than the ${expectedAmount} USDT required.`, amountUsdt };
  }

  return { verified: true, amountUsdt, from: transfer.from_address };
}
