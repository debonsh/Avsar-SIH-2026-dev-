# Avsar style lock (tastemaker)

## Type
- Display: Bricolage Grotesque 700, -0.02em (headlines, professional weight)
- Body: Inter 400, Noto Sans Devanagari fallback (Hindi coach answers render correctly)
- Mono: DM Mono, measurement only (scores, counts, tabular numbers). Never headlines.

## Color contract
- Paper `bg #f6f3ea` (warm), surface `#ffffff`, body text `#1c1917`
- Primary herb green `#1e7a4c`, deep `#155c39` (buttons, active tabs, charts)
- Status tints: green `#f0fdf4`, amber `#fffbeb`, blue `#eff6ff`, red `#fef2f2`
- Legal text-safe: emerald-900 on paper/white, white on emerald-700. Accent text `#166038` on white.

## Shape
- rounded-xl cards/inputs, rounded-full buttons/tabs/pills, rounded-md checkboxes
- 1px borders, soft shadow only on floating panels (coach dialog, dropdowns)
- FractalMap hero bg at 20% opacity, static on reduced-motion

## Dark mode
Runtime toggle (header sun/moon, persisted `c2c-theme`). Light default.
Dark = warm-dark panels `#141a15` on `#0d100e`; stone/white/emerald-tint
utilities remapped in index.css `.ayush-dark` layer. Hero gradient untouched.

## Identity motif
Leaf mark + warm paper + Devanagari vaidya growth stages (beej to acharya).
