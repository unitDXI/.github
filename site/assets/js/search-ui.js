/* Unit 511 — search UI: the Ctrl/Cmd+K (or "/") dialog on every page and the site/search/?q= page.
   Results are links; ↓/↑ move between them and back to the input. The index lives in search-index.js. */
import { loadIndex, search } from "./search-index.js";
import { sitePath } from "./util.js";

const TYPES = { lesson: "Lesson", course: "Course", page: "Page", post: "Blog", notebook: "Notebook", home: "Page", curriculum: "Page", blog: "Page" };

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function snippet(d, terms) {
  const text = d.x || d.d || "";
  const lower = text.toLowerCase();
  let at = -1;
  terms.forEach((t) => { const i = lower.indexOf(t); if (i !== -1 && (at === -1 || i < at)) at = i; });
  const start = Math.max(0, at - 60);
  const end = at === -1 ? Math.min(text.length, 160) : Math.min(text.length, at + 110);
  let s = text.slice(start, end);
  if (start > 0) s = "…" + s.replace(/^\S*\s/, "");
  if (end < text.length) s = s.replace(/\s\S*$/, "") + "…";
  return s;
}

function withMarks(text, terms) {
  const frag = document.createDocumentFragment();
  if (!terms.length) { frag.appendChild(document.createTextNode(text)); return frag; }
  const rx = new RegExp("(" + terms.map(escapeRx).sort((a, b) => b.length - a.length).join("|") + ")", "gi");
  text.split(rx).forEach((part, i) => {
    if (i % 2) { const m = document.createElement("mark"); m.textContent = part; frag.appendChild(m); }
    else if (part) frag.appendChild(document.createTextNode(part));
  });
  return frag;
}

function span(cls, content) {
  const s = document.createElement("span");
  s.className = cls;
  if (typeof content === "string") s.textContent = content; else s.appendChild(content);
  return s;
}

function renderResults(list, status, out, q) {
  list.textContent = "";
  if (!q.trim()) { status.textContent = ""; return; }
  out.results.forEach((d) => {
    const a = document.createElement("a");
    a.className = "search-result";
    a.href = d.u;
    const top = document.createElement("span");
    top.className = "search-result__top";
    top.append(span("search-result__title", withMarks(d.h || d.t, out.terms)), span("badge", TYPES[d.y] || "Page"));
    a.append(top, span("search-result__crumb", d.c), span("search-result__snippet", withMarks(snippet(d, out.terms), out.terms)));
    const li = document.createElement("li");
    li.appendChild(a);
    list.appendChild(li);
  });
  const n = out.results.length;
  status.textContent = n
    ? (out.partial ? "No page matches every word. Showing " + n + " partial matches." : n + (n === 20 ? "+ results" : n === 1 ? " result" : " results"))
    : "No results for “" + q.trim() + "”.";
}

function bindResultKeys(input, list) {
  input.addEventListener("keydown", (e) => {
    const first = list.querySelector("a");
    if (e.key === "ArrowDown" && first) { e.preventDefault(); first.focus(); }
    if (e.key === "Enter" && first && input.closest("dialog")) { e.preventDefault(); location.href = first.href; }
  });
  list.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const links = Array.from(list.querySelectorAll("a"));
    const i = links.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    if (e.key === "ArrowDown" && i < links.length - 1) links[i + 1].focus();
    else if (e.key === "ArrowUp") (i > 0 ? links[i - 1] : input).focus();
  });
}

function wire(input, list, status, onQuery) {
  let timer, idx = null;
  const run = () => {
    const q = input.value;
    if (onQuery) onQuery(q);
    if (!q.trim()) { renderResults(list, status, { results: [] }, q); return; }
    if (idx) { renderResults(list, status, search(idx, q), q); return; }
    status.textContent = "Preparing search…";
    loadIndex((done, total) => { status.textContent = "Preparing search: " + done + " of " + total + " pages"; })
      .then((i) => { idx = i; if (q === input.value) renderResults(list, status, search(idx, input.value), input.value); })
      .catch(() => {
        status.textContent = "Search couldn’t load. ";
        const a = document.createElement("a");
        a.href = sitePath("search/");
        a.textContent = "Browse every page instead.";
        status.appendChild(a);
      });
  };
  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 80); });
  bindResultKeys(input, list);
  return { run, warm: () => loadIndex().then((i) => { idx = i; }, () => {}) };
}

function initDialog() {
  const dialog = document.getElementById("search-dialog");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const input = document.getElementById("search-dialog-input");
  const list = document.getElementById("search-dialog-results");
  const ui = wire(input, list, document.getElementById("search-dialog-status"));
  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    input.focus();
    input.select();
    ui.warm();
  };
  document.querySelectorAll("[data-search-open]").forEach((a) => a.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || location.pathname === sitePath("search/")) return;
    e.preventDefault();
    open();
  }));
  dialog.querySelector("[data-search-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.querySelector("form").addEventListener("submit", (e) => {
    const first = list.querySelector("a");
    if (first) { e.preventDefault(); location.href = first.href; }
  });
  document.addEventListener("keydown", (e) => {
    const a = document.activeElement;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); open(); }
    else if (e.key === "/" && !typing && !dialog.open) { e.preventDefault(); open(); }
  });
  const kbd = document.querySelector(".search-btn__kbd");
  if (kbd && /Mac|iPhone|iPad/.test(navigator.platform || "")) kbd.textContent = "⌘K";
}

function initSearchPage() {
  const form = document.querySelector("[data-search-page]");
  if (!form) return;
  const input = form.querySelector("input[type=search]");
  const ui = wire(input, document.getElementById("search-page-results"), document.getElementById("search-page-status"), (q) => {
    history.replaceState(null, "", location.pathname + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : ""));
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); ui.run(); });
  const initial = new URLSearchParams(location.search).get("q");
  if (initial) { input.value = initial; ui.run(); }
}

export function initSearch() {
  initDialog();
  initSearchPage();
}
