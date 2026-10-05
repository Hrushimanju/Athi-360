// Banned words are assembled from fragments so this file never spells them out.
const W = (...p) => p.join('');
const TEXT_RULES = [
  [new RegExp('(^|[^a-z])' + W('shi', 'eld'), 'i'), 'forbidden claim'],
  [new RegExp(W('ton', 'y') + '.{1,3}' + W('sta', 'rk'), 'i'), 'forbidden claim'],
  [new RegExp(W('defe', 'n') + '[cs]e|' + W('milit', 'ary') + '|' + W('miss', 'ile'), 'i'), 'forbidden claim'],
  [/AKIA[0-9A-Z]{16}/, 'AWS key'], [/\bsk[-_][A-Za-z0-9_-]{20,}/, 'API key (sk-/sk_)'], [/gh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/github_pat_[A-Za-z0-9_]{20,}/, 'GitHub fine-grained token'], [/whsec_[A-Za-z0-9]{16,}/, 'webhook secret'],
  [/\bre_[A-Za-z0-9]{20,}/, 'Resend key'], [/eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/, 'JWT'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google key'], [/-----BEGIN [A-Z ]*PRIVATE KEY/, 'private key'],
  [/manjunathhrushikesh@/i, 'personal email'],
  [/[A-Za-z]:[/\x5c]Users[/\x5c]/, 'local user path'], [/\b[A-Z]:[/\x5c][A-Za-z]/, 'local drive path'],
  [/\.dev\.vars/i, 'references .dev.vars'], [/FOUNDER_(JOURNAL|DECISIONS)/i, 'references founder journal']
];
export function scanText(path, text){
  return TEXT_RULES.filter(([re]) => re.test(text)).map(([,why]) => `${path}: ${why}`);
}
const PATH_RULES = [[/(^|\/)node_modules(\/|$)/,'node_modules'],[/(^|\/)\.env/,'.env file'],[/\.map$/,'source map'],[/journal/i,'journal file'],[/\.dev\.vars/,'.dev.vars'],[/(^|\/)\.wrangler(\/|$)/,'.wrangler cache']];
export function scanPath(rel){
  return PATH_RULES.filter(([re]) => re.test(rel)).map(([,why]) => `${rel}: forbidden path (${why})`);
}
