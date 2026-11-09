import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const js = await readFile(path.join(root, 'app.js'), 'utf8');
const selectors = [...js.matchAll(/\$\('#([A-Za-z][\w-]*)'\)/g)].map(m => m[1]);
const missing = [...new Set(selectors.filter(id => !ids.has(id)))];
if (missing.length) throw new Error(`Missing HTML element IDs: ${missing.join(', ')}`);
for (const file of ['app.js','core.js','sw.js']) {
  const syntax = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  if (syntax.status !== 0) throw new Error(syntax.stderr || `${file} syntax check failed`);
}
for (const f of ['core.js','styles.css','manifest.webmanifest','sw.js','icon.svg','vercel.json']) await access(path.join(root,f));
console.log(`Checks passed: ${ids.size} HTML IDs found; all ${new Set(selectors).size} statically referenced IDs exist; JavaScript parses; required assets exist.`);
