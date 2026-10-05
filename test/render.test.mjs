import test from 'node:test'; import assert from 'node:assert/strict';
import { loadRegistry } from '../scripts/registry.mjs';
import { renderAll } from '../scripts/render.mjs';
const reg = loadRegistry(new URL('../data/projects.json', import.meta.url));
const out = renderAll(reg);
test('expected files exist', () => {
  for (const k of ['README.md','COMPANY.md','status/STATUS.md','projects/kathaa/README.md','projects/kathaa/CHANGELOG.md','projects/kathaa/latest.json','projects/circuit-lab/README.md'])
    assert.ok(out.has(k), k);
});
test('COMPANY has registered details', () => {
  const c = out.get('COMPANY.md');
  assert.match(c,/17401160/); assert.match(c,/71-75 Shelton Street/); assert.match(c,/ATHI 360 LTD/);
});
test('README has one row per project', () => {
  const rows = out.get('README.md').split('\n').filter(l=>l.startsWith('| [')||l.startsWith('| **'));
  assert.equal(rows.length, reg.projects.length);
});
test('deterministic', () => assert.deepEqual([...renderAll(reg)], [...renderAll(reg)]));
test('latest.json parses and has no download yet', () => {
  const j = JSON.parse(out.get('projects/kathaa/latest.json')); assert.equal(j.slug,'kathaa'); assert.deepEqual(j.downloads,[]);
});
test('project README has the five blocks', () => {
  const r = out.get('projects/dish/README.md');
  for (const h of ['## The problem','## Who it is for','## What it does today','## What it could mean later','## Links']) assert.ok(r.includes(h), h);
});
