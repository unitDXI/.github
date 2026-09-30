/* Unit 511 — curriculum sidebar, drawn from /curriculum.json.
   Tracks render in file order (language tracks first, then AI Engineering). A track may hold
   stages of courses, a flat list of courses, or a flat list of lessons (at track.path + slug + "/").
   Planned tracks show as "Soon". Without JavaScript the static fallback link in the page stays. */
import { el, store } from "./util.js";

const SCROLL_KEY = "u511:sidebar-scroll";

function trackLabel(t) {
  const frag = document.createDocumentFragment();
  if (t.icon) frag.appendChild(el("img", { class: "sb-icon", src: t.icon, alt: "", width: "18", height: "18" }));
  frag.appendChild(el("span", { class: "sb-track__title" }, t.title));
  return frag;
}

function renderLessons(lessons, base, lesson, path) {
  const ol = el("ol", { class: "sb-lessons" });
  lessons.forEach((l, i) => {
    if (l.status !== "published") return;
    const href = base + l.slug + "/";
    const a = el("a", { class: "sb-lesson", href });
    a.appendChild(el("span", { class: "sb-num" }, String(i + 1).padStart(2, "0")));
    a.appendChild(document.createTextNode(l.title));
    if (l.slug === lesson || path === href) a.setAttribute("aria-current", "page");
    const li = el("li");
    li.appendChild(a);
    ol.appendChild(li);
  });
  return ol;
}

function renderCourses(list, course, lesson, path) {
  const ul = el("ul", { class: "sb-courses" });
  list.forEach((c) => {
    const li = el("li", { class: "sb-course" });
    if (c.status !== "published") {
      li.classList.add("is-planned");
      const span = el("span", { class: "sb-link" });
      span.appendChild(el("span", { class: "sb-code" }, c.code));
      span.appendChild(document.createTextNode(c.title + " "));
      span.appendChild(el("span", { class: "badge badge--muted" }, "Soon"));
      li.appendChild(span);
    } else {
      const href = "/curriculum/" + c.code + "/";
      const a = el("a", { class: "sb-link", href });
      a.appendChild(el("span", { class: "sb-code" }, c.code));
      a.appendChild(document.createTextNode(c.title));
      if (path === href) a.setAttribute("aria-current", "page");
      li.appendChild(a);
      if (c.code === course) {
        li.classList.add("is-active");
        li.appendChild(renderLessons(c.lessons, href, lesson, path));
      }
    }
    ul.appendChild(li);
  });
  return ul;
}

function renderStage(q, course, lesson, path) {
  const det = el("details", { class: "sb-stage" });
  const hasCourse = q.courses.some((c) => c.code === course);
  const hasPublished = q.courses.some((c) => c.status === "published");
  if (hasCourse || (!course && hasPublished)) det.open = true;
  det.appendChild(el("summary", null, q.title));
  det.appendChild(renderCourses(q.courses, course, lesson, path));
  return det;
}

function render(sidebar, data) {
  const mount = sidebar.querySelector("[data-sidebar-curriculum]");
  if (!mount) return;
  const course = sidebar.getAttribute("data-course") || "";
  const lesson = sidebar.getAttribute("data-lesson") || "";
  const trackId = sidebar.getAttribute("data-track") || "";
  const path = location.pathname;
  const frag = document.createDocumentFragment();

  (data.tracks || []).forEach((t) => {
    if (t.status !== "published") {
      const p = el("p", { class: "sb-track is-planned" });
      const a = el("a", { href: "/curriculum/#" + t.id });
      a.appendChild(trackLabel(t));
      a.appendChild(el("span", { class: "badge badge--muted" }, "Soon"));
      p.appendChild(a);
      frag.appendChild(p);
      return;
    }
    const courses = (t.courses || []).concat(...(t.stages || []).map((q) => q.courses));
    const here = trackId === t.id || courses.some((c) => c.code === course) || (t.path && path.startsWith(t.path));
    const det = el("details", { class: "sb-track" });
    if (here || (!course && !trackId)) det.open = true;
    const summary = el("summary");
    summary.appendChild(trackLabel(t));
    det.appendChild(summary);
    if (t.stages) t.stages.forEach((q) => det.appendChild(renderStage(q, course, lesson, path)));
    else if (t.courses) det.appendChild(renderCourses(t.courses, course, lesson, path));
    else if (t.lessons) det.appendChild(renderLessons(t.lessons, t.path, lesson, path));
    frag.appendChild(det);
  });

  mount.textContent = "";
  mount.appendChild(frag);

  const saved = parseInt(store("sessionStorage", SCROLL_KEY) || "", 10);
  if (!isNaN(saved)) sidebar.scrollTop = saved;
  const current = mount.querySelector("[aria-current='page']");
  if (current) {
    const r = current.getBoundingClientRect();
    const s = sidebar.getBoundingClientRect();
    if (r.top < s.top || r.bottom > s.bottom) sidebar.scrollTop += r.top - s.top - s.height / 3;
  }
}

export function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  fetch("/curriculum.json")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => render(sidebar, data))
    .catch(() => { /* the static fallback link stays */ });
  let t;
  sidebar.addEventListener("scroll", () => {
    clearTimeout(t);
    t = setTimeout(() => store("sessionStorage", SCROLL_KEY, String(sidebar.scrollTop)), 150);
  }, { passive: true });
}
