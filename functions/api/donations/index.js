import { json } from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const session = await requireAdmin(request, env);
  if (!session) return json({ error: "Tidak dibenarkan." }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 200);

  let query =
    "SELECT id, reference, name, email, phone, amount_cents, days, category, status, paid_at, created_at FROM donations";
  const params = [];
  if (status && status !== "all") {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all();

  const totalRow = await env.DB.prepare(
    "SELECT COALESCE(SUM(amount_cents), 0) AS total, COUNT(*) AS count FROM donations WHERE status = 'paid'",
  ).first();

  return json({
    donations: results,
    summary: { totalPaidCents: totalRow.total, paidCount: totalRow.count },
  });
}
