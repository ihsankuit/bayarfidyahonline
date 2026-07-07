import { verifyWebhookSignature } from "../../_lib/billplz.js";
import { sendEmail, receiptEmailHtml } from "../../_lib/email.js";

// Billplz menghantar POST form-urlencoded ke sini selepas status bayaran berubah.
export async function onRequestPost(context) {
  const { request, env } = context;

  const form = await request.formData();
  const params = {};
  for (const [k, v] of form.entries()) params[k] = v;

  const valid = await verifyWebhookSignature(params, env.BILLPLZ_X_SIGNATURE_KEY);
  if (!valid) {
    return new Response("Invalid signature", { status: 403 });
  }

  const billId = params.id;
  const paid = params.paid === "true" || params.paid === true;
  if (!billId) return new Response("OK", { status: 200 });

  const donation = await env.DB.prepare("SELECT * FROM donations WHERE billplz_id = ?")
    .bind(billId)
    .first();

  if (!donation) return new Response("OK", { status: 200 });

  if (!paid) {
    if (donation.status === "pending") {
      await env.DB.prepare("UPDATE donations SET status = 'failed' WHERE id = ?")
        .bind(donation.id)
        .run();
    }
    return new Response("OK", { status: 200 });
  }

  // Sudah dibayar. Kemas kini sekali sahaja (idempotent).
  if (donation.status !== "paid") {
    const paidAt = params.paid_at || new Date().toISOString();
    await env.DB.prepare("UPDATE donations SET status = 'paid', paid_at = ? WHERE id = ?")
      .bind(paidAt, donation.id)
      .run();

    // Hantar resit kepada penderma sekali sahaja, tanpa menyekat respons.
    if (!donation.receipt_sent) {
      context.waitUntil(sendReceipt(env, donation, paidAt));
    }
  }

  return new Response("OK", { status: 200 });
}

async function sendReceipt(env, donation, paidAt) {
  try {
    await sendEmail(env, {
      to: donation.email,
      subject: `Resit Fidyah ${donation.reference}`,
      html: receiptEmailHtml({
        name: donation.name,
        amountCents: donation.amount_cents,
        reference: donation.reference,
        category: donation.category,
        days: donation.days,
        paidAt,
      }),
    });
    await env.DB.prepare("UPDATE donations SET receipt_sent = 1 WHERE id = ?").bind(donation.id).run();
  } catch (err) {
    // Biarkan receipt_sent = 0 supaya boleh dihantar semula manual jika perlu.
  }
}
