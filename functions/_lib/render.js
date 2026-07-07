function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Converts plain-text post content (blank-line separated paragraphs, with
// **bold**, *italic*, and [text](url) links) into escaped, safe HTML.
export function renderContent(raw) {
  const paragraphs = String(raw)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((p) => {
      let html = escapeHtml(p).replace(/\n/g, "<br>");
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
      html = html.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" rel="noopener noreferrer">$1</a>',
      );
      return `<p>${html}</p>`;
    })
    .join("\n");
}

export { escapeHtml };
