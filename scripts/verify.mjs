import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRegistry, validateRegistry } from './registry.mjs';
import { renderAll } from './render.mjs';
import { scanText, scanPath } from './leakscan.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BS = String.fromCharCode(92);
const norm = s => s.split(BS).join('/');
const lf = s => s.replace(/\r\n/g, '\n');
// Only these files hold the rules/fixtures themselves, so they are exempt from the TEXT rules (path rules still apply).
const TEXT_EXEMPT = new Set(['scripts/leakscan.mjs', 'test/leakscan.test.mjs', 'test/gate.test.mjs']);

// Scan what git would publish (tracked + untracked-but-not-ignored); fall back to a disk walk outside a repo.
function listFiles(){
  try {
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim();
    if (resolve(top) === resolve(root)) {
      const out = execFileSync('git', ['ls-files', '-z', '-c', '-o', '--exclude-standard'], { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] });
      return out.split('\0').filter(Boolean).filter(r => existsSync(join(root, r)));
    }
  } catch {}
  const walk = d => readdirSync(d).flatMap(n => { const p = join(d, n); if (n === '.git' || n === 'node_modules') return []; const s = statSync(p); return s.isDirectory() ? walk(p) : [norm(relative(root, p))]; });
  return walk(root);
}

const problems = [];
const reg = loadRegistry(join(root,'data','projects.json'));
problems.push(...validateRegistry(reg));
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
const gen = renderAll(reg);
for (const [rel, text] of gen) {
  const f = join(root, rel);
  if (!existsSync(f)) problems.push(`${rel}: missing (run npm run build)`);
  else if (lf(readFileSync(f,'utf8')) !== text) problems.push(`${rel}: drifted from registry (hand-edited?)`);
}
const OWNED = [/^projects\//, /^status\/(STATUS\.md|incidents\/|maintenance\/)/];
for (const rel of listFiles()) {
  problems.push(...scanPath(rel));
  if (OWNED.some(re => re.test(rel)) && !gen.has(rel) && !/^status\/(incidents|maintenance)\//.test(rel)) problems.push(`${rel}: not generated from registry`);
  if (TEXT_EXEMPT.has(rel)) continue;
  const buf = readFileSync(join(root, rel));
  if (buf.includes(0)) continue; // binary release artifact: path rules only
  problems.push(...scanText(rel, buf.toString('utf8')));
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('verify ok:', gen.size, 'generated files, no drift, no leaks');
