import test from 'node:test'; import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, cpSync, rmSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { scanText } from '../scripts/leakscan.mjs';
import { validateRegistry, loadRegistry } from '../scripts/registry.mjs';

const BS = String.fromCharCode(92);
const repo = new URL('..', import.meta.url);
function copyRepo() {
  const d = mkdtempSync(join(tmpdir(), 'hub-'));
  const root = repo.pathname.slice(1);
  cpSync(repo, d, { recursive: true, filter: s => !/(^|[/\\])(\.git|node_modules)([/\\]|$)/.test(relative(root, s.replace(/\\/g, '/'))) });
  return d;
}
const verify = d => spawnSync('node', ['scripts/verify.mjs'], { cwd: d, encoding: 'utf8' });

test('flags more secret formats', () => {
  const bad = ['sk_' + 'live_' + 'a'.repeat(24), 'github_' + 'pat_' + 'a'.repeat(30), 'whsec_' + 'a'.repeat(24),
    're_' + 'a'.repeat(24), 'eyJ' + 'a'.repeat(12) + '.eyJ' + 'a'.repeat(12) + '.' + 'a'.repeat(12),
    'manjunathhrushikesh' + '@gmail.com', 'C:' + BS + 'Users' + BS + 'hrush', 'D:' + BS + 'Athi 360', 'D:/Athi 360'];
  for (const t of bad) assert.ok(scanText('x.md', t).length > 0, t.slice(0, 20));
});

test('CRLF checkout does not count as drift', () => {
  const d = copyRepo();
  for (const f of ['README.md', 'COMPANY.md', 'status/STATUS.md']) writeFileSync(join(d, f), readFileSync(join(d, f), 'utf8').replace(/\n/g, '\r\n'));
  assert.equal(verify(d).status, 0, verify(d).stderr);
  rmSync(d, { recursive: true, force: true });
});

test('secret in scripts/ is caught', () => {
  const d = copyRepo(); appendFileSync(join(d, 'scripts', 'build.mjs'), '\n// ' + 'AKIA' + 'ABCDEFGHIJKLMNOP\n');
  assert.equal(verify(d).status, 1); rmSync(d, { recursive: true, force: true });
});

test('secret in a .toml file is caught', () => {
  const d = copyRepo(); writeFileSync(join(d, 'wrangler.toml'), 'token = "' + 'sk_' + 'live_' + 'a'.repeat(24) + '"\n');
  assert.equal(verify(d).status, 1); rmSync(d, { recursive: true, force: true });
});

test('gitignored file is not flagged when scanning a git tree', () => {
  const d = copyRepo(); const g = a => spawnSync('git', a, { cwd: d });
  g(['init', '-q']); writeFileSync(join(d, '.env'), 'X=1\n'); g(['add', '-A']);
  assert.equal(verify(d).status, 0, verify(d).stderr); rmSync(d, { recursive: true, force: true });
});

const base = () => structuredClone(loadRegistry(new URL('../data/projects.json', import.meta.url)));
test('siteUrl must be https', () => {
  for (const u of ['TODO', 'x', 'http://a.com']) { const r = base(); r.projects[0].siteUrl = u; assert.ok(validateRegistry(r).some(e => /siteUrl/.test(e)), u); }
});
test('company block is required', () => {
  for (const f of ['name', 'number', 'office', 'incorporated', 'jurisdiction', 'line']) { const r = base(); delete r.company[f]; assert.ok(validateRegistry(r).some(e => e.includes('company.' + f)), f); }
  const r = base(); r.company.sic = []; assert.ok(validateRegistry(r).some(e => /sic/.test(e)));
  assert.ok(validateRegistry({ company: base().company }).some(e => /projects/.test(e)));
});
test('ConsumerSuit avoids filing-ready framing', () => {
  const c = base().projects.find(p => p.slug === 'consumersuit'); assert.doesNotMatch(c.today, /ready to send|filing/i);
});
