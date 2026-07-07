import { renderContent, escapeHtml } from "../_lib/render.js";

function layout({ title, description, bodyHtml }) {
  return `<!doctype html>
<html lang="ms">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/#top" aria-label="Ihsan Fidyah">
        <span class="brand-mark" aria-hidden="true">IF</span>
        <span>
          <strong>Ihsan Fidyah</strong>
          <small>Pertubuhan IhsanKu Malaysia</small>
        </span>
      </a>
      <nav class="nav-links" aria-label="Navigasi utama">
        <a href="/#kira">Kira Fidyah</a>
        <a href="/#kategori">Kategori</a>
        <a href="/#galeri">Galeri</a>
        <a href="/#blog">Blog</a>
        <a href="/#faq">FAQ</a>
        <a href="/#hubungi">Hubungi</a>
      </nav>
      <a class="header-cta" href="/#bayar">Bayar Sekarang</a>
    </header>
    <main>
      ${bodyHtml}
    </main>
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <strong>Ihsan Fidyah</strong>
          <p>Pertubuhan IhsanKu Malaysia</p>
        </div>
        <div>
          <a href="mailto:salam@ihsanku.org">salam@ihsanku.org</a>
          <a href="https://wa.me/601113190312">WhatsApp Admin</a>
        </div>
      </div>
    </footer>
  </body>
</html>`;
}

function notFoundResponse() {
  return new Response(
    layout({
      title: "Post tidak dijumpai | Ihsan Fidyah",
      description: "Post yang dicari tidak wujud.",
      bodyHtml: `<section class="section-band"><div class="container"><h1>Post tidak dijumpai</h1><p><a href="/#blog">Kembali ke Blog</a></p></div></section>`,
    }),
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function onRequestGet({ params, env }) {
  const post = await env.DB.prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .bind(params.slug)
    .first();

  if (!post) return notFoundResponse();

  const cover = post.cover_image_url
    ? `<img class="post-cover" src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.title)}">`
    : "";

  const dateLabel = new Date(post.published_at || post.created_at).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bodyHtml = `
    <article class="post-page section-band">
      <div class="container post-container">
        <p class="section-label">Blog</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="post-date">${dateLabel}</p>
        ${cover}
        <div class="post-content">${renderContent(post.content)}</div>
        <p><a class="button outline" href="/#blog">Kembali ke Blog</a></p>
      </div>
    </article>
  `;

  return new Response(
    layout({
      title: `${post.title} | Ihsan Fidyah`,
      description: post.excerpt || post.title,
      bodyHtml,
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
