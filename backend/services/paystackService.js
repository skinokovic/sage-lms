import crypto from "node:crypto";

const PAYSTACK_API = "https://api.paystack.co";
const REQUEST_TIMEOUT_MS = 20000;

function httpError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !/^sk_(test|live)_/.test(key)) {
    throw httpError(
      "PAYSTACK_SECRET_KEY is missing or invalid (expected sk_test_... or sk_live_...).",
      503,
    );
  }
  return key;
}

export function isPaystackTestMode() {
  return String(process.env.PAYSTACK_SECRET_KEY || "").startsWith("sk_test_");
}

async function paystackRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${PAYSTACK_API}${path}`, {
      ...options,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error.statusCode) throw error; // e.g. missing key
    throw httpError("Could not reach Paystack. Please try again.", 502);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.status) {
    throw httpError(
      payload?.message || `Paystack request failed (${response.status}).`,
      502,
    );
  }
  return payload.data;
}

export function initializePaystackTransaction({
  email,
  amountKobo,
  reference,
  callbackUrl,
  metadata,
  channels,
}) {
  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: String(amountKobo),
      currency: "NGN",
      reference,
      callback_url: callbackUrl,
      metadata,
      channels: channels?.length ? channels : ["card", "bank_transfer"],
    }),
  });
}

export function verifyPaystackTransaction(reference) {
  return paystackRequest(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );
}

// Paystack signs the RAW request body with your secret key (HMAC SHA512).
export function verifyPaystackSignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature || !rawBody) return false;
  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
