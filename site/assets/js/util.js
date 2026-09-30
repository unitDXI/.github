/* Unit 511 — small helpers shared by the other modules. */

const live = document.getElementById("live");

/** Announce a message to screen readers through the page's polite live region. */
export function announce(msg) {
  if (!live) return;
  live.textContent = "";
  setTimeout(() => { live.textContent = msg; }, 50);
}

/** Read (value omitted) or write localStorage/sessionStorage, ignoring blocked storage. */
export function store(kind, key, value) {
  try {
    const s = window[kind];
    if (value === undefined) return s.getItem(key);
    s.setItem(key, value);
  } catch (e) { /* storage unavailable (private mode, blocked): carry on without it */ }
  return null;
}

/* The site/ folder's address, worked out from this file's own URL (site/assets/js/util.js), so the
   site works wherever it is hosted: a GitHub project page (/.github/), a custom domain or a local server. */
export const SITE_URL = new URL("../../", import.meta.url);
export const ROOT_URL = new URL("../", SITE_URL);

/** A path relative to site/ (e.g. "curriculum/511-101/") as an absolute path for this host. */
export function sitePath(p) {
  const u = new URL(p, SITE_URL);
  return u.pathname + u.search + u.hash;
}

/** Create an element with attributes and optional text content. */
export function el(tag, attrs, text) {
  const n = document.createElement(tag);
  for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
