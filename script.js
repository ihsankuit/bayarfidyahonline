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

const donateAmount = document.querySelector("#donate-amount");
const donateBreakdown = document.querySelector("#donate-breakdown");

const updateTotal = () => {
  const days = Math.max(0, Number.parseInt(daysInput.value || "0", 10));
  const rate = Math.max(0, Number.parseFloat(rateInput.value || "0"));
  const total = days * rate;
  const category = categoryInput.value;

  totalOutput.textContent = formatCurrency(total);
  whatsappLink.href = buildWhatsappMessage(days, rate, total, category);

  if (donateAmount) donateAmount.textContent = formatCurrency(total);
  if (donateBreakdown) donateBreakdown.textContent = `${days} hari × RM${rate.toFixed(2)}`;
};

[daysInput, rateInput, categoryInput].forEach((input) => {
  input.addEventListener("input", updateTotal);
  input.addEventListener("change", updateTotal);
});

updateTotal();

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

const donateForm = document.querySelector("#donate-form");
if (donateForm) {
  donateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errorEl = document.querySelector("#donate-error");
    const submitBtn = document.querySelector("#donate-submit");
    errorEl.textContent = "";

    const days = Math.max(0, Number.parseInt(daysInput.value || "0", 10));
    const rate = Math.max(0, Number.parseFloat(rateInput.value || "0"));

    if (days < 1) {
      errorEl.textContent = "Sila masukkan bilangan hari yang sah di kalkulator.";
      return;
    }

    const payload = {
      name: document.querySelector("#donate-name").value.trim(),
      email: document.querySelector("#donate-email").value.trim(),
      phone: document.querySelector("#donate-phone").value.trim(),
      days,
      rate,
      category: categoryInput.value,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Menyediakan bayaran...";

    try {
      const res = await fetch("/api/donate/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        errorEl.textContent = data.error || "Gagal memulakan bayaran. Cuba lagi.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Teruskan Bayaran";
        return;
      }

      window.location.href = data.url;
    } catch {
      errorEl.textContent = "Ralat rangkaian. Sila cuba lagi.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Teruskan Bayaran";
    }
  });
}

loadBlogPosts();

const loadGallery = async () => {
  const gallery = document.querySelector("#gallery-grid");
  if (!gallery) return;

  try {
    const res = await fetch("/api/gallery");
    if (!res.ok) return;

    const data = await res.json();
    const images = data.images || [];
    const slots = gallery.querySelectorAll(".img-slot");

    images.forEach((img) => {
      const slot = slots[img.position - 1];
      if (!slot) return;

      if (img.image_url) {
        slot.innerHTML = `<img src="${escapeHtml(img.image_url)}" alt="Gambar ${img.position}">`;
      }
    });
  } catch {
    // Kekalkan slot statik sedia ada jika API belum tersedia.
  }
};

loadGallery();
