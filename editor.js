// ============================================================
// ASK REMI — DRAG & DROP BLOG EDITOR
// A visual block editor that exports a ready-to-save HTML post
// matching the site's design template. No server, no database —
// everything runs in the browser and nothing is uploaded anywhere.
// ============================================================

const PASSWORD = "Angel@2002";

/* ---------------- Password gate ---------------- */
(function initGate() {
  const gate = document.getElementById("gate");
  const app = document.getElementById("app");
  const input = document.getElementById("gate-password");
  const submit = document.getElementById("gate-submit");
  const error = document.getElementById("gate-error");

  function unlock() {
    gate.style.display = "none";
    app.classList.add("is-visible");
    input.blur();
  }

  if (sessionStorage.getItem("askremi_editor_unlocked") === "yes") {
    unlock();
  }

  function tryUnlock() {
    if (input.value === PASSWORD) {
      sessionStorage.setItem("askremi_editor_unlocked", "yes");
      unlock();
    } else {
      error.textContent = "That's not it — try again.";
      gate.querySelector(".gate-box").classList.remove("shake");
      void gate.offsetWidth; // restart animation
      gate.querySelector(".gate-box").classList.add("shake");
      input.value = "";
    }
  }

  submit.addEventListener("click", tryUnlock);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
})();

/* ---------------- Block state ---------------- */
let blocks = []; // { id, type, ...fields }
let idCounter = 0;
const uid = () => "b" + (idCounter++);

function addBlock(type, atIndex) {
  const base = { id: uid(), type };
  let block;
  switch (type) {
    case "heading1": block = { ...base, type: "heading", level: 1, html: "" }; break;
    case "heading2": block = { ...base, type: "heading", level: 2, html: "" }; break;
    case "heading3": block = { ...base, type: "heading", level: 3, html: "" }; break;
    case "heading4": block = { ...base, type: "heading", level: 4, html: "" }; break;
    case "paragraph": block = { ...base, type: "paragraph", html: "" }; break;
    case "quote": block = { ...base, type: "quote", html: "" }; break;
    case "image": block = { ...base, type: "image", src: "", alt: "", caption: "" }; break;
    case "linkbutton": block = { ...base, type: "linkbutton", label: "Learn more", href: "#" }; break;
    case "grid": block = { ...base, type: "grid", cols: 2, cells: ["", ""] }; break;
    case "table": block = { ...base, type: "table", hasHeader: true, rows: [["Column 1", "Column 2"], ["", ""], ["", ""]] }; break;
    default: return;
  }
  const index = atIndex === undefined ? blocks.length : atIndex;
  blocks.splice(index, 0, block);
  render();
  return block;
}

function removeBlock(id) {
  blocks = blocks.filter((b) => b.id !== id);
  render();
}

function moveBlock(fromIndex, toIndex) {
  const [moved] = blocks.splice(fromIndex, 1);
  blocks.splice(toIndex, 0, moved);
  render();
}

/* ---------------- Rendering ---------------- */
const canvas = document.getElementById("canvas");
const canvasEmpty = document.getElementById("canvas-empty");

function render() {
  canvas.querySelectorAll(".editor-block").forEach((el) => el.remove());
  canvasEmpty.style.display = blocks.length ? "none" : "block";
  blocks.forEach((block, index) => {
    canvas.appendChild(renderBlock(block, index));
  });
}

function renderBlock(block, index) {
  const wrap = document.createElement("div");
  wrap.className = "editor-block";
  wrap.dataset.index = index;
  wrap.dataset.id = block.id;

  const bar = document.createElement("div");
  bar.className = "block-bar";
  bar.innerHTML = `<span class="handle" draggable="true" title="Drag to reorder">⠿</span><span class="type-tag">${labelFor(block)}</span>`;

  // Heading level switcher
  if (block.type === "heading") {
    const sel = document.createElement("select");
    [1, 2, 3, 4].forEach((lvl) => {
      const opt = document.createElement("option");
      opt.value = lvl; opt.textContent = "H" + lvl;
      if (lvl === block.level) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => { block.level = parseInt(sel.value, 10); render(); });
    bar.appendChild(sel);
  }

  const del = document.createElement("button");
  del.className = "mini-btn del";
  del.textContent = "✕";
  del.title = "Delete block";
  del.addEventListener("click", () => removeBlock(block.id));
  bar.appendChild(del);
  wrap.appendChild(bar);

  wrap.appendChild(renderBlockBody(block));

  // Drag handle for reordering existing blocks
  const handle = bar.querySelector(".handle");
  handle.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/reorder-index", String(index));
    wrap.classList.add("is-dragging");
  });
  handle.addEventListener("dragend", () => wrap.classList.remove("is-dragging"));

  return wrap;
}

