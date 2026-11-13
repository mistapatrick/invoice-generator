import { cp, mkdir, rm, access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = ['index.html', 'app.js', 'core.js', 'styles.css', 'manifest.webmanifest', 'sw.js', 'icon.svg'];
for (const file of required) await access(path.join(root, file));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
for (const file of ['app.js', 'styles.css', 'manifest.webmanifest', 'icon.svg']) {
  if (!html.includes(file)) throw new Error(`index.html does not reference ${file}`);
}
const app = await readFile(path.join(root, 'app.js'), 'utf8');
if (!app.includes("from './core.js'")) throw new Error('app.js does not import core.js');
for (const file of ['app.js', 'core.js', 'sw.js']) {
  const syntax = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  if (syntax.status !== 0) throw new Error(syntax.stderr || `${file} syntax check failed`);
}
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of required) await cp(path.join(root, file), path.join(output, file));
console.log(`Invoice Gen build completed. Copied ${required.length} application files to dist/.`);
