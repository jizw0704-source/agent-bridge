# Project progress page validation

[简体中文](../PROJECT_PAGE_QA.md) | [English](PROJECT_PAGE_QA.md)

Date: October 21, 2026. Target: root `project.html`. Baseline: Pheno v1.4 for a static project summary, without image or brand assets.

Checked desktop rendering and a 390 CSS px iframe viewport with no visible horizontal overflow; this is not physical-device acceptance. Exercised language switching, pending/all filtering, native disclosures, and Tab navigation. Documentation links use absolute GitHub addresses for the portable Obsidian copy.

Inline JavaScript syntax, `pnpm check`, all 19 existing AB tests, and whitespace checks passed. Existing tests cover messaging rather than browser automation. Calculated contrast ratios: graphite on light gray 8.27:1, readable green on white 5.21:1, link blue on white 7.13:1, control boundary on white 3.06:1.

No external scripts, remote fonts, request endpoints, tokens, private network addresses, or identity codes are included. Runtime observations are snapshots.

Limitations: MiSans is not bundled; a system fallback is used. Screen readers, forced-colors/reduced-transparency OS modes, and physical touch devices were not tested. There is no animation, asynchronous network action, destructive/edit form, or disabled action requiring additional states. All current filters have content; an empty fallback is implemented.

The design helper could not execute because of file permissions; source, screenshot, interaction, and color checks do not constitute full automated design certification. An independent review’s relative-link finding was corrected with absolute GitHub documentation URLs.