function labelFor(block) {
  if (block.type === "heading") return "Heading " + block.level;
  const names = { paragraph: "Paragraph", quote: "Quote", image: "Image", linkbutton: "Link button", grid: "Grid", table: "Table" };
  return names[block.type] || block.type;
}

function makeEditable(tagName, html, placeholder, onInput) {
  const el = document.createElement(tagName);
  el.className = "editable";
  el.contentEditable = "true";
  el.dataset.placeholder = placeholder || "Type here...";
  el.innerHTML = html || "";
  el.addEventListener("input", () => onInput(el.innerHTML));
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault(); // keep each block single-line/paragraph
  });
  return el;
}

function renderBlockBody(block) {
  const body = document.createElement("div");

  if (block.type === "heading") {
    body.appendChild(makeEditable("h" + Math.min(block.level, 4), block.html, "Heading text", (v) => (block.html = v)));
    return body;
  }

  if (block.type === "paragraph") {
    body.appendChild(makeEditable("p", block.html, "Write a paragraph...", (v) => (block.html = v)));
    return body;
  }

  if (block.type === "quote") {
    body.appendChild(makeEditable("blockquote", block.html, "A quotable line...", (v) => (block.html = v)));
    return body;
  }

  if (block.type === "image") {
    const fields = document.createElement("div");
    fields.className = "block-image-fields";
    fields.innerHTML = `
      <input type="text" placeholder="Image URL (e.g. images/photo.jpg)" value="${escapeAttr(block.src)}" data-field="src">
      <input type="text" placeholder="Alt text (describe the image)" value="${escapeAttr(block.alt)}" data-field="alt">
      <input type="text" placeholder="Caption (optional)" value="${escapeAttr(block.caption)}" data-field="caption">
    `;
    const preview = document.createElement("div");
    preview.className = "block-image-preview";
    preview.innerHTML = block.src ? `<img src="${escapeAttr(block.src)}" alt="">` : "No image yet";
    fields.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("input", () => {
        block[inp.dataset.field] = inp.value;
        preview.innerHTML = block.src ? `<img src="${escapeAttr(block.src)}" alt="">` : "No image yet";
      });
    });
    body.appendChild(fields);
    body.appendChild(preview);
    return body;
  }

  if (block.type === "linkbutton") {
    const fields = document.createElement("div");
    fields.className = "block-link-fields";
    fields.innerHTML = `
      <input type="text" placeholder="Button text" value="${escapeAttr(block.label)}" data-field="label">
      <input type="text" placeholder="Link (URL or #newsletter)" value="${escapeAttr(block.href)}" data-field="href">
    `;
    fields.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("input", () => (block[inp.dataset.field] = inp.value));
    });
    body.appendChild(fields);
    return body;
  }

  if (block.type === "grid") {
    const toggle = document.createElement("div");
    toggle.className = "grid-cols-toggle";
    [2, 3].forEach((n) => {
      const btn = document.createElement("button");
      btn.textContent = n + " columns";
      if (block.cols === n) btn.style.borderColor = "var(--accent)";
      btn.addEventListener("click", () => {
        block.cols = n;
        while (block.cells.length < n) block.cells.push("");
        block.cells = block.cells.slice(0, n);
        render();
      });
      toggle.appendChild(btn);
    });
    body.appendChild(toggle);

    const gridPreview = document.createElement("div");
    gridPreview.className = "content-grid content-grid-" + block.cols;
    block.cells.forEach((cellHtml, i) => {
      const cell = document.createElement("div");
      cell.className = "content-grid-cell";
      const editable = makeEditable("div", cellHtml, "Column " + (i + 1) + "...", (v) => (block.cells[i] = v));
      cell.appendChild(editable);
      gridPreview.appendChild(cell);
    });
    body.appendChild(gridPreview);
    return body;
  }

  if (block.type === "table") {
    const controls = document.createElement("div");
    controls.className = "table-controls";
    const addRow = mkBtn("+ Row", () => { block.rows.push(block.rows[0].map(() => "")); render(); });
    const delRow = mkBtn("− Row", () => { if (block.rows.length > 1) { block.rows.pop(); render(); } });
    const addCol = mkBtn("+ Col", () => { block.rows.forEach((r) => r.push("")); render(); });
    const delCol = mkBtn("− Col", () => { if (block.rows[0].length > 1) { block.rows.forEach((r) => r.pop()); render(); } });
    const headerToggle = mkBtn(block.hasHeader ? "Header: On" : "Header: Off", () => { block.hasHeader = !block.hasHeader; render(); });
    [addRow, delRow, addCol, delCol, headerToggle].forEach((b) => controls.appendChild(b));
    body.appendChild(controls);

    const table = document.createElement("table");
    table.className = "content-table";
    block.rows.forEach((row, r) => {
      const tr = document.createElement("tr");
      row.forEach((cellText, c) => {
        const tag = block.hasHeader && r === 0 ? "th" : "td";
        const td = document.createElement(tag);
        const editable = makeEditable("div", cellText, "...", (v) => (block.rows[r][c] = v));
        td.appendChild(editable);
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    body.appendChild(table);
    return body;
  }

  return body;
}

function mkBtn(text, onClick) {
  const b = document.createElement("button");
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}

function escapeAttr(str) {
  return (str || "").replace(/"/g, "&quot;");
}

/* ---------------- Drag & drop from palette + reordering ---------------- */
document.querySelectorAll(".palette-item").forEach((item) => {
  item.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/new-block-type", item.dataset.type);
  });
});

let dropLine = null;
function getDropIndex(clientY) {
  const blockEls = [...canvas.querySelectorAll(".editor-block")];
  for (let i = 0; i < blockEls.length; i++) {
    const rect = blockEls[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return blockEls.length;
}

canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  const index = getDropIndex(e.clientY);
  if (!dropLine) {
    dropLine = document.createElement("div");
    dropLine.className = "canvas-drop-line";
  }
  const blockEls = [...canvas.querySelectorAll(".editor-block")];
  if (index >= blockEls.length) {
    canvas.appendChild(dropLine);
  } else {
    canvas.insertBefore(dropLine, blockEls[index]);
  }
});

canvas.addEventListener("dragleave", (e) => {
  if (e.target === canvas && dropLine) dropLine.remove();
});

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  const index = getDropIndex(e.clientY);
  if (dropLine) { dropLine.remove(); dropLine = null; }

  const newType = e.dataTransfer.getData("text/new-block-type");
  const reorderIndex = e.dataTransfer.getData("text/reorder-index");

  if (newType) {
    addBlock(newType, index);
  } else if (reorderIndex !== "") {
    const from = parseInt(reorderIndex, 10);
    let to = index;
    if (from < to) to -= 1; // account for removal shifting indices
    if (from !== to) moveBlock(from, to);
  }
});

