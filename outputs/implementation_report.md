# SALT v4 implementation report

Generated: 2026-05-04

## Summary

- Replaced the question bank with SALT v4: 36 main items and 8 support-preference items.
- Added `direction` to every question and switched main scoring to use direction-adjusted values.
- Added three result layers: 综合 SALT, 你怎么依恋, 你希望伴侣怎么依恋.
- Added answer code generation, local decoder, copied share text, native share fallback, and PNG result-card export.
- Added GitHub Pages workflow that publishes only runtime static files.

## Result layers

- Main SALT uses averaged `S / A / L` plus `T_score`.
- Self-SALT uses `SelfS / SelfA / SelfL` plus the same T status.
- Partner-SALT uses `OtherS / OtherA / OtherL` plus the same T status.
- Support preference remains a sub-analysis and does not affect any SALT type code.

## Validation

- JavaScript syntax checks passed for `app.js`, `questions.js`, `data/*.js`, and `assets/art_manifest.js`.
- Python compile check passed for `tools/parse_ref_xlsx.py`.
- Confirmed 44 total questions: 36 main and 8 support.
- Confirmed S/A/L each have 12 items, 6 Self, 6 Other, 4 reverse-scored items, and valid pair counts.
- Confirmed browser `file://` run renders 3 result cards.
- Confirmed Main/Self/Partner codes can differ with a directed test answer set.
- Confirmed scores stay within `-100` to `+100`.
- Confirmed answer code decodes locally and restores 44 answers.
- Confirmed exported PNG canvas contains result data and answer code.
- Confirmed mobile result page has no horizontal overflow at 390px width.
- Confirmed no `fetch()`, external CDN, online fonts, or runtime HTTP references in core files.
- Confirmed `REF.xlsx` timestamp and size were unchanged during implementation.

## GitHub Pages scope

The workflow copies only:

- `index.html`
- `styles.css`
- `app.js`
- `questions.js`
- `data/`
- `assets/`
- `img/`
- `docs/scoring.md`
- `docs/github_pages.md`
- `.nojekyll`

The workflow excludes `REF.xlsx`, `~$REF.xlsx`, `tools/`, `outputs/`, and private working files.
