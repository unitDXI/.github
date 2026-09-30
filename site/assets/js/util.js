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

/** Create an element with attributes and optional text content. */
export function el(tag, attrs, text) {
  const n = document.createElement(tag);
  for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
