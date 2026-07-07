import { json } from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT position, image_url FROM gallery_images ORDER BY position ASC",
  ).all();
  return json({ images: results });
}

export async function onRequestPut({ request, env }) {
  const session = await requireAdmin(request, env);
  if (!session) return json({ error: "Tidak dibenarkan." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const position = body ? Number(body.position) : NaN;
  if (!position || position < 1 || position > 6) {
    return json({ error: "Position mesti 1-6." }, { status: 400 });
  }

  await env.DB.prepare(
    "UPDATE gallery_images SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE position = ?",
  )
    .bind(body.image_url || null, position)
    .run();

  const updated = await env.DB.prepare(
    "SELECT position, image_url FROM gallery_images WHERE position = ?",
  )
    .bind(position)
    .first();

  return json(updated);
}
