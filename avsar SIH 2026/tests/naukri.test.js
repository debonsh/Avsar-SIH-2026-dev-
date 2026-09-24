import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { importNaukri, mapNaukri, anchorOf } from "../scripts/naukri.mjs";

describe("naukri import", () => {
  it("maps a dev posting with skills + fresher score", () => {
    const j = mapNaukri({ id: 1, title: "React JS Developer", company: "Infosys", experience: "0-7 Yrs", location: "Hyderabad, Pune", posted: "now" }, "https://x");
    assert.equal(j.role, "sde");
    assert.ok(j.skills.includes("react"));
    assert.equal(j.minScore, 40);
    assert.equal(j.loc, "Hyderabad");
    assert.equal(j.src, "naukri");
  });
  it("denies mechanical/support/recruiter titles", () => {
    for (const t of ["Fresher Maintenance Engineer", "It Support Engineer", "US Recruiter - Mech background", "Field Service Engineer", "Purchase Specialist"]) {
      assert.equal(mapNaukri({ title: t, company: "X" }), null, t);
    }
  });
  it("dedupes same title+company, counts drops", () => {
    const raw = { url: "#", jobs: [
      { id: 1, title: "React JS Developer", company: "Infosys", experience: "0-1 Yrs", location: "Pune" },
      { id: 2, title: "React JS Developer", company: "Infosys", experience: "0-1 Yrs", location: "Pune" },
      { id: 3, title: "Truck Driver", company: "X" },
    ]};
    const { jobs, dropped, total } = importNaukri(raw);
    assert.equal(jobs.length, 1);
    assert.equal(dropped, 2);
    assert.equal(total, 3);
  });
  it("resolves postedAt against the scrape anchor, not import time", () => {
    const raw = { url: "#", scraped_at: "2026-09-12T00:00:00.000Z", jobs: [
      { id: 9, title: "React JS Developer", company: "Infosys", experience: "0-1 Yrs", location: "Pune", posted: "3 days ago" },
    ]};
    const { jobs } = importNaukri(raw);
    assert.equal(jobs[0].postedAt, "2026-09-09T00:00:00.000Z");
    assert.equal(jobs[0].lane, "tech");
    assert.equal(jobs[0].posted, "3 days ago", "the raw string survives for display");
  });
  it("an unreadable posted string leaves the posting undated instead of guessing", () => {
    const j = mapNaukri({ id: 4, title: "React JS Developer", company: "X", posted: "recently" }, "#", Date.parse("2026-09-12T00:00:00.000Z"));
    assert.equal("postedAt" in j, false);
  });
  it("anchorOf uses the scrape timestamp, falling back to now", () => {
    assert.equal(anchorOf({ scraped_at: "2026-09-12T00:00:00.000Z" }), Date.parse("2026-09-12T00:00:00.000Z"));
    assert.equal(anchorOf({ scraped: "2026-09-12T00:00:00.000Z" }), Date.parse("2026-09-12T00:00:00.000Z"));
    const before = Date.now();
    const t = anchorOf({});
    assert.ok(t >= before && t <= Date.now(), "no timestamp means now");
  });
});
