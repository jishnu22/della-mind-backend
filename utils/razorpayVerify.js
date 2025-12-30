import crypto from "crypto";

export function verifySignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === signature;
}
