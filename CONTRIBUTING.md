# Contributing to Unit 511

Thank you for helping. This guide covers how the site is put together and how to add or change lessons, courses and blog posts.

- **Small fixes** (typos, broken links, unclear sentences): use the *Edit this page on GitHub* link at the bottom of any page, or open a pull request directly.
- **New lessons or larger changes**: open a [discussion](https://github.com/orgs/unitDXI/discussions) first so we can agree the outline.
- **Conduct**: everyone follows the [Code of Conduct](https://unit511.fairytale.ai/site/code-of-conduct/).

## How the site works

The site is **plain, hand-written HTML, CSS and JavaScript**. There is no site generator, no Markdown pipeline, no npm and no build step. Every page is a real `.html` file. The home page is `index.html` at the repository root; every other page lives in `site/`. GitHub Pages serves the repository root exactly as it is committed (see `.github/workflows/pages.yml`, which only uploads files), so the home page is at the site root and everything else is under `site/`.

**All internal links and file paths are relative to the page’s own folder** (for example `../../assets/css/site.css`), never starting with `/`. That way the site works at any address: the GitHub project page (`https://unitdxi.github.io/.github/`), the custom domain, or a local server. Scripts work out the site’s address from their own file location (`sitePath()` in `site/assets/js/util.js`), and paths in `curriculum.json` are relative to `site/`. The one exception is `404.html`: GitHub Pages serves it for missing URLs at any depth, so it uses `<base href="/.github/">`. Change that to `/` once the site moves to its custom domain.

```
index.html                          Home page (repository root)
404.html                            "Page not found" (must be at the root for GitHub Pages)
robots.txt                          Crawler rules (must be at the root); points to site/sitemap.xml
site/
├── curriculum.json                 Tracks, courses and lessons (drives the sidebar; downloadable)
├── curriculum.csv                  Same, one row per track and course
├── sitemap.xml                     Every page. Search reads this to know what to index.
├── curriculum/
│   ├── index.html                  All courses (static table; filters added by JS)
│   └── 511-101/
│       ├── index.html              Course page
│       └── 02-tokens-and-embeddings/
│           └── index.html          Lesson page
├── blog/index.html, blog/feed.xml, blog/<date-slug>/index.html
├── about/ contribute/ resources/ code-of-conduct/ attribution/ search/
├── notebooks/<course>/<lesson>.ipynb and requirements.txt
└── assets/
    ├── css/
    │   ├── site.css                Entry point: @imports the partials below, in cascade order
    │   ├── tokens.css              Colours (light/dark), type, spacing
    │   ├── base.css                Reset, typography, helpers
    │   ├── header.css layout.css sidebar.css page.css buttons.css
    │   ├── code.css lesson.css tables.css cards.css home.css tryit.css search.css
    │   ├── responsive.css          Breakpoints (after the components)
    │   └── print.css
    ├── js/                         Native ES modules, no bundler
    │   ├── main.js                 Entry point: imports and starts every module
    │   ├── util.js                 announce(), store(), el()
    │   ├── theme.js                Light/dark toggle
    │   ├── sidebar.js              Curriculum sidebar from curriculum.json
    │   ├── drawer.js               Mobile drawer
    │   ├── highlight.js            Syntax highlighter (language rules)
    │   ├── code-blocks.js          Code captions, highlighting, Copy buttons
    │   ├── copy.js                 Clipboard handling
    │   ├── filters.js              Curriculum and blog tag filters
    │   ├── github-activity.js      Home page "From the repo" widget
    │   ├── search-index.js         Full-text index built in the browser from sitemap.xml
    │   ├── search-ui.js            Search dialog (Ctrl/Cmd+K) and /search/ page
    │   └── tryit.js                "Try it" sandbox (loaded only where needed)
    ├── tryit/runner.html           Sandboxed page that runs Try-it code
    └── img/                        logo-mark.svg, icons/ (track icons)
templates/lesson.html               Copy this to start a new lesson
```

### Tracks

The curriculum is split into **tracks**, listed in `curriculum.json` under `"tracks"` in the order they appear in the sidebar and on the curriculum page:

1. **Languages and tools** (all planned): HTML, CSS, JavaScript, SQL, Python, Java, R, C, C++ and Git. Each is its own track (`"id"`: `html`, `css`, `javascript`, `sql`, `python`, `java`, `r`, `c`, `cpp`, `git`).
2. **AI Engineering** (`"id": "ai"`): sixteen courses grouped into four `"stages"`. Its course pages live at `/curriculum/<code>/`.

A track may have an `"icon"` (a path relative to `site/`, such as `assets/img/icons/python.svg`). The sidebar shows it next to the track name.

The sidebar can draw three kinds of track:

- **Stages of courses**, like AI Engineering: `"stages": [{ "id", "title", "courses": [...] }]`.
- **A flat list of courses**: `"courses": [...]`.
- **A flat list of lessons**, W3Schools-style: `"path": "html/", "lessons": [{ "slug", "title", "status" }]`. Each lesson lives at `site/` + `path + slug + "/"`.

A track with `"status": "planned"` appears as *Soon*. Every page’s sidebar element says which track it belongs to (`data-track="ai"`), plus `data-course` and `data-lesson` where they apply, so the right track opens and the current page is highlighted.

Pages work without JavaScript. Scripts only add enhancements. The curriculum sidebar is the one exception: it is drawn from `curriculum.json`, and without JavaScript it falls back to a link to the course list.

### Preview locally

The scripts use ES modules and `fetch`, which browsers block for files opened directly (`file://`). Serve the repository root with any static file server, for example:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Python is used here only as a local file server. The site itself has no dependencies.

## Adding a lesson

1. **Copy the template.** Copy `templates/lesson.html` to `site/curriculum/<course>/<NN-slug>/index.html`. `NN` is the lesson number from `curriculum.json`, and the slug is lowercase-with-hyphens.
2. **Fill in every `{{PLACEHOLDER}}`.** Placeholders cover the `<title>`, description, canonical URL, Open Graph tags, JSON-LD, breadcrumbs, heading, meta line, objectives, attribution and edit link. Keep the objectives identical to `curriculum.json`.
3. **Write the lesson** in the `<article>`, in this order: objectives box → body (with `<h2>`/`<h3>` sections) → code and Try-it examples → *Check your understanding* → *Key takeaways* → *Exercise* → *Further reading*. The building blocks are below.
4. **Test every code sample.** Run it and paste the real output into the page. Everything must run for free on public tools, with no paid API keys.
5. **Update the lists that link to the lesson:**
   - `site/curriculum.json`: set the lesson’s `"status"` to `"published"`.
   - The course page, `site/curriculum/<course>/index.html`: turn the syllabus entry into a link, remove its *In progress* badge, and update the “Lessons” count in the meta strip.
   - The previous and next published lessons: update their pager links. A lesson whose next lesson isn’t written yet shows *Next: in progress*.
   - `site/sitemap.xml`: add the URL. **Search only indexes pages listed in the sitemap.**
   - `site/search/index.html`: add the lesson under its course in *Everything on this site*.
6. **Add the notebook**, if the lesson has Python (see below).
7. Run the checks in [Before you open a pull request](#before-you-open-a-pull-request).

## Building blocks

Copy these snippets. The CSS and JavaScript already know about them.

### Headings with anchor links

```html
<h2 id="measuring-similarity">Measuring similarity<a class="anchor" href="#measuring-similarity" aria-label="Link to this section">#</a></h2>
```

Every `h2` and `h3` needs a unique `id`. Search results link to these ids, and each `h2`/`h3` starts a new search section.

### Code

```html
<figure class="code">
<pre data-title="bpe.py"><code class="language-python">for i in range(3):
    print(i &lt; 2)</code></pre>
</figure>

<pre class="output"><code class="language-output">True
True
False</code></pre>
```

- **Escape `<` as `&lt;` and `&` as `&amp;`** inside code, or the browser will treat them as HTML.
- Languages: `html`, `css`, `javascript`, `sql`, `python`, `java`, `r`, `c`, `cpp`, `json`, `bash`, `yaml`, `powershell`, `text`, and `output` for program output. `code-blocks.js` adds highlighting (rules in `highlight.js`), the language label and the Copy button.
- `data-title` is optional and shows a file name in the caption.

### Callouts

```html
<aside class="callout callout--tip">
<p class="callout__label">Tip</p>
<p>…</p>
</aside>
```

Variants: `callout--note`, `callout--tip`, `callout--caution`, `callout--danger`. Always keep the text label; colour alone must never carry meaning.

### Objectives, quiz, takeaways, exercise

```html
<section class="objectives" aria-labelledby="what-youll-learn">
<h2 id="what-youll-learn">What you’ll learn</h2>
<ul><li>…</li></ul>
</section>

<section class="quiz" aria-labelledby="check-your-understanding">
<h2 id="check-your-understanding">Check your understanding<a class="anchor" href="#check-your-understanding" aria-label="Link to this section">#</a></h2>
<details><summary>Question?</summary><p>Answer.</p></details>
</section>

<section class="takeaways" aria-labelledby="key-takeaways">
<h2 id="key-takeaways">Key takeaways<a class="anchor" href="#key-takeaways" aria-label="Link to this section">#</a></h2>
<ul><li>…</li></ul>
</section>

<section class="exercise" aria-labelledby="exercise">
<h2 id="exercise">Exercise: short title<a class="anchor" href="#exercise" aria-label="Link to this section">#</a></h2>
<p>One scoped task that advances the course artifact.</p>
<details class="hint"><summary>Hint</summary><p>…</p></details>
</section>
```

### Try it (JavaScript, runs in the browser)

```html
<div class="tryit" data-tryit="js">
<p class="tryit__title">Try it: what to change</p>
<figure class="code"><pre><code class="language-javascript">console.log("hello");</code></pre></figure>
<p class="tryit__nojs">To run this without the interactive editor, paste it into your browser’s developer console.</p>
</div>
```

No extra script tag is needed: `main.js` loads `tryit.js` automatically on pages that contain a sandbox. Code runs in `site/assets/tryit/runner.html` inside `<iframe sandbox="allow-scripts">`. **Never add `allow-same-origin`** or any other sandbox permission. Output comes from `console.log`.

### Try it (Python, runs in Colab)

```html
<div class="tryit tryit--python">
<p class="tryit__title">Run it in a notebook</p>
<p class="button-row"><a class="button" href="https://colab.research.google.com/github/unitDXI/.github/blob/main/site/notebooks/511-101/02-tokens-and-embeddings.ipynb" data-notebook="../../../notebooks/511-101/02-tokens-and-embeddings.ipynb" rel="noopener">Open in Colab</a> <a class="button button--secondary" href="https://github.com/unitDXI/.github/blob/main/site/notebooks/511-101/02-tokens-and-embeddings.ipynb" rel="noopener">View on GitHub</a></p>
</div>
```

`data-notebook` must point at the notebook’s path on the site. Search follows it and indexes the notebook’s text and code.

### Tables

```html
<div class="table-wrap" role="region" tabindex="0" aria-label="Short description">
<table>
<caption>Short description</caption>
<thead><tr><th scope="col">…</th></tr></thead>
<tbody><tr><td>…</td></tr></tbody>
</table>
</div>
```

## Notebooks

- Save as `site/notebooks/<course>/<NN-slug>.ipynb`, next to the course’s `requirements.txt`.
- The **first cell** must be the attribution, as in the existing notebooks.
- **Clear all outputs** before committing.
- Pin every third-party package in `requirements.txt` as `name==version`, and note the Python version you tested with.
- Run every cell top to bottom in a fresh environment before committing.

## Adding a course

When a planned course is ready to publish:

1. Copy an existing course page, such as `site/curriculum/511-102/index.html`, to `site/curriculum/<code>/index.html`, and update all the course details: title, description, meta strip, objectives, syllabus, artifact acceptance criteria and resources.
2. In `curriculum.json`, find the course under its track (AI courses are in `tracks` → `ai` → `stages`), set its `"status"` to `"published"`, and add its `lessons` (all `"draft"` to start).
3. On `site/curriculum/index.html`, make the course title a link and remove *Soon*, in both the table and the stage’s card.
4. Update `curriculum.csv`, `sitemap.xml`, `search/index.html`, and the neighbouring course pages’ pagers.

## Publishing a new track

When the first lessons of a language or tool track are ready:

1. Create the track’s pages under its path (for example `site/html/index.html` and `site/html/<NN-slug>/index.html`), starting from `templates/lesson.html`. Set `data-track` on the sidebar element to the track id and remove `data-course`. Put the track name in the breadcrumbs instead of “AI Engineering”.
2. In `curriculum.json`, give the track a `"path"` and `"lessons"` (or `"courses"`), and set its `"status"` to `"published"`.
3. On `site/curriculum/index.html` and the home page (`index.html`), replace the track’s *Soon* card and badge with links.
4. Add the new pages to `sitemap.xml`, `search/index.html` and `curriculum.csv`.

## Cohort applications (Google Forms)

People apply to a cohort through a Google Form. The site only links to it. Nothing is embedded, and no form data passes through the site. The form URL appears in **one place**: the *Open the application form* button (`data-cohort-form`) in `site/cohorts/index.html`. Every other “Join a cohort” link points to `/cohorts/`.

To open applications:

1. Create the form in Google Forms, using the account that owns Unit 511 cohorts. Suggested questions (ask only what you need):
   - Name *(short answer, required)*
   - Email *(required; turn on "Collect email addresses" or add a validated short answer)*
   - GitHub username *(optional)*
   - Time zone *(dropdown or short answer)*
   - Which stage or track do you want to join? *(multiple choice)*
   - Your programming experience *(multiple choice: none / some / professional)*
   - Hours per week you can give *(multiple choice)*
   - What would you like to build? *(paragraph, optional)*
   - "I have read and agree to the Code of Conduct" *(required checkbox, linking to https://unit511.fairytale.ai/site/code-of-conduct/)*
2. In the form’s settings, leave “Limit to 1 response” (which requires a Google sign-in) **off**, so people without a Google account can apply. Keep the responses private to maintainers.
3. Copy the form’s short link (`https://forms.gle/…`) into the button in `site/cohorts/index.html`, replacing `REPLACE-WITH-UNIT-511-FORM-ID`.
4. Announce the cohort in a blog post and in Discussions, with its dates and the expected weekly time.
5. When the application window closes, stop accepting responses in the form. Delete the responses after the cohort ends, as the cohorts page promises.

## Adding a blog post

1. Copy `site/blog/2026-09-30-introducing-unit-511/` to `site/blog/<YYYY-MM-DD-slug>/` and update the head, JSON-LD, breadcrumbs, header, body and attribution.
2. Add it to the top of the list in `site/blog/index.html`. Add any new tags to the tag filter buttons.
3. Add an `<item>` at the top of `site/blog/feed.xml` and update `<lastBuildDate>`.
4. Update *Latest from the blog* on the home page (`index.html` at the repository root, three most recent posts).
5. Add the URL to `sitemap.xml` and to the list on `search/index.html`.

## Before you open a pull request

- [ ] Every page you touched has a unique `<title>`, `meta description` and `canonical` URL on `https://unit511.fairytale.ai/site/`.
- [ ] Headings go in order (one `h1`, no skipped levels), every `h2`/`h3` has a unique `id`, images have `alt` text, and link text makes sense out of context.
- [ ] Code samples were run and their output pasted in; `<` and `&` are escaped.
- [ ] New pages are in `sitemap.xml`, and published lessons are marked `"published"` in `curriculum.json`.
- [ ] The page works with JavaScript turned off. It works at 320px wide and at 200% zoom, and in light and dark themes.
- [ ] No references to Fairytale.ai internal systems, tools or plans. Teaching material stays vendor-neutral.
- [ ] Commits are signed off (`git commit -s`), confirming you have the right to contribute under our licences.

## Licensing

By contributing you agree that your contribution is licensed under **CC BY 4.0** (content; see `LICENSE-CONTENT`) and **MIT** (code; see `LICENSE`). Only include third-party material you are allowed to share under those terms, and credit it.