/* ---------------- Format bar (bold / italic / link) ---------------- */
document.querySelectorAll(".format-bar button[data-cmd]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const cmd = btn.dataset.cmd;
    if (cmd === "link") {
      const url = prompt("Link URL:", "https://");
      if (url) document.execCommand("createLink", false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
  });
});

/* ---------------- Export ---------------- */
function blockToHtml(block) {
  switch (block.type) {
    case "heading":
      return `        <h${block.level}>${block.html || ""}</h${block.level}>`;
    case "paragraph":
      return `        <p>${block.html || ""}</p>`;
    case "quote":
      return `        <blockquote>${block.html || ""}</blockquote>`;
    case "image": {
      const cap = block.caption ? `\n          <figcaption>${block.caption}</figcaption>` : "";
      return `        <figure>\n          <img src="${block.src || ""}" alt="${escapeAttr(block.alt)}" loading="lazy">${cap}\n        </figure>`;
    }
    case "linkbutton":
      return `        <p style="text-align:center;"><a href="${block.href || "#"}" class="btn btn-primary">${block.label || "Learn more"}</a></p>`;
    case "grid": {
      const cells = block.cells.map((c) => `          <div class="content-grid-cell">${c || ""}</div>`).join("\n");
      return `        <div class="content-grid content-grid-${block.cols}">\n${cells}\n        </div>`;
    }
    case "table": {
      const rowsHtml = block.rows
        .map((row, r) => {
          const tag = block.hasHeader && r === 0 ? "th" : "td";
          const cells = row.map((c) => `<${tag}>${c || ""}</${tag}>`).join("");
          return `          <tr>${cells}</tr>`;
        })
        .join("\n");
      return `        <table class="content-table">\n${rowsHtml}\n        </table>`;
    }
    default:
      return "";
  }
}

