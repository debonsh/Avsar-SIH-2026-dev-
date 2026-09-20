// node --test: verifiable credentials. Pure, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { signCredential, checkCredential, verifyUrl } from "../src/lib/verify.js";

test("sign → check roundtrips with payload intact", () => {
  const code = signCredential({ id: "C2C-1", name: "Ananya", readiness: 72, skills: ["dravyaguna"] });
  const res = checkCredential(code);
  assert.equal(res.ok, true);
  assert.equal(res.payload.name, "Ananya");
  assert.equal(res.payload.readiness, 72);
  assert.deepEqual(res.payload.skills, ["dravyaguna"]);
});

test("tampered codes fail loudly", () => {
  const [body] = signCredential({ id: "C2C-1" }).split(".");
  assert.equal(checkCredential(`${body}.forged`).ok, false);
  assert.equal(checkCredential("garbage").ok, false);
  assert.equal(checkCredential("").ok, false);
});

test("verifyUrl points at the public route", () => {
  assert.ok(verifyUrl("abc.def").startsWith("/verify/"));
});
