import { json } from "../../_lib/response.js";

export async function onRequestGet({ env }) {
  const row = await env.DB.prepare("SELECT COUNT(*) as count FROM admins").first();
  return json({ needsSetup: row.count === 0 });
}
