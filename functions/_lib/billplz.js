// Billplz API helper (v3). Sokongan mod sandbox & production.
// Rujukan: https://www.billplz.com/api

function baseUrl(env) {
  const mode = (env.BILLPLZ_MODE || "sandbox").toLowerCase();
  return mode === "production"
    ? "https://www.billplz.com/api/v3"
    : "https://www.billplz-sandbox.com/api/v3";
}

function authHeader(env) {
  // Billplz guna HTTP Basic: API key sebagai username, password kosong.
  const token = btoa(`${env.BILLPLZ_API_KEY}:`);
  return `Basic ${token}`;
}

export async function createBill(env, { name, email, mobile, amountCents, description, callbackUrl, redirectUrl, reference }) {
  const form = new URLSearchParams();
  form.set("collection_id", env.BILLPLZ_COLLECTION_ID);
  form.set("email", email);
  form.set("name", name);
  form.set("amount", String(amountCents));
  form.set("callback_url", callbackUrl);
  form.set("description", description);
  if (redirectUrl) form.set("redirect_url", redirectUrl);
  if (mobile) form.set("mobile", mobile);
  if (reference) {
    form.set("reference_1_label", "Rujukan");
    form.set("reference_1", reference);
  }

  const res = await fetch(`${baseUrl(env)}/bills`, {
    method: "POST",
    headers: {
      Authorization: authHeader(env),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.error ? JSON.stringify(data.error) : `HTTP ${res.status}`;
    throw new Error(`Billplz create bill gagal: ${msg}`);
  }
  return data; // { id, url, paid, state, ... }
}

// Sahkan X-Signature webhook Billplz.
// Source string: setiap param (kecuali x_signature) dalam bentuk `keyvalue`,
// disusun ikut abjad, dicantum dengan `|`, kemudian HMAC-SHA256 (hex).
export async function verifyWebhookSignature(params, xSignatureKey) {
  const providedSig = params.x_signature;
  if (!providedSig || !xSignatureKey) return false;

  const source = Object.keys(params)
    .filter((k) => k !== "x_signature")
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("|");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(xSignatureKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(source));
  const computed = [...new Uint8Array(sigBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

  // Perbandingan timing-safe.
  if (computed.length !== providedSig.length) return false;
  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ providedSig.charCodeAt(i);
  }
  return result === 0;
}
