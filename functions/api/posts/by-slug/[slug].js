import { json } from "../../../_lib/response.js";
import { requireAdmin } from "../../../_lib/auth.js";

export async function onRequestGet({ params, request, env }) {
  const post = await env.DB.prepare("SELECT * FROM posts WHERE slug = ?").bind(params.slug).first();
  if (!post) return json({ error: "Post tidak dijumpai." }, { status: 404 });

  if (post.status !== "published") {
    const session = await requireAdmin(request, env);
    if (!session) return json({ error: "Post tidak dijumpai." }, { status: 404 });
  }

  return json({ post });
}
