const daysInput = document.querySelector("#days");
const rateInput = document.querySelector("#rate");
const categoryInput = document.querySelector("#category");
const totalOutput = document.querySelector("#total");
const whatsappLink = document.querySelector("#whatsapp-link");

const formatCurrency = (value) =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);

const buildWhatsappMessage = (days, rate, total, category) => {
  const message = [
    "Assalamualaikum, saya ingin bertanya tentang bayaran fidyah.",
    `Kategori: ${category}`,
    `Bilangan hari: ${days}`,
    `Kadar sehari: RM${rate.toFixed(2)}`,
    `Jumlah anggaran: ${formatCurrency(total)}`,
  ].join("\n");

  return `https://wa.me/601113190312?text=${encodeURIComponent(message)}`;
};

const updateTotal = () => {
  const days = Math.max(0, Number.parseInt(daysInput.value || "0", 10));
  const rate = Math.max(0, Number.parseFloat(rateInput.value || "0"));
  const total = days * rate;
  const category = categoryInput.value;

  totalOutput.textContent = formatCurrency(total);
  whatsappLink.href = buildWhatsappMessage(days, rate, total, category);
};

const setupOnpayFrame = () => {
  const frame = document.querySelector("#onpay-order-form-iframe");

  if (!frame || typeof window.iFrameResize !== "function") {
    return false;
  }

  window.iFrameResize(
    {
      checkOrigin: false,
    },
    "#onpay-order-form-iframe",
  );

  return true;
};

[daysInput, rateInput, categoryInput].forEach((input) => {
  input.addEventListener("input", updateTotal);
  input.addEventListener("change", updateTotal);
});

updateTotal();

window.addEventListener("load", () => {
  if (!setupOnpayFrame()) {
    window.setTimeout(setupOnpayFrame, 1500);
  }
});

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderBlogCard = (post, index) => {
  const cover = post.cover_image_url
    ? `<img class="blog-thumb" src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.title)}">`
    : `<div class="img-slot img-slot--wide blog-thumb"><span>Gambar</span><small>Belum diupload</small></div>`;

  const dateLabel = new Date(post.published_at || post.created_at).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
    <article class="blog-card${index === 1 ? " featured" : ""}">
      ${cover}
      <div class="blog-card-body">
        <div class="blog-meta">
          <span>Blog</span>
          <span>${dateLabel}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt || "")}</p>
        <a href="/blog/${encodeURIComponent(post.slug)}" aria-label="Baca ${escapeHtml(post.title)}">Baca panduan</a>
      </div>
    </article>
  `;
};

const loadBlogPosts = async () => {
  const grid = document.querySelector("#blog-grid");
  if (!grid) return;

  try {
    const res = await fetch("/api/posts?status=published&limit=6");
    if (!res.ok) return;

    const data = await res.json();
    const posts = data.posts || [];
    if (!posts.length) return;

    grid.innerHTML = posts.map(renderBlogCard).join("");
  } catch {
    // Kekalkan kad statik sedia ada jika API belum tersedia.
  }
};

loadBlogPosts();
