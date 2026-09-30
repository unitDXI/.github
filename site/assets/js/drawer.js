/* Unit 511 — on small screens the sidebar becomes a drawer opened by the header's Menu button.
   Esc and the backdrop close it; focus is trapped while open and returned to the button. */

export function initDrawer() {
  const sidebar = document.getElementById("sidebar");
  const button = document.querySelector("[data-drawer-toggle]");
  const backdrop = document.querySelector("[data-drawer-backdrop]");
  if (!sidebar || !button || !backdrop) return;

  const isOpen = () => sidebar.classList.contains("is-open");
  const focusables = () =>
    Array.from(sidebar.querySelectorAll("a[href], summary, button")).filter((n) => n.offsetParent !== null);

  function open() {
    sidebar.classList.add("is-open");
    backdrop.hidden = false;
    document.body.classList.add("drawer-open");
    button.setAttribute("aria-expanded", "true");
    const target = sidebar.querySelector("[aria-current='page']") || focusables()[0];
    if (target) target.focus();
  }

  function close(returnFocus) {
    if (!isOpen()) return;
    sidebar.classList.remove("is-open");
    backdrop.hidden = true;
    document.body.classList.remove("drawer-open");
    button.setAttribute("aria-expanded", "false");
    if (returnFocus) button.focus();
  }

  button.hidden = false;
  button.addEventListener("click", () => (isOpen() ? close(true) : open()));
  backdrop.addEventListener("click", () => close(true));
  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") { e.preventDefault(); close(true); return; }
    if (e.key !== "Tab") return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  matchMedia("(max-width: 767px)").addEventListener("change", (e) => { if (!e.matches) close(false); });
}
