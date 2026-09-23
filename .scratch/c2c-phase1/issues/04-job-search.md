# 04: Job search + sidebar

**What to build:** Jobs home gets a Naukri-like keyword search over titles/companies plus a sidebar with mini ATS score and top-gap teasers linking into My Score.

**Blocked by:** 03 (same `App.jsx`; serialize edits).

**Status:** resolved

- [x] Search filters job list live; empty query shows all
- [x] Sidebar shows score (or upload CTA) + up to 2 gaps with links
- [x] `npm run build` passes

## Comments

Search (`q` state + `visibleJobs`) + sidebar reuse `coursesFor`/`result`. Empty state with Clear. Build green.
