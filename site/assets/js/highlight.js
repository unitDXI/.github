/* Unit 511 — a small syntax highlighter (no third-party code).
   Each language is a list of [token class, regex source] rules tried left to right; "w" rules are
   words that become keywords (k), built-ins (b) or function calls (f). Token colours live in code.css. */
import { el } from "./util.js";

export const LANG_LABELS = {
  python: "Python", javascript: "JavaScript", json: "JSON", bash: "Shell", yaml: "YAML",
  powershell: "PowerShell", sql: "SQL", java: "Java", r: "R", c: "C", cpp: "C++",
  html: "HTML", css: "CSS", text: "Text", output: "Output",
};

export const LANG_ALIASES = {
  py: "python", js: "javascript", sh: "bash", shell: "bash", console: "bash", yml: "yaml",
  ps1: "powershell", pwsh: "powershell", "c++": "cpp", cxx: "cpp", h: "c", hpp: "cpp", xml: "html",
};

const DQ = '"(?:\\\\.|[^"\\\\\\n])*"';
const SQ = "'(?:\\\\.|[^'\\\\\\n])*'";
const NUM = "\\b(?:0[xX][0-9a-fA-F_]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)[fFlLuU]*\\b";
const WORD = "\\b[A-Za-z_$][\\w$]*\\b";
const C_COMMENT = "//[^\\n]*|/\\*[\\s\\S]*?\\*/";

const C_KW = "auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL";
const CPP_KW = C_KW + " alignas alignof and auto catch class constexpr consteval decltype delete explicit export final friend mutable namespace new noexcept not nullptr operator or override private protected public requires static_assert template this throw try typename using virtual co_await co_return co_yield concept";

const LANGS = {
  python: {
    rules: [["c", "#[^\\n]*"], ["s", "(?:[rRbBuUfF]{1,2})?(?:\"\"\"[\\s\\S]*?\"\"\"|'''[\\s\\S]*?'''|" + DQ + "|" + SQ + ")"], ["d", "@[\\w.]+"], ["n", NUM], ["w", WORD]],
    kw: "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda match case nonlocal not or pass raise return try while with yield",
    bi: "abs all any bool dict enumerate filter float format input int isinstance iter len list map max min next open print range repr reversed round set sorted str sum super tuple type zip",
  },
  javascript: {
    rules: [["c", C_COMMENT], ["s", "`(?:\\\\.|[^`\\\\])*`|" + DQ + "|" + SQ], ["n", NUM], ["w", WORD]],
    kw: "async await break case catch class const continue default delete do else export extends false finally for function if import in instanceof let new null of return super switch this throw true try typeof undefined var void while yield",
    bi: "Array JSON Map Math Number Object Promise Set String console document fetch window",
  },
  json: { rules: [["p", DQ + "(?=\\s*:)"], ["s", DQ], ["n", "-?" + NUM], ["k", "\\b(?:true|false|null)\\b"]] },
  yaml: { rules: [["c", "#[^\\n]*"], ["p", "^[ \\t]*(?:- )?[\\w.\\-]+(?=\\s*:(?:\\s|$))"], ["s", DQ + "|" + SQ], ["n", NUM], ["k", "\\b(?:true|false|null)\\b"]] },
  bash: {
    rules: [["c", "(?:^|(?<=\\s))#[^\\n]*"], ["s", DQ + "|" + SQ], ["v", "\\$\\{?\\w+\\}?"], ["n", NUM], ["w", WORD]],
    kw: "case do done elif else esac export fi for function if in local return then while",
    bi: "cat cd cp curl echo git grep ls mkdir mv pip py python python3 rm source",
  },
  powershell: {
    rules: [["c", "#[^\\n]*"], ["s", DQ + "|" + SQ], ["v", "\\$[\\w:]+"], ["f", "\\b[A-Z][a-z]+-[A-Z]\\w*\\b"], ["n", NUM], ["w", WORD]],
    kw: "foreach function if else elseif param return switch try catch finally while in",
  },
  sql: {
    rules: [["c", "--[^\\n]*|/\\*[\\s\\S]*?\\*/"], ["s", SQ], ["p", DQ], ["n", NUM], ["w", WORD]],
    caseInsensitive: true,
    kw: "SELECT FROM WHERE AND OR NOT IN IS NULL LIKE BETWEEN AS JOIN INNER LEFT RIGHT FULL OUTER CROSS ON USING GROUP BY ORDER ASC DESC HAVING LIMIT OFFSET DISTINCT UNION ALL INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE VIEW INDEX DROP ALTER ADD PRIMARY KEY FOREIGN REFERENCES CONSTRAINT UNIQUE DEFAULT CHECK CASE WHEN THEN ELSE END WITH EXISTS TRUE FALSE INTEGER INT TEXT VARCHAR REAL NUMERIC DATE BOOLEAN",
    bi: "COUNT SUM AVG MIN MAX COALESCE ROUND LOWER UPPER LENGTH SUBSTR CAST NOW",
  },
  java: {
    rules: [["c", C_COMMENT], ["s", "\"\"\"[\\s\\S]*?\"\"\"|" + DQ + "|" + SQ], ["d", "@\\w+"], ["n", NUM], ["w", WORD]],
    kw: "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public record return short static super switch synchronized this throw throws try var void volatile while true false null",
    bi: "String System Math List ArrayList Map HashMap Integer Object",
  },
  c: {
    rules: [["c", C_COMMENT], ["d", "^[ \\t]*#[ \\t]*\\w+[^\\n]*"], ["s", DQ + "|" + SQ], ["n", NUM], ["w", WORD]],
    kw: C_KW,
    bi: "printf scanf malloc calloc free strlen strcpy memcpy size_t FILE fopen fclose",
  },
  cpp: {
    rules: [["c", C_COMMENT], ["d", "^[ \\t]*#[ \\t]*\\w+[^\\n]*"], ["s", "R\"\\((?:[\\s\\S]*?)\\)\"|" + DQ + "|" + SQ], ["n", NUM], ["w", WORD]],
    kw: CPP_KW,
    bi: "std cout cin endl string vector map unique_ptr shared_ptr make_unique size_t",
  },
  r: {
    rules: [["c", "#[^\\n]*"], ["s", DQ + "|" + SQ], ["n", NUM + "L?"], ["w", "\\b[A-Za-z.][\\w.]*\\b"]],
    kw: "if else repeat while function for in next break TRUE FALSE NULL Inf NaN NA",
    bi: "c print library data.frame length sum mean median sd vector list matrix paste cat seq rep nrow ncol head summary",
  },
  html: {
    rules: [["c", "<!--[\\s\\S]*?-->"], ["k", "</?[A-Za-z][\\w-]*|/?>"], ["p", "(?<=\\s)[A-Za-z_:][\\w:.-]*(?==)"], ["s", DQ + "|" + SQ]],
  },
  css: {
    rules: [["c", "/\\*[\\s\\S]*?\\*/"], ["d", "@[\\w-]+"], ["p", "^[ \\t]*-{0,2}[\\w-]+(?=\\s*:[^;{}]*;)"], ["s", DQ + "|" + SQ], ["n", "#[0-9a-fA-F]{3,8}\\b|-?\\b\\d+(?:\\.\\d+)?(?:px|r?em|%|vh|vw|s|ms|deg|fr|ch)?\\b"]],
  },
};

