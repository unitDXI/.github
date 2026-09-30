/* Unit 511 — list filters that sync to the URL.
   Curriculum: <form data-filters> with stage/type/level selects filters [data-stage][data-type][data-level].
   Blog: [data-tag-filter] buttons filter .post-item[data-tags] by ?tag=. */

const KEYS = ["stage", "type", "level"];

export function initCourseFilters() {
  const form = document.querySelector("[data-filters]");
  if (!form) return;
  const items = document.querySelectorAll("[data-stage][data-type][data-level]");
  const count = form.querySelector("[data-filter-count]");
  const params = new URLSearchParams(location.search);
  KEYS.forEach((k) => {
    const s = form.elements[k];
    const v = params.get(k);
    if (s && v && s.querySelector('option[value="' + CSS.escape(v) + '"]')) s.value = v;
  });

  const apply = (push) => {
    let shown = 0, rows = 0;
    const q = new URLSearchParams();
    KEYS.forEach((k) => { if (form.elements[k].value) q.set(k, form.elements[k].value); });
    items.forEach((n) => {
      const ok = KEYS.every((k) => !form.elements[k].value || n.getAttribute("data-" + k) === form.elements[k].value);
      n.hidden = !ok;
      if (n.tagName === "TR") { rows++; if (ok) shown++; }
    });
    document.querySelectorAll(".stage").forEach((s) => { s.hidden = !s.querySelector(".course-card:not([hidden])"); });
    count.textContent = "Showing " + shown + " of " + rows + " courses";
    if (push) history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
  };

  form.hidden = false;
  form.addEventListener("change", () => apply(true));
  form.addEventListener("submit", (e) => e.preventDefault());
  apply(false);
}

export function initTagFilter() {
  const bar = document.querySelector("[data-tag-filter]");
  if (!bar) return;
  const posts = document.querySelectorAll(".post-item[data-tags]");
  const status = bar.querySelector("[data-tag-status]");

  const setTag = (tag, push) => {
    let n = 0;
    bar.querySelectorAll("[data-tag]").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-tag") === tag)));
    posts.forEach((p) => {
      const ok = !tag || p.getAttribute("data-tags").split(" ").includes(tag);
      p.hidden = !ok;
      if (ok) n++;
    });
    status.textContent = n + (n === 1 ? " post" : " posts") + (tag ? " tagged " + tag : "");
    if (push) history.replaceState(null, "", location.pathname + (tag ? "?tag=" + encodeURIComponent(tag) : ""));
  };

  bar.hidden = false;
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tag]");
    if (b) setTag(b.getAttribute("data-tag"), true);
  });
  setTag(new URLSearchParams(location.search).get("tag") || "", false);
}
