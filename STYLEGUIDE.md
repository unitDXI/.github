# Unit 511 style guide

How we write, format code and style the site. For mechanics (templates, building blocks, publishing checklist) see [CONTRIBUTING.md](CONTRIBUTING.md).

## Voice and tone

- **Talk to one learner.** Use “you”, and “we” for the unit. Write as a patient, experienced colleague: never condescending, never hyped.
- **Plain words first.** Define a term the first time it appears, in bold, then use it consistently. Prefer “use” to “utilise” and “about” to “approximately”.
- **Short paragraphs, one idea each.** Lead with the point, then the detail.
- **Show, then explain.** Put a small runnable example right after each new idea.
- **Be honest about limits.** Say when something is simplified (“real tokenizers also…”) and when a fact may go out of date.
- **No marketing language.** Avoid words like “revolutionary”, “magic”, “game-changing” and “simply”.

## Accuracy

- Link **primary sources**: papers, official docs and specifications. Use blogs and videos only as extra reading.
- Anything likely to change, such as model names, context sizes, prices and API limits, gets an “as of *Month Year*” note and a source link. Better still, teach the reader how to look it up.
- Numbers in running text must come from code you ran or from a cited source.

## Vendor neutrality and scope

- Examples must run for **free** on public tools, with no paid API keys. Hosted services can appear only as optional asides.
- When you name a product or model, name at least one alternative.
- Never describe Fairytale.ai internal systems, tools, APIs or plans.

## Terminology

| Use | Not |
|:--|:--|
| language model, model | “the AI”, “the brain” |
| open-weight model (weights published) | “open-source model”, unless code, data and licence all qualify |
| token, tokenizer | word (when you mean token) |
| embedding, embedding vector | encoding (ambiguous) |
| inference | “running the AI” |
| artifact | project, deliverable |
| licence (noun), license (verb) | Pick British or US spelling per page and stay consistent. Course pages use British spelling. |

Course codes are written with a hyphen: **511-101**.

## Code conventions

- **Python 3.10+**, formatted like `black` would format it (4 spaces, double quotes, 88-character lines). Type hints are welcome but optional in early lessons.
- **JavaScript**: modern syntax (`const`/`let`, arrow functions where natural). Try-it examples print with `console.log`.
- Keep examples **short and complete**: a reader should be able to copy one block and run it. When a block continues an earlier one, say so in its `data-title` (“bpe.py (continued)”).
- Show the **real output** under the code in a `language-output` block.
- Name things for what they are: `embeddings`, `most_similar`, not `data2`, `fn`.
- Pin third-party versions in the course’s `requirements.txt`.

## Accessibility

- One `h1` per page, and headings in order.
- Link text that makes sense on its own. Never “click here”.
- `alt` text for meaningful images; `alt=""` for decorative ones.
- Never rely on colour alone. Callouts always carry a text label.
- Tables have a `<caption>` and `scope` on header cells.
- Explain every formula in words next to it.

## Design tokens and contrast

The interface follows the **Fairytale.ai Wishlist design system**: an Ocean Blue primary (`#0066CC`), a Sunset Orange call to action, a faint sea-mist page (`#F8FAFC`) with white cards, 12–16px rounded corners, soft shadows that lift on hover, an ocean-gradient logo tile and hero, wave motifs, and small uppercase section labels. Inter is used when installed; otherwise the system UI font (the site loads no web fonts).

Colours are defined once, as tokens in `site/assets/css/tokens.css`, with separate light and dark values. Components use the semantic tokens (`--text`, `--link`, `--card`, `--cta`, …), not raw hex values. There is no green anywhere.

Rules that keep it consistent:

- **One orange call to action per view** (`.button--cta`), such as *Join a cohort* in the header or *Start learning* in the hero. Everything else is blue (`.button`), an outline (`.button--secondary`) or, on ocean banners, glass (`.button--glass`).
- The bright Sunset Orange (`#FF6B35`) is **decorative only** (the hero underline and the eyebrow dot). With white text it is 2.8:1, so buttons use the deeper `--cta` (`#C23B0A`).
- Text on ocean surfaces (hero, cohort cards) is always solid white. Semi-transparent white fails contrast at the lighter end of the gradient.

Checked contrast ratios (WCAG 2.1 AA needs 4.5:1 for body text and 3:1 for large text and UI):

| Pair | Light | Dark |
|:--|:--|:--|
| `--text` on `--bg` / `--card` | 14.0:1 / 14.7:1 | 16.5:1 / 15.4:1 |
| `--text-muted` on `--bg` / `--bg-2` | 5.7:1 / 5.4:1 | 7.3:1 / 6.7:1 |
| `--link` on `--bg` / `--card` / `--bg-accent` | 5.3:1 / 5.6:1 / 4.8:1 | 7.8:1 / 7.3:1 / 6.5:1 |
| `--active-text` on `--bg-accent` (active nav, badges) | 6.3:1 | 8.2:1 |
| white on `--primary` (buttons) | 5.6:1 | 5.0:1 |
| white on `--cta` (orange buttons) | 5.4:1 | 5.4:1 |
| white on the ocean gradient (lightest end) | 5.6:1 | 6.2:1 |
| white on a glass button over the ocean gradient | 5.0:1 | 5.5:1 |
| `--caution` on `--card` / on `--caution-bg` | 5.0:1 / 4.7:1 | 8.3:1 / 7.9:1 |
| `--danger` on `--card` / on `--danger-bg` | 6.5:1 / 5.9:1 | 7.3:1 / 7.5:1 |
| code token colours on `--code-bg` | ≥ 5.4:1 | ≥ 6.7:1 |

Orange buttons on ocean banners get a faint white ring, because the orange and blue backgrounds are too close in brightness for the button's edge to show on its own.

If you change a token, recompute its ratios and update this table.
