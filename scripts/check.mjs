import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
for (const dir of ['src', 'test', 'scripts', 'skills/agent-bridge/scripts']) for (const name of await readdir(dir)) if (name.endsWith('.mjs')) {
  const result = spawnSync(process.execPath, ['--check', `${dir}/${name}`], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('JavaScript syntax checks passed.');
