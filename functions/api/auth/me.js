import { json } from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const session = await requireAdmin(request, env);
  if (!session) return json({ authenticated: false }, { status: 401 });
  return json({ authenticated: true, username: session.username });
}
