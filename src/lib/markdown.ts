/**
 * Minimal, dependency-free markdown renderer for CMS and blog content.
 * Supports: ## headings, paragraphs, unordered lists, bold, italics, links, hr.
 * Input is admin-controlled; output is escaped before formatting is applied.
 */
export function markdownToHtml(src: string): string {
  const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" rel="noopener noreferrer" class="text-brand-600 underline hover:text-brand-700">$1</a>');

  const blocks = src.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim().length > 0);
      if (!lines.length) return "";
      if (lines.every((l) => /^[-*] /.test(l.trim()))) {
        return `<ul class="my-4 list-disc space-y-2 pl-6 text-gray-700">${lines
          .map((l) => `<li>${inline(l.trim().replace(/^[-*] /, ""))}</li>`)
          .join("")}</ul>`;
      }
      if (/^### /.test(lines[0])) return lines.map((l) => heading(l, 3, inline)).join("");
      if (/^## /.test(lines[0])) return lines.map((l) => heading(l, 3, inline)).join("");
      if (/^# /.test(lines[0])) return lines.map((l) => heading(l, 2, inline)).join("");
      if (/^(---|\*\*\*)$/.test(lines[0].trim())) return "<hr class='my-6 border-gray-200'>";
      return `<p class="my-4 leading-8 text-gray-700">${inline(block.trim()).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

function heading(line: string, level: number, inline: (s: string) => string): string {
  const text = line.replace(/^#{1,4} /, "");
  if (level === 2) return `<h2 class="font-display mt-8 mb-3 text-2xl font-medium text-ink">${inline(text)}</h2>`;
  return `<h3 class="mt-6 mb-2 text-lg font-bold text-ink">${inline(text)}</h3>`;
}
