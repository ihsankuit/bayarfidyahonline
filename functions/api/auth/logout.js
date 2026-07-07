import { json } from "../../_lib/response.js";
import { sessionCookieHeader } from "../../_lib/auth.js";

export async function onRequestPost() {
  return json({ ok: true }, { headers: { "Set-Cookie": sessionCookieHeader(null, { clear: true }) } });
}