function buildFullHtml() {
  const title = document.getElementById("set-title").value || "Untitled Post";
  const slug = document.getElementById("set-slug").value || "untitled-post";
  const desc = document.getElementById("set-desc").value || "";
  const category = document.getElementById("set-category").value || "General";
  const author = document.getElementById("set-author").value || "Remi Grant";
  const readtime = document.getElementById("set-readtime").value || "5 min read";
  const heroImg = document.getElementById("set-heroimg").value || "";
  const heroAlt = document.getElementById("set-heroalt").value || "";
  const today = new Date().toISOString().slice(0, 10);
  const dateDisplay = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const bodyHtml = blocks.map(blockToHtml).join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${title} — Ask Remi</title>
<meta name="description" content="${escapeAttr(desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.askremi.com/posts/${slug}.html">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Ask Remi">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(desc)}">
<meta property="og:url" content="https://www.askremi.com/posts/${slug}.html">
<meta property="article:published_time" content="${today}T09:00:00-05:00">
<meta property="article:author" content="${escapeAttr(author)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(desc)}">

<link rel="icon" type="image/png" href="../images/favicon.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${escapeAttr(title)}",
  "description": "${escapeAttr(desc)}",
  "author": { "@type": "Person", "name": "${escapeAttr(author)}" },
  "publisher": { "@type": "Organization", "name": "Ask Remi" },
  "datePublished": "${today}T09:00:00-05:00",
  "mainEntityOfPage": "https://www.askremi.com/posts/${slug}.html"
}
<\/script>
</head>
<body>

<header class="site-header">
  <div class="wrap">
    <a href="../index.html" class="logo" aria-label="Ask Remi home">Ask<span class="dot">.</span>Remi</a>
    <nav class="main-nav" aria-label="Primary">
      <a href="../index.html#latest">Latest</a>
      <a href="../index.html#topics">Topics</a>
      <a href="../about.html">About</a>
      <a href="../index.html#newsletter" class="btn btn-primary">Subscribe</a>
    </nav>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">☰</button>
  </div>
</header>

<main>
  <section class="post-hero">
    <div class="wrap">
      <span class="eyebrow">${escapeAttr(category)}</span>
      <h1>${title}</h1>
      <div class="post-meta">
        <span>By ${escapeAttr(author)}</span>
        <span>${dateDisplay}</span>
        <span>${escapeAttr(readtime)}</span>
      </div>
      ${heroImg ? `<div class="post-hero-media"><img src="${heroImg}" alt="${escapeAttr(heroAlt)}"></div>` : ""}
    </div>
  </section>

  <div class="wrap">
    <div class="post-layout">
      <article class="post-body">
${bodyHtml}
      </article>

      <aside class="post-sidebar">
        <span class="eyebrow">Share</span>
        <div class="share-list">
          <a href="#" aria-label="Share on X">X / Twitter</a>
          <a href="#" aria-label="Share on LinkedIn">LinkedIn</a>
          <a href="#" aria-label="Copy link">Copy link</a>
        </div>
      </aside>
    </div>
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a href="../index.html" class="logo" aria-label="Ask Remi home">Ask<span class="dot">.</span>Remi</a>
        <p style="margin-top:1rem; max-width:32ch;">Clear, well-researched answers for people who'd rather know than guess.</p>
      </div>
      <div>
        <h4>Topics</h4>
        <ul><li><a href="../index.html#topics">Money</a></li><li><a href="../index.html#topics">Tools</a></li><li><a href="../index.html#topics">Internet</a></li></ul>
      </div>
      <div>
        <h4>Site</h4>
        <ul><li><a href="../about.html">About</a></li><li><a href="../index.html#latest">Latest posts</a></li><li><a href="../index.html#newsletter">Newsletter</a></li></ul>
      </div>
      <div>
        <h4>Elsewhere</h4>
        <ul><li><a href="#">X / Twitter</a></li><li><a href="#">Instagram</a></li><li><a href="#">RSS</a></li></ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Ask Remi. All rights reserved.</span>
      <span>Built for readers, not algorithms.</span>
    </div>
  </div>
</footer>

<script src="../script.js"><\/script>
</body>
</html>`;
}

const exportModal = document.getElementById("export-modal");
const exportOutput = document.getElementById("export-output");

document.getElementById("btn-export").addEventListener("click", () => {
  exportOutput.value = buildFullHtml();
  exportModal.classList.add("is-open");
});
document.getElementById("btn-close-export").addEventListener("click", () => exportModal.classList.remove("is-open"));

document.getElementById("btn-copy").addEventListener("click", () => {
  exportOutput.select();
  document.execCommand("copy");
  const btn = document.getElementById("btn-copy");
  const original = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = original), 1500);
});

document.getElementById("btn-download").addEventListener("click", () => {
  const slug = document.getElementById("set-slug").value || "untitled-post";
  const blob = new Blob([exportOutput.value], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = slug + ".html";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("btn-preview").addEventListener("click", () => {
  const html = buildFullHtml();
  const win = window.open("", "_blank");
  win.document.open();
  win.document.write(html);
  win.document.close();
});

/* ---------------- Init ---------------- */
render();
