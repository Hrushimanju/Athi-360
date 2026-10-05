const label = s => ({ live:'Live', 'in-development':'In development', 'in-design':'In design' })[s];
const link = p => p.siteUrl ? `[${p.siteUrl.replace('https://','')}](${p.siteUrl})` : 'No public site yet';

export function renderAll(reg){
  const out = new Map(); const c = reg.company;
  out.set('README.md', [
    `# ${c.name}`, '', c.line, '',
    'This repository is our public record: where to get the latest version of each product, what changed, and the state of our services. The work itself lives in private repositories.', '',
    '## Our products', '',
    '| Product | Status | Where |', '|---|---|---|',
    ...reg.projects.map(p => `| [${p.name}](projects/${p.slug}/README.md) | ${label(p.status)} | ${link(p)} |`), '',
    '## Downloads', '',
    'Each product folder under `projects/` lists its latest version. Installable builds are attached to this repository\'s **Releases** page. Nothing has been released for download yet.', '',
    '## Service status', '',
    'Outages, maintenance and updates are recorded in [`status/`](status/STATUS.md). Entries are written by us and are never deleted.', '',
    `## Company`, '', `${c.name}, company number ${c.number}, registered in ${c.jurisdiction}. Registered office: ${c.office}. Full details: [COMPANY.md](COMPANY.md).`, ''
  ].join('\n'));
  out.set('COMPANY.md', [
    `# ${c.name}`, '',
    `- **Company number:** ${c.number}`, `- **Type:** ${c.type}`, `- **Registered in:** ${c.jurisdiction}`,
    `- **Incorporated:** ${c.incorporated}`, `- **Registered office:** ${c.office}`, '',
    '## Nature of business (SIC)', '', ...c.sic.map(s=>`- ${s}`), '', `Source: ${c.source}.`, ''
  ].join('\n'));
  out.set('status/STATUS.md', [
    '# Service status', '',
    'Written by us. Newest entries first in `incidents/` and `maintenance/`. This page is not automated.', '',
    '| Product | State | Notes |', '|---|---|---|',
    ...reg.projects.map(p => `| ${p.name} | ${label(p.status)} | No incidents recorded. |`), ''
  ].join('\n'));
  for(const p of reg.projects){
    const d = `projects/${p.slug}`;
    out.set(`${d}/README.md`, [
      `# ${p.name}`, '', `**Status:** ${label(p.status)}`, '',
      '## The problem', '', p.problem, '', '## Who it is for', '', p.audience, '',
      '## What it does today', '', p.today, '', '## What it could mean later', '', p.future, '',
      '## Links', '', `- Site: ${link(p)}`, '- [Changelog](CHANGELOG.md)', '- [Latest version data](latest.json)', ''
    ].join('\n'));
    out.set(`${d}/CHANGELOG.md`, `# ${p.name} — changelog\n\n## Unreleased\n\nNo public release yet.\n`);
    out.set(`${d}/latest.json`, JSON.stringify({ slug:p.slug, version:null, siteUrl:p.siteUrl, downloads:[] }, null, 2) + '\n');
  }
  return out;
}
