import { json } from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";

export async function onRequestGet({ params, request, env }) {
  const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(params.id).first();
  if (!post) return json({ error: "Post tidak dijumpai." }, { status: 404 });

  if (post.status !== "published") {
    const session = await requireAdmin(request, env);
    if (!session) return json({ error: "Post tidak dijumpai." }, { status: 404 });
  }

  return json({ post });
}

export async function onRequestPut({ params, request, env }) {
  const session = await requireAdmin(request, env);
  if (!session) return json({ error: "Tidak dibenarkan." }, { status: 401 });

  const existing = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(params.id).first();
  if (!existing) return json({ error: "Post tidak dijumpai." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Data tidak sah." }, { status: 400 });

  const status = body.status === "published" || body.status === "draft" ? body.status : existing.status;
  const publishedAt =
    status === "published" ? existing.published_at || new Date().toISOString() : existing.published_at;

  await env.DB.prepare(
    `UPDATE posts SET title = ?, excerpt = ?, content = ?, cover_image_url = ?, status = ?,
     published_at = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(
      body.title ?? existing.title,
      body.excerpt ?? existing.excerpt,
      body.content ?? existing.content,
      body.coverImageUrl ?? existing.cover_image_url,
      status,
      publishedAt,
      params.id,
    )
    .run();

  return json({ ok: true });
}

export async function onRequestDelete({ params, request, env }) {
  const session = await requireAdmin(request, env);
  if (!session) return json({ error: "Tidak dibenarkan." }, { status: 401 });

  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
