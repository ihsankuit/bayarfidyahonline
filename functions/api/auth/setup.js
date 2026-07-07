import { json } from "../../_lib/response.js";
import { hashPassword } from "../../_lib/auth.js";

// Cipta akaun admin pertama sahaja. Selepas satu akaun wujud, endpoint ini
// sentiasa menolak (self-disabling), jadi selamat untuk kekal dalam kod.
export async function onRequestPost({ request, env }) {
  const row = await env.DB.prepare("SELECT COUNT(*) as count FROM admins").first();
  if (row.count > 0) {
    return json({ error: "Setup sudah selesai." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.username || !body.password || !body.setupToken) {
    return json({ error: "Sila lengkapkan semua ruangan." }, { status: 400 });
  }

  if (!env.SETUP_TOKEN || body.setupToken !== env.SETUP_TOKEN) {
    return json({ error: "Setup token tidak sah." }, { status: 403 });
  }

  const username = body.username.trim();
  if (username.length < 3) {
    return json({ error: "Username mesti sekurang-kurangnya 3 aksara." }, { status: 400 });
  }

  if (body.password.length < 8) {
    return json({ error: "Kata laluan mesti sekurang-kurangnya 8 aksara." }, { status: 400 });
  }

  const { hash, salt } = await hashPassword(body.password);
  await env.DB.prepare(
    "INSERT INTO admins (username, password_hash, password_salt) VALUES (?, ?, ?)",
  )
    .bind(username, hash, salt)
    .run();

  return json({ ok: true });
}
