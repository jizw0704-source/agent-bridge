import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const reviewTask = 'translator-pr-review';
export const reviewRepo = 'LightningFlashEvE/esp32-english-translator';
export const reviewLimit = 512000;
const exec = promisify(execFile);
const digest = diff => createHash('sha256').update(diff).digest('hex');

// Local policy, never supplied or expanded by peer text.
export function validateReview(body) {
  const data = JSON.parse(body);
  const keys = ['version', 'repo', 'pr', 'base', 'head', 'diff', 'sha256'];
  if (!data || Array.isArray(data) || Object.keys(data).length !== keys.length ||
      keys.some(key => !Object.hasOwn(data, key)) || data.version !== 1 || data.repo !== reviewRepo ||
      ![1, 2].includes(data.pr) || !/^[a-f0-9]{40}$/.test(data.base) || !/^[a-f0-9]{40}$/.test(data.head) ||
      typeof data.diff !== 'string' || !data.diff.startsWith('diff --git ') ||
      body.length > reviewLimit || data.sha256 !== digest(data.diff)) throw new Error('Outside authorized PR review scope');
  return data;
}

// Only the local owner invokes this; fixed gh API reads, no shell or peer commands.
export async function prepareReview(pr, read = readGitHubReview) {
  if (![1, 2].includes(pr)) throw new Error('Only translator PRs 1 and 2 are authorized');
  const endpoint = `repos/${reviewRepo}/pulls/${pr}`;
  const before = JSON.parse(await read(endpoint));
  if (before.state !== 'open') throw new Error('PR is not open');
  // Commit-pinned compare avoids fetching an unpinned moving PR diff.
  const diff = await read(`repos/${reviewRepo}/compare/${before.base.sha}...${before.head.sha}`, true);
  const after = JSON.parse(await read(endpoint));
  if (before.head.sha !== after.head.sha || before.base.sha !== after.base.sha || after.state !== 'open') throw new Error('PR changed during snapshot; prepare again');
  const body = JSON.stringify({ version: 1, repo: reviewRepo, pr, base: before.base.sha, head: before.head.sha, diff, sha256: digest(diff) });
  validateReview(body);
  return body;
}

export async function readGitHubReview(path, diff) {
  return (await exec('gh', ['api', ...(diff ? ['-H', 'Accept: application/vnd.github.diff'] : []), path], { maxBuffer: 2000000 })).stdout;
}
