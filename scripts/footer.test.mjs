import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const distHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

test('Business Labs attribution footer is present in the application shell and production build', () => {
  for (const source of [html, distHtml]) {
    assert.match(source, /Powered by\s*<strong>Business Labs Software and Technology<\/strong>/);
    assert.match(source, /href="https:\/\/wa\.me\/2349053903530"/);
    assert.match(source, /href="mailto:businesslabs\.tech@gmail\.com"/);
    assert.match(source, /aria-label="Contact Business Labs Software and Technology on WhatsApp"/);
    assert.match(source, /aria-label="Email Business Labs Software and Technology"/);
  }
});

test('footer is responsive, accessible by keyboard, and omitted from printed customer PDFs', () => {
  assert.match(css, /\.app-footer\{/);
  assert.match(css, /\.footer-contact:focus-visible/);
  assert.match(css, /@media\(max-width:760px\)\{\.app-footer/);
  assert.match(css, /@media print\{\.app-footer\{display:none!important\}/);
});
