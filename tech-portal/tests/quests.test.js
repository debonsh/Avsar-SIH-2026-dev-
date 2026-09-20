// node --test: deterministic variant picker + evidence-URL gate. Pure, no storage.
import { test } from "node:test";
import assert from "node:assert/strict";
import { hashStr, pickForId, isEvidenceUrl } from "../src/lib/quests.js";

test("same id + salt always picks the same variant (stable per student)", () => {
  const pool = ["a", "b", "c"];
  assert.equal(pickForId(pool, "C2C-X7K2QA", "sde:react"), pickForId(pool, "C2C-X7K2QA", "sde:react"));
});

test("different ids spread across variants (unique-ish per student)", () => {
  const pool = ["a", "b", "c"];
  const picks = new Set(Array.from({ length: 12 }, (_, i) => pickForId(pool, `C2C-ID${i}`, "sde:react")));
  assert.ok(picks.size > 1, "12 ids should not all land on one variant");
});

test("empty pool returns null, never throws", () => {
  assert.equal(pickForId([], "C2C-X"), null);
});

test("hashStr is a stable uint32", () => {
  assert.equal(hashStr("abc"), hashStr("abc"));
  assert.ok(hashStr("abc") !== hashStr("abd"));
});

test("isEvidenceUrl accepts real links, rejects junk", () => {
  assert.equal(isEvidenceUrl("https://github.com/u/repo"), true);
  assert.equal(isEvidenceUrl("http://vercel.app/x-long-enough"), true);
  assert.equal(isEvidenceUrl("not a link"), false);
  assert.equal(isEvidenceUrl("https://x.co"), false); // too short to be proof
  assert.equal(isEvidenceUrl(""), false);
});
