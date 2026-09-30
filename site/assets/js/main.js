/* Unit 511 — JavaScript entry point. Every page loads only this file:
     <script type="module" src="…/site/assets/js/main.js"></script>  (path relative to the page)
   Native ES modules, no bundler. Pages work without JavaScript; each module adds one enhancement
   and does nothing on pages that lack its markup. Module scripts run after the document is parsed. */
import { initTheme } from "./theme.js";
import { initSidebar } from "./sidebar.js";
import { initDrawer } from "./drawer.js";
import { initCodeBlocks } from "./code-blocks.js";
import { initCopy } from "./copy.js";
import { initCourseFilters, initTagFilter } from "./filters.js";
import { initGitHubActivity } from "./github-activity.js";
import { initSearch } from "./search-ui.js";
import { initProgress } from "./progress.js";

initTheme();
initSidebar();
initProgress();
initDrawer();
initCodeBlocks();
initCopy();
initCourseFilters();
initTagFilter();
initGitHubActivity();
initSearch();

// The sandbox is only needed on lessons that have one, so load it on demand.
if (document.querySelector('[data-tryit="js"]')) {
  import("./tryit.js").then((m) => m.initTryit());
}
