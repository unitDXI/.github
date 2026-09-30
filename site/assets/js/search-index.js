/* Unit 511 — full-text search index, built in the browser with no build step.
   The first time search opens, it reads /site/sitemap.xml, fetches every page listed there (plus the
   notebooks those pages link to with data-notebook), splits each page into sections at its h2/h3
   headings, and builds a BM25 index in memory. The extracted text is cached in sessionStorage. */

const CACHE_KEY = "u511:search:v1";
const CONCURRENCY = 6;
const STOP = new Set(("a an and are as at be but by for from has have he her his i if in into is it its of on or our " +
  "she so than that the their them then there these they this to was we were what when which who will with you your").split(" "));
const WORD = /[\p{L}\p{N}_]+/gu;
const PART = /[A-Z]+(?![a-z])|[A-Z]?[a-z]+|[0-9]+/g;
const SKIP = "script, style, button, svg, .anchor, .breadcrumbs, .pager, .attribution, .search-results, figcaption";

/* ---------- Tokenizer ---------- */

const norm = (s) => s.normalize("NFKD").replace(/\p{M}/gu, "");

/** Lowercased words, plus the parts of snake_case / camelCase identifiers. Stop words are dropped unless `code`. */
export function tokenize(text, code) {
  const out = [];
  (norm(text).match(WORD) || []).forEach((w) => {
    const lw = w.toLowerCase();
    if (lw.length > 40) return;
    out.push(lw);
    const parts = w.match(PART) || [];
    if (parts.length > 1) parts.forEach((p) => { p = p.toLowerCase(); if (p !== lw) out.push(p); });
  });
  return code ? out : out.filter((t) => !STOP.has(t));
}

/* ---------- Extraction ---------- */

const squash = (s) => s.replace(/\s+/g, " ").trim();

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

function extractPage(url, doc) {
  const main = doc.querySelector("main");
  if (!main) return { docs: [], notebooks: [] };
  const h1 = main.querySelector("h1");
  const title = h1 ? squash(h1.textContent) : squash(doc.title);
  const crumbs = Array.from(doc.querySelectorAll(".breadcrumbs li"), (li) => squash(li.textContent));
  const crumb = crumbs.slice(0, -1).join(" › ") || "Unit 511";
  const type = doc.body.getAttribute("data-page-type") || "page";
  const sb = doc.getElementById("sidebar");
  const course = (sb && sb.getAttribute("data-course")) || "";
  const sections = [{ id: "", h: "", x: [], d: [] }];
  const walker = doc.createTreeWalker(main, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === 1) {
      if (node.tagName === "H2" || node.tagName === "H3") {
        const clone = node.cloneNode(true);
        clone.querySelectorAll(".anchor").forEach((a) => a.remove());
        sections.push({ id: node.id || "", h: squash(clone.textContent), x: [], d: [] });
      }
      continue;
    }
    const parent = node.parentElement;
    if (parent.closest("h1, h2, h3")) continue;
    const s = sections[sections.length - 1];
    (parent.closest("pre") ? s.d : s.x).push(node.nodeValue);
  }
  const notebooks = Array.from(main.querySelectorAll("a[data-notebook]"), (a) => ({ raw: a.getAttribute("data-notebook"), view: a.href }));
  const docs = [];
  sections.forEach((s, i) => {
    const x = squash(s.x.join(" ")), d = squash(s.d.join("\n"));
    if (i > 0 && !x && !d) return;
    docs.push({ u: url + (s.id ? "#" + s.id : ""), t: title, h: i ? s.h : "", c: i ? crumb + " › " + title : crumb,
      y: type, k: course, x: x.slice(0, 4000), d: d.slice(0, 4000), i: i === 0 });
  });
  return { docs, notebooks };
}

