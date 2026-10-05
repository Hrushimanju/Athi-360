import { readFileSync } from 'node:fs';
export const STATUSES = ['live','in-development','in-design'];
export const loadRegistry = p => JSON.parse(readFileSync(p,'utf8'));
export function validateRegistry(reg){
  const errs=[]; const seen=new Set(); const c = reg.company || {};
  for (const f of ['name','number','jurisdiction','type','incorporated','office','source','line']) if (!c[f]) errs.push(`company.${f} missing`);
  if (!Array.isArray(c.sic) || !c.sic.length) errs.push('company.sic missing');
  if (!Array.isArray(reg.projects) || !reg.projects.length) errs.push('projects missing');
  for(const p of reg.projects||[]){
    if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug||'')) errs.push(`slug invalid: ${p.slug}`);
    if(seen.has(p.slug)) errs.push(`duplicate slug: ${p.slug}`); seen.add(p.slug);
    if(!STATUSES.includes(p.status)) errs.push(`status invalid for ${p.slug}: ${p.status}`);
    if(p.status==='live' && !p.siteUrl) errs.push(`siteUrl required for live project ${p.slug}`);
    if(p.siteUrl && !/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(p.siteUrl)) errs.push(`siteUrl must be an https URL for ${p.slug}: ${p.siteUrl}`);
    for(const f of ['name','problem','audience','today','future']) if(!p[f]) errs.push(`${f} missing for ${p.slug}`);
  }
  return errs;
}
