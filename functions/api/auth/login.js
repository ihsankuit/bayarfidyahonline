import { json } from "../../_lib/response.js";
import { verifyPassword, createSessionToken, sessionCookieHeader } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || !body.username || !body.password) {
    return json({ error: "Sila isi username dan kata laluan." }, { status: 400 });
  }

  const admin = await env.DB.prepare(
    "SELECT id, username, password_hash, password_salt FROM admins WHERE username = ?",
  )
    .bind(body.username.trim())
    .first();

  if (!admin) {
    return json({ error: "Username atau kata laluan salah." }, { status: 401 });
  }

  const valid = await verifyPassword(body.password, admin.password_hash, admin.password_salt);
  if (!valid) {
    return json({ error: "Username atau kata laluan salah." }, { status: 401 });
  }

  const token = await createSessionToken({ sub: admin.id, username: admin.username }, env.SESSION_SECRET);

  return json(
    { ok: true, username: admin.username },
    { headers: { "Set-Cookie": sessionCookieHeader(token) } },
  );
}
