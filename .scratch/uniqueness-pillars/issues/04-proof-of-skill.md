# 04: Proof-of-Skill hiring — blind, signed, deterministic

**What to build:** employers attach small challenges to postings. Submissions are graded by a deterministic rubric the candidate can inspect, receive a signed receipt, and enter an identity-blind shortlist. Identity unblinds only after a decision, and the reveal is logged.

**Blocked by:** Nothing, but ship after 02 and 03 (cut order puts the employer side last).

**Status:** done

- [x] `src/lib/sign.js`: `generateIssuerKeypair`, `signPayload`, `verifySigned`, `fingerprint`, `chainHash`, `signingMode`, `canonicalJSON` via WebCrypto ECDSA P-256, JWK in `avsar-issuer-key-v1`
- [x] Hash fallback degrades honestly: `signingMode` is surfaced in the UI and on every receipt, and FNV is never presented as cryptographic
- [x] `tests/sign.test.js` exercises the real ECDSA path (available in Node 19+), a tampered payload fails, and the fallback is labelled as weaker
- [x] `src/lib/challenges.js`: challenge and submission stores, `gradeSubmission` with `why[]`, `blindId`, `rankSubmissions`, `shortlist`, `revealIdentity` with an audit entry
- [x] Grading is deterministic and rubric-styled like `score.js`, gated on `isEvidenceUrl` (`src/lib/quests.js:21`), no AI scoring
- [x] `src/data/challengeTemplates.js`: three ayush challenges and three tech challenges, all offline
- [x] Lane parity hook: a passed challenge verifies the skill in `profileForMatching` for both lanes, not only ayush
- [x] `src/lib/verify.js`: v2 signed credentials alongside v1, with a frozen v1 code as a regression test so old QRs keep validating
- [x] `/challenges` (both student lanes), `/shortlist` (industry desk, requires a new `DESK_SEGMENTS` entry or it silently becomes student-only), post-a-challenge on `/industry`
- [x] Receipt card plus QR on `/portfolio`, reusing the existing `qrcode` dependency and canvas pattern
- [x] `tests/challenges.test.js` green, plus `node --test "tests/*.test.js"`, `npm run lint`, `npm run build`

## Comments
**Status: done.** What landed:

- `src/lib/sign.js` and `tests/sign.test.js` (12 cases). WebCrypto ECDSA P-256, canonical JSON so a signature cannot depend on key order, a key fingerprint, a hash chain, and an honest `hash-fallback` mode for browsers without WebCrypto. The receipt carries the public key so it verifies with no server, and every surface prints what that proves (integrity) and what it does not (issuer identity, which needs the key pinned separately).
- One real flaw found by writing the test rather than the code: fingerprinting a private JWK gave a different `kid` from the public one, because `key_ops` and `ext` differ between the halves. A key's identity should not depend on which half you hold, so `publicKeyFor` now drops those too.
- `src/lib/challenges.js` and `tests/challenges.test.js` (19 cases): a published rubric (40 host fit, 30 note substance, 30 brief coverage, gated on `isEvidenceUrl`), `blindId`, `rankSubmissions`, `shortlist`, `revealIdentity` with an audit trail, and `verifiedSkills`.
- The reveal is refused until a decision is on the record, which a test pins by asserting the audit trail reads `["decision", "reveal"]` in that order.
- `src/data/challengeTemplates.js`: three ayush and three tech challenges, all offline.
- Pages: `/challenges`, `/shortlist` (industry desk, with its own `DESK_SEGMENTS` entry so it does not fall through to the students), post-a-challenge on `/industry`, receipt cards on `/portfolio`, and `verify.js` v2 credentials alongside v1 with a frozen v1 regression test.
- `src/components/Receipt.jsx`: one card for every surface, so the portfolio, the challenge page and the verify page cannot describe the same cryptographic state three ways.

**Design decisions worth recording.** Shortlisting is a deliberate button, not a side effect of rendering: taking a decision writes an audit row, and a log that grows because a component re-rendered is not a log. And an evidence URL is not anonymous even when the handle is, so `evidenceLabel` shows only the host and every row says plainly that opening the artifact may identify its author.
**Closed in a second pass, and this one mattered.** The lane parity hook was a dead function: `verifiedSkills` existed and nothing consumed it, so a passed challenge would not have moved a single score. `profileForMatching` now reads `proofVerifiedSkills()`, which means a proved skill counts as held *and* verified in both lanes, even when the resume never mentioned it. The rule sits in the engine rather than at each call site because a caller that forgot it would produce a quietly weaker score instead of an error. Two tests pin it: one asserts the score itself moves off zero for a proved skill the resume omits, and one asserts a submission below the bar proves nothing.
