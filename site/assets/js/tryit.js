/* Unit 511 — "Try it" JavaScript sandbox.
   Turns <div class="tryit" data-tryit="js"><pre><code>…</code></pre></div> into an editor.
   Code runs in site/assets/tryit/runner.html inside <iframe sandbox="allow-scripts"> (an opaque
   origin: no cookies, storage, or access to this page). Messages from the runner are accepted
   only from that iframe's window and only with the nonce for the current run.
   main.js loads this module only on pages that contain a sandbox. */

const RUNNER = new URL("../tryit/runner.html", import.meta.url).href;
const TIMEOUT_MS = 5000;

function button(label, extra) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "button button--small" + (extra ? " " + extra : "");
  b.textContent = label;
  return b;
}

export function initTryit() {
  document.querySelectorAll('[data-tryit="js"]').forEach(function (block, n) {
    var code = block.querySelector("pre code");
    if (!code) return;
    var original = code.textContent.replace(/\s+$/, "");
    var fig = code.closest(".code") || code.parentElement;
    var id = "tryit-" + (n + 1);

    var label = document.createElement("label");
    label.className = "tryit__label";
    label.htmlFor = id;
    label.textContent = "Edit the code, then run it (Ctrl+Enter)";
    var editor = document.createElement("textarea");
    editor.id = id;
    editor.className = "tryit__editor";
    editor.spellcheck = false;
    editor.setAttribute("autocapitalize", "off");
    editor.setAttribute("autocomplete", "off");
    editor.value = original;
    editor.rows = Math.min(Math.max(original.split("\n").length + 1, 4), 24);

    var bar = document.createElement("div");
    bar.className = "tryit__bar";
    var run = button("Run");
    var reset = button("Reset", "button--secondary");
    var show = button("Show original", "button--secondary");
    show.setAttribute("aria-expanded", "false");
    bar.appendChild(run);
    bar.appendChild(reset);
    bar.appendChild(show);

    var outLabel = document.createElement("p");
    outLabel.className = "tryit__out-label";
    outLabel.id = id + "-out-label";
    outLabel.textContent = "Output";
    var output = document.createElement("pre");
    output.className = "tryit__output";
    output.setAttribute("aria-live", "polite");
    output.setAttribute("aria-labelledby", outLabel.id);
    output.tabIndex = 0;

    var nojs = block.querySelector(".tryit__nojs");
    if (nojs) nojs.hidden = true;
    fig.hidden = true;
    fig.parentNode.insertBefore(label, fig);
    fig.parentNode.insertBefore(editor, fig);
    fig.parentNode.insertBefore(bar, fig);
    block.appendChild(outLabel);
    block.appendChild(output);

    var frame = null, nonce = null, watchdog = null;

    function line(text, level) {
      var div = document.createElement("div");
      if (level === "error") div.className = "is-error";
      if (level === "warn") div.className = "is-warn";
      div.textContent = text;
      output.appendChild(div);
    }
    function stop() {
      clearTimeout(watchdog);
      if (frame) frame.remove();
      frame = null;
      nonce = null;
    }
    window.addEventListener("message", function (e) {
      if (!frame || e.source !== frame.contentWindow) return;
      var d = e.data || {};
      if (d.type === "ready") {
        frame.contentWindow.postMessage({ type: "run", nonce: nonce, code: editor.value }, "*");
        return;
      }
      if (d.nonce !== nonce) return;
      if (d.type === "log") line(String((d.args || []).join(" ")), d.level);
      if (d.type === "done") {
        clearTimeout(watchdog);
        if (!output.childNodes.length) line("(no output: use console.log to print values)");
      }
    });

    function execute() {
      stop();
      output.textContent = "";
      nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
      frame = document.createElement("iframe");
      frame.className = "tryit__frame";
      frame.setAttribute("sandbox", "allow-scripts");
      frame.setAttribute("title", "Sandbox that runs example " + (n + 1));
      frame.setAttribute("tabindex", "-1");
      frame.src = RUNNER;
      block.appendChild(frame);
      watchdog = setTimeout(function () {
        line("Stopped: the code ran for more than " + TIMEOUT_MS / 1000 + " seconds.", "error");
        stop();
      }, TIMEOUT_MS);
    }

    run.addEventListener("click", execute);
    editor.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execute(); }
    });
    reset.addEventListener("click", function () {
      editor.value = original;
      stop();
      output.textContent = "";
      editor.focus();
    });
    show.addEventListener("click", function () {
      var open = fig.hidden;
      fig.hidden = !open;
      show.setAttribute("aria-expanded", String(open));
      show.textContent = open ? "Hide original" : "Show original";
    });
  });
}
