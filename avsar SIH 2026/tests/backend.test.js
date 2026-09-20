// node --test: backend row-shapers + funnel. Pure, no network, no localStorage touched.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isJobEvent, isArtifactKind, normalizeSection,
  toAssessmentRow, toJobEventRow, toArtifactRow, toFeedbackRow, funnelCounts, analyticsSummary,
} from "../src/lib/backend.js";

test("job event + artifact kind guards accept only known values", () => {
  assert.equal(isJobEvent("applied"), true);
  assert.equal(isJobEvent("hired"), false);
  assert.equal(isArtifactKind("cover_letter"), true);
  assert.equal(isArtifactKind("essay"), false);
  assert.equal(normalizeSection("Education"), "education");
  assert.equal(normalizeSection("hobbies"), null);
});

test("toAssessmentRow clamps scores and caps gaps", () => {
  const r = toAssessmentRow({ ats: 120, main: 90, roleKey: "data", gaps: ["a", "b"] });
  assert.equal(r.ats, 95);
  assert.equal(r.main, 90);
  assert.deepEqual(r.gaps, ["a", "b"]);
  assert.equal(toAssessmentRow({}), null);
});

test("toJobEventRow rejects bad events, toArtifactRow rejects empty body", () => {
  assert.equal(toJobEventRow({ jobId: "1", event: "hired" }), null);
  assert.equal(toJobEventRow({ jobId: "1", event: "Offer" }).event, "offer");
  assert.equal(toArtifactRow({ kind: "match", body: "" }), null);
  assert.equal(toArtifactRow({ kind: "match", body: "hi", jobId: 7 }).job_id, "7");
});

test("toFeedbackRow clamps rating 1-5", () => {
  assert.equal(toFeedbackRow({ rating: 9, comment: "great" }).rating, 5);
  assert.equal(toFeedbackRow({}), null);
  assert.equal(toFeedbackRow({ rating: 0 }).rating, 1);
});

test("funnelCounts keeps latest status per job", () => {
  const out = funnelCounts([
    { jobId: "a", event: "saved" },
    { jobId: "a", event: "applied" },
    { jobId: "b", event: "saved" },
    { jobId: "c", event: "hired" },
  ]);
  assert.equal(out.saved, 1);
  assert.equal(out.applied, 1);
  assert.equal(out.rejected, 0);
});

test("analyticsSummary aggregates roles bands ratings comments", () => {
  const s = analyticsSummary(
    [{ role_key: "sde", ats: 70 }, { role_key: "sde", ats: 30 }, { role_key: "data", ats: 50 }],
    [{ rating: 5, comment: "great" }, { rating: 3, comment: "" }, { rating: 9, comment: "x" }]
  );
  assert.equal(s.total, 3);
  assert.equal(s.byRole.sde, 2);
  assert.deepEqual(s.bands, { "0-44": 1, "45-64": 1, "65+": 1 });
  assert.equal(s.avgRating, 4);
  assert.equal(s.ratingCount, 2);
  assert.equal(s.comments.length, 2);
  assert.deepEqual(analyticsSummary([], []).bands, { "0-44": 0, "45-64": 0, "65+": 0 });
});
