/* Unit 511 — enhance every <pre><code class="language-…">: highlight it, make it keyboard-scrollable,
   and give it a caption with the language, optional file name (pre[data-title]) and a Copy button. */
import { el } from "./util.js";
import { LANG_LABELS, highlight, resolveLang } from "./highlight.js";

export function initCodeBlocks() {
  document.querySelectorAll("pre > code").forEach((code) => {
    const pre = code.parentElement;
    const cls = /(?:^|\s)language-([\w+-]+)/.exec(code.className);
    const lang = resolveLang(cls && cls[1]);
    highlight(code, lang);
    if (!pre.hasAttribute("tabindex")) pre.setAttribute("tabindex", "0");

    let fig = pre.parentElement.classList.contains("code") ? pre.parentElement : null;
    if (!fig) {
      fig = el("figure", { class: "code" });
      pre.parentNode.insertBefore(fig, pre);
      fig.appendChild(pre);
    }
    let cap = fig.querySelector("figcaption");
    if (!cap) { cap = el("figcaption"); fig.insertBefore(cap, pre); }
    const file = pre.getAttribute("data-title");
    if (file && !cap.querySelector(".code__file")) cap.insertBefore(el("span", { class: "code__file" }, file), cap.firstChild);
    if (!cap.querySelector(".code__lang")) cap.insertBefore(el("span", { class: "code__lang" }, LANG_LABELS[lang] || lang), cap.firstChild);
    cap.appendChild(el("button", { class: "code__copy", type: "button", "data-copy": "" }, "Copy"));
  });
}
