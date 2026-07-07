const state = { posts: [], currentId: null };

const views = {
  setup: document.getElementById("setup-view"),
  login: document.getElementById("login-view"),
  app: document.getElementById("app-view"),
};

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setHeaderActions(authenticated, username) {
  const el = document.getElementById("admin-header-actions");
  if (!authenticated) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = `<span class="admin-username">${escapeHtml(username)}</span><button id="logout-btn" class="button outline" type="button">Log Keluar</button>`;
  document.getElementById("logout-btn").addEventListener("click", logout);
}

async function init() {
  const setupRes = await fetch("/api/auth/setup-status");
  const setupData = await setupRes.json();

  if (setupData.needsSetup) {
    setHeaderActions(false);
    showView("setup");
    return;
  }

  const meRes = await fetch("/api/auth/me");
  if (meRes.ok) {
    const meData = await meRes.json();
    setHeaderActions(true, meData.username);
    showView("app");
    await loadPosts();
  } else {
    setHeaderActions(false);
    showView("login");
  }
}

document.getElementById("setup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const errorEl = document.getElementById("setup-error");
  errorEl.textContent = "";

  const res = await fetch("/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: form.username.value.trim(),
      password: form.password.value,
      setupToken: form.setupToken.value,
    }),
  });
  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error || "Gagal cipta akaun admin.";
    return;
  }

  form.reset();
  showView("login");
});

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: form.username.value.trim(),
      password: form.password.value,
    }),
  });
  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error || "Log masuk gagal.";
    return;
  }

  setHeaderActions(true, data.username);
  showView("app");
  await loadPosts();
});

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  setHeaderActions(false);
  showView("login");
}

async function loadPosts() {
  const res = await fetch("/api/posts?status=all&limit=100");
  if (!res.ok) return;
  const data = await res.json();
  state.posts = data.posts || [];
  renderPostList();
}

function renderPostList() {
  const list = document.getElementById("post-list");
  if (!state.posts.length) {
    list.innerHTML = `<li class="post-list-empty">Tiada post lagi.</li>`;
    return;
  }

  list.innerHTML = state.posts
    .map(
      (post) => `
      <li>
        <button type="button" class="post-list-item${post.id === state.currentId ? " active" : ""}" data-id="${post.id}">
          <strong>${escapeHtml(post.title)}</strong>
          <span class="post-list-status status-${post.status}">${post.status === "published" ? "Terbit" : "Draf"}</span>
        </button>
      </li>`,
    )
    .join("");

  list.querySelectorAll(".post-list-item").forEach((btn) => {
    btn.addEventListener("click", () => editPost(Number(btn.dataset.id)));
  });
}

function resetForm() {
  const form = document.getElementById("post-form");
  form.reset();
  document.getElementById("post-id").value = "";
  document.getElementById("post-cover-url").value = "";
  document.getElementById("post-image-preview").innerHTML =
    "<span>Tiada gambar</span><small>Upload di bawah</small>";
  document.getElementById("delete-post-btn").hidden = true;
  document.getElementById("post-error").textContent = "";
  document.getElementById("upload-error").textContent = "";
  state.currentId = null;
  renderPostList();
}

document.getElementById("new-post-btn").addEventListener("click", resetForm);

async function editPost(id) {
  const res = await fetch(`/api/posts/${id}`);
  if (!res.ok) return;
  const data = await res.json();
  const post = data.post;

  state.currentId = post.id;
  document.getElementById("post-id").value = post.id;
  document.getElementById("post-title").value = post.title;
  document.getElementById("post-slug").value = post.slug;
  document.getElementById("post-excerpt").value = post.excerpt || "";
  document.getElementById("post-content").value = post.content;
  document.getElementById("post-status").value = post.status;
  document.getElementById("post-cover-url").value = post.cover_image_url || "";
  document.getElementById("post-image-preview").innerHTML = post.cover_image_url
    ? `<img src="${escapeHtml(post.cover_image_url)}" alt="">`
    : "<span>Tiada gambar</span><small>Upload di bawah</small>";
  document.getElementById("delete-post-btn").hidden = false;
  document.getElementById("post-error").textContent = "";
  document.getElementById("upload-error").textContent = "";

  renderPostList();
}

document.getElementById("post-image-input").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const errorEl = document.getElementById("upload-error");
  errorEl.textContent = "";

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error || "Upload gagal.";
    return;
  }

  document.getElementById("post-cover-url").value = data.url;
  document.getElementById("post-image-preview").innerHTML = `<img src="${escapeHtml(data.url)}" alt="">`;
});

document.getElementById("post-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorEl = document.getElementById("post-error");
  errorEl.textContent = "";

  const body = {
    title: document.getElementById("post-title").value.trim(),
    slug: document.getElementById("post-slug").value.trim(),
    excerpt: document.getElementById("post-excerpt").value.trim(),
    content: document.getElementById("post-content").value,
    coverImageUrl: document.getElementById("post-cover-url").value || null,
    status: document.getElementById("post-status").value,
  };

  const id = document.getElementById("post-id").value;
  const url = id ? `/api/posts/${id}` : "/api/posts";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error || "Gagal simpan post.";
    return;
  }

  await loadPosts();
  if (!id) {
    await editPost(data.id);
  }
});

document.getElementById("delete-post-btn").addEventListener("click", async () => {
  const id = document.getElementById("post-id").value;
  if (!id) return;
  if (!window.confirm("Padam post ini? Tindakan ini tidak boleh diundur.")) return;

  await fetch(`/api/posts/${id}`, { method: "DELETE" });
  resetForm();
  await loadPosts();
});

init();