function extractNotebook(nb, json, course) {
  const file = nb.raw.split("/").pop();
  let title = file;
  const x = [], d = [];
  (json.cells || []).forEach((c) => {
    const src = Array.isArray(c.source) ? c.source.join("") : String(c.source || "");
    if (c.cell_type === "markdown") {
      const m = /^#\s+(.+)$/m.exec(src);
      if (m && title === file) title = m[1].trim();
      x.push(src.replace(/[#*_`>\[\]()]/g, " "));
    } else if (c.cell_type === "code") d.push(src);
  });
  return { u: nb.view, t: title, h: "", c: (course ? course + " › " : "") + "Notebook", y: "notebook", k: course,
    x: squash(x.join(" ")).slice(0, 6000), d: squash(d.join("\n")).slice(0, 6000), i: true };
}

function pool(items, worker, onProgress) {
  let next = 0, done = 0;
  const results = new Array(items.length);
  return new Promise((resolve) => {
    if (!items.length) return resolve(results);
    const run = () => {
      if (next >= items.length) return;
      const k = next++;
      worker(items[k]).then((r) => { results[k] = r; }, () => { results[k] = null; }).then(() => {
        done++;
        onProgress(done, items.length);
        if (done === items.length) resolve(results); else run();
      });
    };
    for (let c = 0; c < Math.min(CONCURRENCY, items.length); c++) run();
  });
}

const getText = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
const getJSON = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });

/* ---------- Index ---------- */

function buildIndex(docs) {
  const post = new Map(), lens = new Array(docs.length);
  let total = 0;
  docs.forEach((d, id) => {
    const w = new Map();
    const add = (tokens, weight, mask) => tokens.forEach((t) => {
      let e = w.get(t);
      if (!e) { e = [0, 0]; w.set(t, e); }
      e[0] += weight; e[1] |= mask;
    });
    if (d.i) add(tokenize(d.t), 3, 0);
    add(tokenize(d.h), 2, 0);
    const body = tokenize(d.x), code = tokenize(d.d, true);
    add(body, 1, 0);
    add(code, 0.7, 1);
    lens[id] = body.length + code.length + 1;
    total += lens[id];
    w.forEach((e, t) => {
      let list = post.get(t);
      if (!list) { list = []; post.set(t, list); }
      list.push(id, e[0], e[1]);
    });
  });
  return { docs, post, lens, avg: total / Math.max(docs.length, 1), terms: Array.from(post.keys()) };
}

let indexPromise = null;

/** Build (once per page view) or restore the index. onProgress(done, total) reports page fetches. */
export function loadIndex(onProgress = () => {}) {
  if (indexPromise) return indexPromise;
  indexPromise = getText("/site/sitemap.xml").then((xml) => {
    const sig = hashString(xml);
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (cached && cached.sig === sig) return buildIndex(cached.docs);
    } catch (e) { /* no cache */ }
    const urls = Array.from(new DOMParser().parseFromString(xml, "application/xml").getElementsByTagName("loc"),
      (l) => new URL(l.textContent.trim()).pathname).filter((p) => p !== "/site/search/");
    const parser = new DOMParser();
    return pool(urls, (u) => getText(u).then((t) => extractPage(u, parser.parseFromString(t, "text/html"))), onProgress)
      .then((pages) => {
        const docs = [], nbs = [], seen = new Set();
        pages.forEach((p) => {
          if (!p) return;
          docs.push(...p.docs);
          p.notebooks.forEach((nb) => {
            if (!seen.has(nb.raw)) { seen.add(nb.raw); nbs.push({ nb, course: (p.docs[0] || {}).k || "" }); }
          });
        });
        return pool(nbs, (it) => getJSON(it.nb.raw).then((j) => extractNotebook(it.nb, j, it.course)), () => {})
          .then((nbDocs) => {
            nbDocs.forEach((d) => { if (d) docs.push(d); });
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ sig, docs })); } catch (e) { /* quota: skip cache */ }
            return buildIndex(docs);
          });
      });
  });
  indexPromise.catch(() => { indexPromise = null; });
  return indexPromise;
}

/* ---------- Query ---------- */

function parseQuery(q) {
  const f = { course: "", type: "", code: false, phrases: [] };
  let rest = q.replace(/"([^"]+)"/g, (_, p) => { f.phrases.push(p); return " " + p + " "; });
  rest = rest.replace(/\b(course|type):(\S+)/gi, (_, k, v) => { f[k.toLowerCase()] = v.toLowerCase(); return " "; })
    .replace(/\bin:code\b/gi, () => { f.code = true; return " "; });
  let terms = tokenize(rest, false);
  if (!terms.length) terms = tokenize(rest, true);
  f.terms = Array.from(new Set(terms));
  f.prefix = /[\p{L}\p{N}_]$/u.test(q) && !/"$/.test(q.trim()) ? terms[terms.length - 1] : null;
  return f;
}

/** BM25 over sections. All terms must match (falls back to partial matches); the last term is a prefix. */
export function search(idx, q) {
  const p = parseQuery(q), N = idx.docs.length, k1 = 1.2, b = 0.75;
  if (!p.terms.length) return { results: [], partial: false, terms: [] };
  const scores = new Map(), hits = new Map(), codeHit = new Set();
  p.terms.forEach((t) => {
    const lists = [];
    if (idx.post.has(t)) lists.push([idx.post.get(t), 1]);
    if (t === p.prefix && t.length >= 2) {
      let n = 0;
      for (let i = 0; i < idx.terms.length && n < 30; i++) {
        const k = idx.terms[i];
        if (k !== t && k.startsWith(t)) { lists.push([idx.post.get(k), 0.8]); n++; }
      }
    }
    const best = new Map();
    lists.forEach(([list, f]) => {
      const df = list.length / 3;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      for (let j = 0; j < list.length; j += 3) {
        const id = list[j], w = list[j + 1];
        const s = f * idf * (w * (k1 + 1)) / (w + k1 * (1 - b + b * idx.lens[id] / idx.avg));
        if (!best.has(id) || best.get(id) < s) best.set(id, s);
        if (list[j + 2] & 1) codeHit.add(id);
      }
    });
    best.forEach((s, id) => { scores.set(id, (scores.get(id) || 0) + s); hits.set(id, (hits.get(id) || 0) + 1); });
  });
  const all = [];
  scores.forEach((s, id) => {
    const d = idx.docs[id];
    if (p.course && d.k.toLowerCase() !== p.course) return;
    if (p.type && d.y !== p.type) return;
    if (p.code && !codeHit.has(id)) return;
    if (p.phrases.length) {
      const hay = (d.t + " " + d.h + " " + d.x + " " + d.d).toLowerCase().replace(/\s+/g, " ");
      if (!p.phrases.every((ph) => hay.includes(ph.toLowerCase().replace(/\s+/g, " ")))) return;
    }
    all.push({ id, score: s, hits: hits.get(id) });
  });
  const strict = all.filter((r) => r.hits === p.terms.length);
  const partial = !strict.length && all.length > 0;
  const list = (strict.length ? strict : all).sort((a, c) => c.score - a.score).slice(0, 20);
  return { results: list.map((r) => idx.docs[r.id]), partial, terms: p.terms };
}
