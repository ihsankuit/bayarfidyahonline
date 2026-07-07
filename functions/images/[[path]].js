export async function onRequestGet({ params, env }) {
  const key = Array.isArray(params.path) ? params.path.join("/") : params.path;
  const object = await env.IMAGES.get(key);

  if (!object) {
    return new Response("Gambar tidak dijumpai.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
