import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { queriesFromProfile, queryFromProfile, toMarkdown } from "../src/lib/profile.js";
import { toArbeitJobShape } from "../src/lib/store.js";
import { certsFor, coursesFor, recommendFor } from "../src/data/courses.js";

describe("profile interview → md + queries", () => {
  it("md carries every answer plus scrape queries", () => {
    const md = toMarkdown({ track: "sde", skills: "html, css", goal: "internship", loc: "remote", hours: "5-8" });
    assert.match(md, /track: sde/);
    assert.match(md, /has skills: html, css/);
    assert.match(md, /## Scrape queries/);
  });
  it("queries prefer her skills, not the track", () => {
    assert.deepEqual(queriesFromProfile({ track: "sde", skills: "react, node" }).slice(0, 2), ["react", "node"]);
  });
  it("india location keeps non-remote jobs", () => {
    assert.equal(queryFromProfile({ loc: "india" }, "data").remote, false);
    assert.equal(queryFromProfile({ loc: "remote" }, "data").remote, true);
  });
});

describe("arbeitnow mapper", () => {
  it("maps a dev posting, drops untracked roles", () => {
    const j = toArbeitJobShape({ slug: "x", title: "Frontend Developer", company_name: "Acme", tags: ["react"], job_types: ["full_time"], remote: true, url: "https://x", description: "<p>react job</p>" });
    assert.equal(j.role, "sde");
    assert.ok(j.skills.includes("react"));
    assert.equal(toArbeitJobShape({ title: "Truck Driver", description: "drive trucks" }), null);
  });
});

describe("free certs", () => {
  it("every track resolves at least one free cert link", () => {
    for (const s of ["react", "sql", "seo", "quant", "unknown-skill"]) {
      assert.ok(certsFor(s).length >= 1, s);
    }
  });
  it("certificate goal ranks cert first; tight hours push 20h courses down", () => {
    assert.ok(recommendFor("sql", { goal: "certificate" })[0].c);
    const light = recommendFor("sql", { hours: "2-4" });
    assert.match(light[0].u, /sqlbolt/);
    assert.match(light[light.length - 1].u, /khanacademy/);
  });
  it("no profile behaves like the plain list", () => {
    assert.deepEqual(recommendFor("sql", {}).map((c) => c.u), coursesFor("sql").map((c) => c.u));
  });
});
