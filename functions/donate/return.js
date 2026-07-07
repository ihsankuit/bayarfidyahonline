// Halaman pengguna dibawa balik selepas selesai (atau batal) bayaran di Billplz.
// Status sebenar disahkan melalui webhook; halaman ini hanya paparan mesra.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const billId = url.searchParams.get("billplz[id]");
  const paidParam = url.searchParams.get("billplz[paid]");
  const paid = paidParam === "true";

  let donation = null;
  if (billId) {
    donation = await env.DB.prepare(
      "SELECT reference, amount_cents, name, status FROM donations WHERE billplz_id = ?",
    )
      .bind(billId)
      .first();
  }

  const amount = donation
    ? new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 2 }).format(
        donation.amount_cents / 100,
      )
    : "";
  const ref = donation ? donation.reference : "";

  const success = paid || (donation && donation.status === "paid");

  const body = success
    ? `
      <div class="icon success">&#10003;</div>
      <h1>Terima kasih!</h1>
      <p>Bayaran fidyah anda telah berjaya diterima.</p>
      ${ref ? `<div class="detail"><span>No. Rujukan</span><strong>${ref}</strong></div>` : ""}
      ${amount ? `<div class="detail"><span>Jumlah</span><strong>${amount}</strong></div>` : ""}
      <p class="note">Resit rasmi telah dihantar ke email anda. Semoga Allah menerima amalan anda.</p>
    `
    : `
      <div class="icon fail">&times;</div>
      <h1>Bayaran belum selesai</h1>
      <p>Nampaknya bayaran anda tidak berjaya atau dibatalkan.</p>
      ${ref ? `<div class="detail"><span>No. Rujukan</span><strong>${ref}</strong></div>` : ""}
      <p class="note">Anda boleh cuba semula bila-bila masa.</p>
    `;

  const html = `<!doctype html>
<html lang="ms">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${success ? "Terima kasih" : "Bayaran belum selesai"} | Bayar Fidyah Online</title>
  <meta name="robots" content="noindex">
  <style>
    :root { --teal:#08766d; --ink:#1f2a24; --muted:#5b6b62; --line:#e2e8e4; }
    * { box-sizing: border-box; }
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      background:#f5f7f5; color:var(--ink); display:flex; min-height:100vh; align-items:center; justify-content:center; padding:20px; }
    .card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:40px 32px; max-width:420px;
      width:100%; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,.06); }
    .icon { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center;
      font-size:34px; color:#fff; margin:0 auto 20px; }
    .icon.success { background:var(--teal); }
    .icon.fail { background:#d9534f; }
    h1 { margin:0 0 10px; font-size:22px; }
    p { margin:0 0 8px; color:var(--muted); font-size:15px; line-height:1.5; }
    .detail { display:flex; justify-content:space-between; padding:12px 0; border-top:1px solid var(--line);
      margin-top:12px; font-size:14px; }
    .detail span { color:var(--muted); }
    .note { margin-top:20px; font-size:13px; }
    a.btn { display:inline-block; margin-top:24px; background:var(--teal); color:#fff; text-decoration:none;
      padding:12px 24px; border-radius:10px; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
    <a class="btn" href="/">Kembali ke laman utama</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
