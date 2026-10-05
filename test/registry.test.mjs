import test from 'node:test'; import assert from 'node:assert/strict';
import { validateRegistry, loadRegistry } from '../scripts/registry.mjs';
const ok = { company:{name:'ATHI 360 LTD',number:'17401160',jurisdiction:'England and Wales',type:'Private limited company',incorporated:'14 August 2026',office:'London',source:'Companies House',line:'l',sic:['62012']}, projects:[{slug:'kathaa',name:'Kathaa 360',status:'in-development',siteUrl:null,problem:'p',audience:'a',today:'t',future:'f',ownDomain:false}] };
test('valid registry passes', () => assert.deepEqual(validateRegistry(ok), []));
test('live without siteUrl fails', () => { const r=structuredClone(ok); r.projects[0].status='live'; assert.ok(validateRegistry(r).some(e=>/siteUrl/.test(e))); });
test('path-like slug rejected', () => { const r=structuredClone(ok); r.projects[0].slug='../x'; assert.ok(validateRegistry(r).some(e=>/slug/.test(e))); });
test('bad status rejected', () => { const r=structuredClone(ok); r.projects[0].status='launched'; assert.ok(validateRegistry(r).some(e=>/status/.test(e))); });
test('duplicate slug rejected', () => { const r=structuredClone(ok); r.projects.push(structuredClone(r.projects[0])); assert.ok(validateRegistry(r).some(e=>/duplicate/.test(e))); });
test('real registry is valid', () => assert.deepEqual(validateRegistry(loadRegistry(new URL('../data/projects.json', import.meta.url))), []));
