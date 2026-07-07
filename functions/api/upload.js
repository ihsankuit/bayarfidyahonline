import { json } from "../_lib/response.js";
import { requireAdmin } from "../_lib/auth.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

export async function onRequestPost({ request, env }) {
  const session = await requireAdmin(request, env);
  if (!session) return json({ error: "Tidak dibenarkan." }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData ? formData.get("file") : null;
  if (!file || typeof file === "string") {
    return json({ error: "Sila lampirkan fail gambar." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ error: "Jenis fail tidak disokong. Guna JPG, PNG, WEBP atau GIF." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return json({ error: "Saiz fail melebihi 8MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const key = `posts/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  await env.IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return json({ ok: true, url: `/images/${key}` }, { status: 201 });
}
