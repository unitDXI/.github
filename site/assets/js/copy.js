/* Unit 511 — copy to clipboard for code blocks ([data-copy]) and attribution text ([data-copy-target]).
   Without clipboard access (e.g. plain http), the text is selected so the reader can press Ctrl+C. */
import { announce } from "./util.js";

function copyText(text, btn) {
  const label = btn.textContent;
  const done = (ok) => {
    btn.textContent = ok ? "Copied!" : "Press Ctrl+C";
    announce(ok ? "Copied to clipboard" : "Copy failed. The text is selected; press Control C to copy.");
    setTimeout(() => { btn.textContent = label; }, 2000);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
  } else {
    done(false);
  }
}

function select(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export function initCopy() {
  document.querySelectorAll("[data-copy-target]").forEach((b) => { b.hidden = false; });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy], [data-copy-target]");
    if (!btn) return;
    const src = btn.hasAttribute("data-copy")
      ? btn.closest(".code").querySelector("code")
      : document.getElementById(btn.getAttribute("data-copy-target"));
    if (!src) return;
    copyText(src.textContent.replace(/\s+$/, "") + "\n", btn);
    if (!(navigator.clipboard && window.isSecureContext)) select(src);
  });
}
