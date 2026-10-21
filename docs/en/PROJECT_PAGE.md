# Project progress page

[简体中文](../PROJECT_PAGE.md) | [English](PROJECT_PAGE.md)

Open `project.html` at the repository root in a browser. The self-contained page has no third-party dependencies and needs no AB service. Language switching, capability filters, and disclosures work offline.

It summarizes the project, verified/pending/planned capabilities, the six-step handoff, milestones, and next steps. Runtime data is a maintained observation with a timestamp, not live monitoring. The page does not connect to the private relay or contain credentials, identity codes, or private network addresses. It shows an expiry notice when the recorded room has expired.

## Updating

1. Inspect repository and runtime evidence. The installed AB skill provides a read-only status helper.
2. Edit `snapshot`, `features`, `steps`, `history`, and the `data-zh`/`data-en` copy in `project.html`. Include only verified non-sensitive information. `checkedAt` must reflect the actual runtime inspection, not merely a page edit.
3. Check desktop and narrow layouts, both languages, filters, and keyboard focus. Run `pnpm check`, `pnpm test`, and `git diff --check`. No build is required.
4. Commit, push, and verify the remote commit. Copy the same HTML into the Obsidian project folder, update its overview links, and record the commit and validation. Preserve the distinction between history and current state.

Optional HTTP preview: run `python3 -m http.server 8874 --bind 127.0.0.1` from the repository, then open `http://127.0.0.1:8874/project.html`. Choose a free port if needed. Read Markdown references in the repository or Obsidian; browser handling of local Markdown varies.

Source and project records are synchronized; AB services are not automatically redeployed. The page does not support editing or automatic bidirectional sync. Filters and language switches affect only the current browsing session.

Documentation links point to GitHub so that the single-file Obsidian copy remains portable; consult repository docs when offline.
