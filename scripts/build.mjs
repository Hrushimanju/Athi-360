import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRegistry, validateRegistry } from './registry.mjs';
import { renderAll } from './render.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reg = loadRegistry(join(root,'data','projects.json'));
const errs = validateRegistry(reg);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
for (const [rel, text] of renderAll(reg)) { const f = join(root, rel); mkdirSync(dirname(f), {recursive:true}); writeFileSync(f, text); }
console.log('built', renderAll(reg).size, 'files');
