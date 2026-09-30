/* Unit 511 — light/dark theme toggle.
   The inline script in every page's <head> sets data-theme before first paint; this adds the button. */
import { store } from "./util.js";

export function initTheme() {
  const root = document.documentElement;
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  const sync = () => btn.setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark"));
  btn.hidden = false;
  sync();
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store("localStorage", "theme", next);
    sync();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!store("localStorage", "theme")) {
      root.setAttribute("data-theme", e.matches ? "dark" : "light");
      sync();
    }
  });
}
