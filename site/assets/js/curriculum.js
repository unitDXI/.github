/* Unit 511 — loads site/curriculum.json once per page and shares it between modules
   (the sidebar and session progress both need it). */
import { sitePath } from "./util.js";

let promise = null;

export function loadCurriculum() {
  if (!promise) {
    promise = fetch(sitePath("curriculum.json")).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }
  return promise;
}

/** Every course in every track, whether grouped into stages or listed directly. */
export function allCourses(data) {
  return (data.tracks || []).flatMap((t) => (t.courses || []).concat(...(t.stages || []).map((s) => s.courses)));
}
