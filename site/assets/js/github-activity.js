/* Unit 511 — "From the repo" widget on the home page.
   Reads recently merged pull requests and open issues from the public GitHub search API
   (60 unauthenticated requests per hour per visitor), caches them for 30 minutes, and keeps
   the static fallback text on any failure. */
import { el, store } from "./util.js";

const CACHE_KEY = "u511:gh-activity";
const TTL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 4000;

export function initGitHubActivity() {
  const box = document.querySelector("[data-gh-activity]");
  if (!box) return;
  const queries = [["Recently merged", box.getAttribute("data-merged")], ["Open issues", box.getAttribute("data-open")]];

  const render = (sets) => {
    const frag = document.createDocumentFragment();
    sets.forEach((set, i) => {
      const col = el("div");
      col.appendChild(el("h3", null, queries[i][0]));
      const ul = el("ul");
      set.forEach((it) => {
        const li = el("li");
        li.appendChild(el("a", { href: it.url, rel: "noopener" }, it.title));
        li.appendChild(el("span", { class: "meta" }, " · " + it.repo));
        ul.appendChild(li);
      });
      if (!set.length) ul.appendChild(el("li", { class: "muted" }, "Nothing here yet."));
      col.appendChild(ul);
      frag.appendChild(col);
    });
    box.textContent = "";
    box.appendChild(frag);
  };

  let cached = null;
  try { cached = JSON.parse(store("localStorage", CACHE_KEY) || "null"); } catch (e) { cached = null; }
  if (cached && Date.now() - cached.t < TTL_MS) { render(cached.d); return; }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  Promise.all(queries.map(([, q]) =>
    fetch("https://api.github.com/search/issues?per_page=5&sort=updated&q=" + encodeURIComponent(q), {
      signal: ctrl.signal, headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((j) => (j.items || []).map((it) => ({
        title: it.title, url: it.html_url, repo: it.repository_url.split("/").slice(-1)[0],
      })))
  )).then((d) => {
    clearTimeout(timer);
    store("localStorage", CACHE_KEY, JSON.stringify({ t: Date.now(), d }));
    render(d);
  }).catch(() => clearTimeout(timer));
}