const compiled = {};

function compile(lang) {
  if (compiled[lang]) return compiled[lang];
  const def = LANGS[lang];
  if (!def) return null;
  const words = (s) => new Set((s || "").split(" ").map((w) => (def.caseInsensitive ? w.toUpperCase() : w)));
  compiled[lang] = {
    names: def.rules.map((r) => r[0]),
    rx: new RegExp(def.rules.map((r) => "(" + r[1] + ")").join("|"), "gm"),
    kw: words(def.kw),
    bi: words(def.bi),
    ci: !!def.caseInsensitive,
  };
  return compiled[lang];
}

/** Resolve a language- class name (or alias) to a highlighter key. */
export function resolveLang(name) {
  return LANG_ALIASES[name] || name || "text";
}

/** Replace the text of a <code> element with highlighted spans. Unknown languages are left as-is. */
export function highlight(code, lang) {
  const c = compile(lang);
  if (!c) return;
  const src = code.textContent;
  const frag = document.createDocumentFragment();
  let pos = 0;
  let m;
  c.rx.lastIndex = 0;
  while ((m = c.rx.exec(src))) {
    if (!m[0]) { c.rx.lastIndex++; continue; }
    if (m.index > pos) frag.appendChild(document.createTextNode(src.slice(pos, m.index)));
    let kind = null;
    for (let i = 1; i < m.length; i++) if (m[i] !== undefined) { kind = c.names[i - 1]; break; }
    if (kind === "w") {
      const w = c.ci ? m[0].toUpperCase() : m[0];
      kind = c.kw.has(w) ? "k" : c.bi.has(w) ? "b" : /^\s*\(/.test(src.slice(c.rx.lastIndex, c.rx.lastIndex + 8)) ? "f" : null;
    }
    frag.appendChild(kind ? el("span", { class: "tok-" + kind }, m[0]) : document.createTextNode(m[0]));
    pos = c.rx.lastIndex;
  }
  frag.appendChild(document.createTextNode(src.slice(pos)));
  code.textContent = "";
  code.appendChild(frag);
}
