# Taste

## Workflow
- Kicks off work by pointing at a plan file (e.g. `.scratch/*.md` plans) with a terse "start this" — expects the agent to read the plan, derive the roadmap steps, and drive execution from it. Confidence: 0.7
- Plans are kept in a `.scratch/` directory inside the project root. Confidence: 0.6

## Tooling
- Repo carries an ECC rules harness (`.claude/rules/ecc/{common,react,...}`) plus mattpocock skill packs (`.commandcode/skills`, e.g. `tdd`); these are meant to be consulted and followed when coding. Confidence: 0.6
- Verification loop is `node --test tests/*.test.js`, `npm run build`, `npm run lint`. Confidence: 0.6
