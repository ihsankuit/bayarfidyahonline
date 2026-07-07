import { json } from "../../_lib/response.js";
import { createBill } from "../../_lib/billplz.js";

const MIN_RATE_CENTS = 10; // RM0.10
const MAX_RATE_CENTS = 5000; // RM50.00
const MAX_DAYS = 366;
const MIN_AMOUNT_CENTS = 100; // minimum Billplz RM1.00

function genReference() {
  const d = new Date();
  const stamp = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FID-${stamp}-${rand}`;
}

function isEmail(str) {
  return typeof str === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Data tidak sah." }, { status: 400 });

  const name = (body.name || "").toString().trim();
  const email = (body.email || "").toString().trim();
  const phone = (body.phone || "").toString().trim();
  const category = (body.category || "").toString().trim();
  const days = Math.floor(Number(body.days));
  const rateCents = Math.round(Number(body.rate) * 100);

  if (!name) return json({ error: "Nama diperlukan." }, { status: 400 });
  if (!isEmail(email)) return json({ error: "Email tidak sah." }, { status: 400 });
  if (!Number.isFinite(days) || days < 1 || days > MAX_DAYS) {
    return json({ error: "Bilangan hari tidak sah." }, { status: 400 });
  }
  if (!Number.isFinite(rateCents) || rateCents < MIN_RATE_CENTS || rateCents > MAX_RATE_CENTS) {
    return json({ error: "Kadar fidyah tidak sah." }, { status: 400 });
  }

  const amountCents = days * rateCents;
  if (amountCents < MIN_AMOUNT_CENTS) {
    return json({ error: "Jumlah minimum ialah RM1.00." }, { status: 400 });
  }

  const reference = genReference();
  const origin = env.SITE_URL || new URL(request.url).origin;

  // Rekod pending dahulu.
  const insert = await env.DB.prepare(
    `INSERT INTO donations (reference, name, email, phone, amount_cents, days, rate_cents, category, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
  )
    .bind(reference, name, email, phone || null, amountCents, days, rateCents, category || null)
    .run();

  const donationId = insert.meta.last_row_id;

  let bill;
  try {
    bill = await createBill(env, {
      name,
      email,
      mobile: phone || undefined,
      amountCents,
      description: `Fidyah ${days} hari${category ? ` (${category})` : ""}`,
      callbackUrl: `${origin}/api/donate/callback`,
      redirectUrl: `${origin}/donate/return`,
      reference,
    });
  } catch (err) {
    await env.DB.prepare("UPDATE donations SET status = 'failed' WHERE id = ?").bind(donationId).run();
    return json({ error: "Gagal mula sesi bayaran. Cuba lagi." }, { status: 502 });
  }

  await env.DB.prepare("UPDATE donations SET billplz_id = ? WHERE id = ?")
    .bind(bill.id, donationId)
    .run();

  return json({ url: bill.url, reference });
}
