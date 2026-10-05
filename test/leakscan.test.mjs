import test from 'node:test'; import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { scanText, scanPath } from '../scripts/leakscan.mjs';
const bad = ['We build a shi'+'eld for you','To'+'ny Sta'+'rk dreams','AKIA'+'ABCDEFGHIJKLMNOP','sk-'+'a'.repeat(24),'see .dev.vars','FOUNDER_JOURNAL.md','defen'+'se tech','a miss'+'ile','milit'+'ary use','ghp_'+'a'.repeat(36)];
for (const t of bad) test('flags: '+t.slice(0,18), () => assert.ok(scanText('x.md', t).length>0));
test('ordinary text passes', () => assert.deepEqual(scanText('x.md','Home cooking for one, with steps a beginner can follow.'), []) );
test('path rules', () => { for (const p of ['node_modules/a.js','.env','.env.local','a/b.map','notes/my-journal.md','.dev.vars']) assert.ok(scanPath(p).length>0, p); assert.deepEqual(scanPath('projects/kathaa/README.md'), []); });
test('verify catches drift', () => {
  const d = mkdtempSync(join(tmpdir(),'hub-')); cpSync(new URL('..', import.meta.url), d, {recursive:true, filter:s=>!/\.git|node_modules/.test(s)});
  assert.equal(spawnSync('node',['scripts/verify.mjs'],{cwd:d}).status, 0);
  writeFileSync(join(d,'README.md'), 'tampered'); assert.equal(spawnSync('node',['scripts/verify.mjs'],{cwd:d}).status, 1);
  rmSync(d,{recursive:true,force:true});
});
test('verify catches a stray file under projects/', () => {
  const d = mkdtempSync(join(tmpdir(),'hub-')); cpSync(new URL('..', import.meta.url), d, {recursive:true, filter:s=>!/\.git|node_modules/.test(s)});
  writeFileSync(join(d,'projects','kathaa','secret.txt'),'x'); assert.equal(spawnSync('node',['scripts/verify.mjs'],{cwd:d}).status, 1);
  rmSync(d,{recursive:true,force:true});
});
