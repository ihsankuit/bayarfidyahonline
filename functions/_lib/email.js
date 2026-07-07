// Hantar email transaksi melalui Resend (https://resend.com).

export async function sendEmail(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new Error("RESEND_API_KEY atau RESEND_FROM belum ditetapkan.");
  }

  const body = {
    from: env.RESEND_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.text().catch(() => "");
    throw new Error(`Resend gagal (${res.status}): ${data}`);
  }
  return res.json().catch(() => ({}));
}

export function formatMYR(cents) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function receiptEmailHtml({ name, amountCents, reference, category, days, paidAt }) {
  const amount = formatMYR(amountCents);
  const dateLabel = new Date(paidAt || Date.now()).toLocaleString("ms-MY", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const safe = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2a24;">
    <div style="background:#08766d;color:#fff;padding:24px 28px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Terima kasih atas fidyah anda</h1>
      <p style="margin:6px 0 0;opacity:.85;font-size:14px;">Pertubuhan IhsanKu Malaysia</p>
    </div>
    <div style="border:1px solid #e2e8e4;border-top:none;padding:24px 28px;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;">Assalamualaikum <strong>${safe(name)}</strong>,</p>
      <p style="margin:0 0 20px;">Bayaran fidyah anda telah kami terima. Berikut resit rasmi anda:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#5b6b62;">No. Rujukan</td><td style="padding:8px 0;text-align:right;font-weight:600;">${safe(reference)}</td></tr>
        <tr><td style="padding:8px 0;color:#5b6b62;">Kategori</td><td style="padding:8px 0;text-align:right;">${safe(category) || "-"}</td></tr>
        <tr><td style="padding:8px 0;color:#5b6b62;">Bilangan hari</td><td style="padding:8px 0;text-align:right;">${days ? safe(days) : "-"}</td></tr>
        <tr><td style="padding:8px 0;color:#5b6b62;">Tarikh bayaran</td><td style="padding:8px 0;text-align:right;">${safe(dateLabel)}</td></tr>
        <tr><td style="padding:14px 0 0;border-top:1px solid #e2e8e4;color:#5b6b62;">Jumlah</td><td style="padding:14px 0 0;border-top:1px solid #e2e8e4;text-align:right;font-size:18px;font-weight:800;color:#08766d;">${amount}</td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#5b6b62;">Semoga Allah menerima amalan anda. Jika ada pertanyaan, balas sahaja email ini.</p>
    </div>
    <p style="text-align:center;font-size:12px;color:#9aa8a0;margin:16px 0;">Bayar Fidyah Online &middot; bayarfidyahonline.com</p>
  </div>`;
}
