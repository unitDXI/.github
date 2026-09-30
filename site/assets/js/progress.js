/* Unit 511 — session progress. Lessons a reader finishes are remembered for this browser session
   only (sessionStorage: nothing leaves the device, no account, gone when the tab closes).
   - Lesson pages: a "Your progress" block with a Mark complete button and the course's progress bar.
     Scrolling to the end of the lesson marks it complete.
   - Course pages: a progress bar, check marks in the syllabus, and a Reset button.
   - Sidebar: check marks on completed lessons and "n/m" on started courses.
   - Course cards (home, curriculum): a small bar once a course is started.
   To keep progress across visits instead, change STORE to "localStorage". */
import { announce, el, store } from "./util.js";
import { allCourses, loadCurriculum } from "./curriculum.js";

const STORE = "sessionStorage";
const KEY = "u511:progress";
const CHANGED = "u511:progress";

function read() {
  try {
    const p = JSON.parse(store(STORE, KEY) || "{}");
    return p && typeof p === "object" ? p : {};
  } catch (e) {
    return {};
  }
}

function write(p) {
  store(STORE, KEY, JSON.stringify(p));
  document.dispatchEvent(new CustomEvent(CHANGED));
}

const isDone = (code, slug) => (read()[code] || []).includes(slug);

function setDone(code, slug, done) {
  const p = read();
  const set = new Set(p[code] || []);
  if (done) set.add(slug); else set.delete(slug);
  if (set.size) p[code] = [...set]; else delete p[code];
  write(p);
}

/** Completed lessons in a course, counting only lessons that exist in the curriculum. */
function completed(course) {
  const done = read()[course.code] || [];
  return course.lessons.filter((l) => done.includes(l.slug)).length;
}

const lastSegment = (href) => new URL(href, location.href).pathname.split("/").filter(Boolean).pop() || "";

function bar(done, total, label, small) {
  const wrap = el("div", { class: "progress" + (small ? " progress--small" : "") });
  const p = el("progress", { max: String(total), value: String(done), "aria-label": label });
  p.textContent = done + " of " + total;
  wrap.append(p, el("span", { class: "progress__text" }, done + " of " + total + (small ? "" : " lessons completed")));
  return wrap;
}

function check(label) {
  const s = el("span", { class: "progress-check" });
  s.append(el("span", { "aria-hidden": "true" }, "✓"), el("span", { class: "visually-hidden" }, label));
  return s;
}

/* ---------- Lesson page ---------- */

function initLesson(course, slug) {
  const pager = document.querySelector(".pager");
  if (!pager) return;
  const box = el("section", { class: "lesson-progress", "aria-labelledby": "lesson-progress-title" });
  const button = el("button", { type: "button", class: "button button--secondary" });
  const meter = el("div");
  box.append(el("h2", { class: "lesson-progress__title", id: "lesson-progress-title" }, "Your progress"),
    button, meter, el("p", { class: "meta" }, "Saved for this browser session only."));
  pager.parentNode.insertBefore(box, pager);

  const render = () => {
    const done = isDone(course.code, slug);
    button.textContent = done ? "✓ Completed. Mark as not done" : "Mark lesson complete";
    box.classList.toggle("is-done", done);
    meter.replaceChildren(bar(completed(course), course.lessons.length, "Progress in " + course.code));
  };
  button.addEventListener("click", () => {
    const done = !isDone(course.code, slug);
    setDone(course.code, slug, done);
    announce(done ? "Lesson marked complete" : "Lesson marked as not done");
  });

  // Reaching the end of the lesson (its previous/next links) marks it complete, once per page view.
  if ("IntersectionObserver" in window && !isDone(course.code, slug)) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (!isDone(course.code, slug)) {
        setDone(course.code, slug, true);
        announce("Lesson marked complete");
      }
    }, { threshold: 0.6 });
    io.observe(pager);
  }
  document.addEventListener(CHANGED, render);
  render();
}

/* ---------- Course page ---------- */

function initCourse(course) {
  const header = document.querySelector(".page-header");
  if (!header) return;
  const box = el("div", { class: "course-progress" });
  const reset = el("button", { type: "button", class: "button button--small button--secondary" }, "Reset progress");
  reset.addEventListener("click", () => {
    const p = read();
    delete p[course.code];
    write(p);
    announce("Progress reset for " + course.code);
  });
  header.appendChild(box);

  const render = () => {
    const n = completed(course);
    box.replaceChildren(el("p", { class: "course-progress__label" }, "Your progress this session"),
      bar(n, course.lessons.length, "Your progress in " + course.code));
    if (n) box.appendChild(reset);
    document.querySelectorAll(".syllabus li").forEach((li) => {
      li.querySelector(".progress-check")?.remove();
      const a = li.querySelector(".syllabus__title a");
      const done = !!a && isDone(course.code, lastSegment(a.href));
      li.classList.toggle("is-done", done);
      if (done) li.querySelector(".syllabus__title").appendChild(check("Completed"));
    });
  };
  document.addEventListener(CHANGED, render);
  render();
}

/* ---------- Sidebar and course cards ---------- */

function decorateSidebar(courses) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const current = sidebar.getAttribute("data-course") || "";
  sidebar.querySelectorAll(".progress-check, .sb-progress").forEach((n) => n.remove());
  sidebar.querySelectorAll(".sb-lesson").forEach((a) => {
    if (current && isDone(current, lastSegment(a.href))) a.appendChild(check("(completed)"));
  });
  sidebar.querySelectorAll("a.sb-link").forEach((a) => {
    const course = courses.get(lastSegment(a.href));
    const n = course ? completed(course) : 0;
    if (n) a.appendChild(el("span", { class: "sb-progress", title: n + " of " + course.lessons.length + " lessons completed" },
      n + "/" + course.lessons.length));
  });
}

function decorateCards(courses) {
  document.querySelectorAll(".course-card").forEach((card) => {
    card.querySelector(".progress")?.remove();
    const a = card.querySelector(".course-card__title a");
    const course = a && courses.get(lastSegment(a.href));
    const n = course ? completed(course) : 0;
    if (n) card.appendChild(bar(n, course.lessons.length, "Your progress in " + course.code, true));
  });
}

export function initProgress() {
  loadCurriculum().then((data) => {
    const courses = new Map(allCourses(data).map((c) => [c.code, c]));
    const sidebar = document.getElementById("sidebar");
    const code = sidebar && sidebar.getAttribute("data-course");
    const lesson = sidebar && sidebar.getAttribute("data-lesson");
    const type = document.body.getAttribute("data-page-type");
    const course = code && courses.get(code);
    if (course && type === "lesson" && lesson) initLesson(course, lesson);
    if (course && type === "course") initCourse(course);

    const refresh = () => { decorateSidebar(courses); decorateCards(courses); };
    document.addEventListener(CHANGED, refresh);
    document.addEventListener("u511:sidebar-rendered", () => decorateSidebar(courses));
    refresh();
  }).catch(() => { /* no curriculum, no progress UI */ });
}
