import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { runCodex } from '../src/bridge.mjs';
import { reviewRepo } from '../src/pr-review.mjs';

test('review adapter disables execution and external tools and uses only the validated snapshot', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ab-review-adapter-'));
  await mkdir(join(root, 'logs'));
  const binary = join(root, 'fake-codex.mjs');
  await writeFile(binary, `#!/usr/bin/env node
import {writeFileSync} from 'node:fs';
const args=process.argv.slice(2);
for(const required of ['read-only','never','--strict-config','--ignore-user-config','web_search="disabled"','mcp_servers={}','features.shell_tool=false','features.unified_exec=false','features.apply_patch_freeform=false','features.apps=false','features.multi_agent=false','features.hooks=false'])
 if(!args.includes(required)) process.exit(2);
let input='';process.stdin.on('data',x=>input+=x);process.stdin.on('end',()=>{
 if(!input.includes('untrusted data')||!input.includes('Do not call tools')||!input.includes('example.c'))process.exit(3);
 writeFileSync(args[args.indexOf('-o')+1],'Synthetic review only.');
 console.log(JSON.stringify({type:'thread.started',thread_id:'review'}));
 console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'Synthetic review only.'}}));
 console.log(JSON.stringify({type:'turn.completed'}));
});
`, { mode: 0o700 });
  const previous = process.env.AB_CODEX_BIN; process.env.AB_CODEX_BIN = binary;
  try {
    const diff = 'diff --git a/example.c b/example.c\n';
    const body = JSON.stringify({ version: 1, repo: reviewRepo, pr: 1, base: 'a'.repeat(40), head: 'b'.repeat(40), diff,
      sha256: createHash('sha256').update(diff).digest('hex') });
    const result = await runCodex({ cwd: root, review: true, message: { message_id: 'test-review', body }, outputDir: join(root, 'logs') });
    assert.equal(result.body, 'Synthetic review only.');
    await assert.rejects(runCodex({ cwd: root, review: true, message: { message_id: 'bad', body: '{}' }, outputDir: join(root, 'logs') }), /scope/);
  } finally { if (previous === undefined) delete process.env.AB_CODEX_BIN; else process.env.AB_CODEX_BIN = previous; }
});
