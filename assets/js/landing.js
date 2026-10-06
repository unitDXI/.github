/* Unit 511 (DXI) — GitHub landing page enhancements. Native ES module, no dependencies.
   1. Theme toggle (the inline script in <head> sets the theme before first paint).
   2. Public repository list and recent activity from the unauthenticated GitHub API
      (60 requests per hour per visitor), cached for 30 minutes. On any failure the static
      fallback content in the page stays. */

const TTL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 4000;

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch (e) { /* storage blocked: carry on without it */ }
  return null;
}

function el(tag, attrs, text) {
  const n = document.createElement(tag);
  for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}

function cachedFetch(key, url) {
  let hit = null;
  try { hit = JSON.parse(store(key) || "null"); } catch (e) { hit = null; }
  if (hit && Date.now() - hit.t < TTL_MS) return Promise.resolve(hit.d);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return fetch(url, { signal: ctrl.signal, headers: { Accept: "application/vnd.github+json" } })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { clearTimeout(timer); store(key, JSON.stringify({ t: Date.now(), d })); return d; })
    .finally(() => clearTimeout(timer));
}

function initTheme() {
  const root = document.documentElement;
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  const sync = () => btn.setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark"));
  btn.hidden = false;
  sync();
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store("theme", next);
    sync();
  });
}

function initRepos() {
  const box = document.querySelector("[data-gh-repos]");
  if (!box) return;
  const org = box.getAttribute("data-org");
  cachedFetch("dxi:gh-repos", "https://api.github.com/orgs/" + org + "/repos?type=public&sort=updated&per_page=30")
    .then((repos) => {
      const list = repos.filter((r) => !r.private).map((r) => ({
        name: r.name, url: r.html_url, desc: r.description, lang: r.language,
        stars: r.stargazers_count, updated: r.pushed_at, archived: r.archived, fork: r.fork,
      }));
      if (!list.length) return;
      const ul = el("ul", { class: "repo-list" });
      list.forEach((r) => {
        const li = el("li", { class: "repo" });
        const h = el("h3", { class: "repo__name" });
        h.appendChild(el("a", { href: r.url, rel: "noopener" }, r.name));
        if (r.archived) h.appendChild(el("span", { class: "badge" }, "Archived"));
        if (r.fork) h.appendChild(el("span", { class: "badge" }, "Fork"));
        li.appendChild(h);
        li.appendChild(el("p", null, r.desc || "No description yet."));
        const meta = el("p", { class: "repo__meta" });
        if (r.lang) meta.appendChild(el("span", null, r.lang));
        meta.appendChild(el("span", null, r.stars + (r.stars === 1 ? " star" : " stars")));
        if (r.updated) meta.appendChild(el("span", null, "Updated " + new Date(r.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })));
        li.appendChild(meta);
        ul.appendChild(li);
      });
      box.querySelector(".repo-list").replaceWith(ul);
    })
    .catch(() => { /* static fallback stays */ });
}

function initActivity() {
  const box = document.querySelector("[data-gh-activity]");
  if (!box) return;
  const queries = [["Recently merged", box.getAttribute("data-merged")], ["Open issues", box.getAttribute("data-open")]];
  Promise.all(queries.map(([, q], i) =>
    cachedFetch("dxi:gh-activity:" + i, "https://api.github.com/search/issues?per_page=5&sort=updated&q=" + encodeURIComponent(q))
      .then((j) => (j.items || []).map((it) => ({ title: it.title, url: it.html_url, repo: it.repository_url.split("/").pop() })))
  )).then((sets) => {
    const frag = document.createDocumentFragment();
    sets.forEach((set, i) => {
      const col = el("div");
      col.appendChild(el("h4", null, queries[i][0]));
      const ul = el("ul");
      set.forEach((it) => {
        const li = el("li");
        li.appendChild(el("a", { href: it.url, rel: "noopener" }, it.title));
        li.appendChild(el("span", { class: "muted" }, " · " + it.repo));
        ul.appendChild(li);
      });
      if (!set.length) ul.appendChild(el("li", { class: "muted" }, "Nothing here yet."));
      col.appendChild(ul);
      frag.appendChild(col);
    });
    box.textContent = "";
    box.appendChild(frag);
  }).catch(() => { /* static fallback stays */ });
}

initTheme();
initRepos();
initActivity();
