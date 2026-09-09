# 08: Voice-first interview, text fallback after 2 fails (Slice 2, longcat)

**What to build:** `src/lib/speech.js` (`isVoiceSupported`, `listenOnce(15s)`), mic button per question, failCount in state, auto text-fallback note after 2 fails.

**Blocked by:** None (isolated to interview block).

**Status:** resolved

- [x] listenOnce resolves {transcript}|{error}, never hangs (verified)
- [x] Unsupported browser -> text path, no dead button
- [x] Fixed 2026-09-10: memo-order TDZ crash that blanked the whole app (roadmap memo read `result` before init)
- [x] Full App SSR render green, `npm run build` passes

## Comments

Rule going forward: new useMemo goes BELOW the state it reads. Grade path still text-based until voiceScore wiring lands.
