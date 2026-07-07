import { json } from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";
import { slugify } from "../../_lib/slugify.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const session = await requireAdmin(request, env);
  const requestedStatus = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 100);

  let query =
    "SELECT id, slug, title, excerpt, cover_image_url, status, created_at, updated_at, published_at FROM posts";
  const conditions = [];
  const params = [];

  if (!session) {
    conditions.push("status = 'published'");
  } else if (requestedStatus && requestedStatus !== "all") {
    conditions.push("status = ?");
    params.push(requestedStatus);
  }

  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?";
  params.push(limit);

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ posts: results });
}

export async function onRequestPost({ request, env }) {
  const session = await requireAdmin(request, env);
  if (!session) return json({ error: "Tidak dibenarkan." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || !body.title || !body.content) {
    return json({ error: "Tajuk dan kandungan diperlukan." }, { status: 400 });
  }

  const slugBase = slugify(body.slug || body.title);
  if (!slugBase) {
    return json({ error: "Tajuk tidak sah untuk jana slug." }, { status: 400 });
  }

  let slug = slugBase;
  let attempt = 1;
  while (await env.DB.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first()) {
    attempt += 1;
    slug = `${slugBase}-${attempt}`;
  }

  const status = body.status === "published" ? "published" : "draft";
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  const result = await env.DB.prepare(
    `INSERT INTO posts (slug, title, excerpt, content, cover_image_url, status, author_id, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      slug,
      body.title.trim(),
      body.excerpt ? body.excerpt.trim() : null,
      body.content,
      body.coverImageUrl || null,
      status,
      session.sub,
      publishedAt,
    )
    .run();

  return json({ ok: true, id: result.meta.last_row_id, slug }, { status: 201 });
}
