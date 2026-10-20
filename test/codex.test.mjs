import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCodex } from '../src/bridge.mjs';

test('CLI adapter passes read-only flags and rejects tool events', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ab-adapter-test-'));
  const binary = join(root, 'fake-codex.mjs');
  const original = process.env.AB_CODEX_BIN;
  await mkdir(join(root, 'logs'));
  await writeFile(binary, `#!/usr/bin/env node
import {writeFileSync} from 'node:fs';
const args=process.argv.slice(2);
if (!args.includes('read-only') || !args.includes('never') || !args.includes('--ignore-user-config')) process.exit(2);
process.stdin.resume();
process.stdin.on('end',()=>{
 writeFileSync(args[args.indexOf('-o')+1],'reply');
 console.log(JSON.stringify({type:'thread.started',thread_id:'thread'}));
 console.log(JSON.stringify({type:'item.completed',item:{type:'command_execution'}}));
 console.log(JSON.stringify({type:'turn.completed'}));
});
`, { mode: 0o700 });
  process.env.AB_CODEX_BIN = binary;
  try {
    await assert.rejects(runCodex({ cwd: root, message: { message_id: 'w1', body: 'fixture' }, outputDir: join(root, 'logs') }), /Unexpected tool/);
    await writeFile(binary, '#!/usr/bin/env node\nprocess.stdin.resume();setInterval(()=>{},1000);\n', { mode: 0o700 });
    await assert.rejects(runCodex({ cwd: root, message: { message_id: 'w2', body: 'fixture' }, outputDir: join(root, 'logs'), timeoutMs: 100 }), /timed out/);
  } finally {
    if (original === undefined) delete process.env.AB_CODEX_BIN; else process.env.AB_CODEX_BIN = original;
  }
});
