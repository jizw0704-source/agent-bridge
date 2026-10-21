# Project progress page design

Applies to `project.html`, a read-oriented local project summary. Pheno Design Language v1.4 is the governing system; no product theme extension or approved exception.

Primary purpose: understand the latest verified project state. Three groups: overview, capabilities and handoff flow, progress and next steps. Neutral white and #F7F7F7 surfaces, #101010 text, #4A4A4A secondary text, #E4E4E4 dividers, #245A91 links, #567700 readable green; #95CA00 limited to a redundant navigation dot. No imagery or logos are invented.

MiSans with system fallbacks; no authorized font file is bundled. Body 16px/1.65, desktop title 40px/600, mobile title 32px/600, section headings 24px/600. Eight-pixel spacing base; compact surface radius 16px, controls 10px. A 224px desktop navigation rail collapses above the main content below 900px. Six sequential steps reflow from three columns to one on narrow screens.

Native select, button, links and details provide keyboard and touch controls. Minimum targets 44px; visible focus; no animation. No async UI or remote access. Runtime observations are explicitly dated; expiry is computed locally from the recorded room deadline. Static status does not establish current connectivity.

QA evidence and limitations are recorded in docs/PROJECT_PAGE_QA.md.
