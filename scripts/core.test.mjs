import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAmounts, addCalendarDays, generateDocumentNumber, formatCurrency } from '../core.js';

test('calculates subtotal, capped discount, tax and additional charge', () => {
  const result = calculateAmounts([
    { description: 'Design', quantity: 2, unitPrice: 15000 },
    { description: 'Hosting', quantity: 1, unitPrice: 5000 }
  ], 5000, 7.5, 1000);
  assert.equal(result.subtotal, 35000);
  assert.equal(result.discount, 5000);
  assert.equal(result.tax, 2250);
  assert.equal(result.total, 33250);
});

test('does not allow a discount above subtotal to create a negative total', () => {
  const result = calculateAmounts([{ description: 'Work', quantity: 1, unitPrice: 1000 }], 2000, 7.5, 0);
  assert.equal(result.discount, 1000);
  assert.equal(result.total, 0);
});

test('adds 30 calendar days across a month boundary', () => {
  assert.equal(addCalendarDays('2026-11-09', 30), '2026-12-09');
});

test('adds calendar days correctly across a leap day', () => {
  assert.equal(addCalendarDays('2028-02-01', 30), '2028-03-02');
});

test('rejects an invalid date', () => {
  assert.throws(() => addCalendarDays('2026-02-30', 30), /Invalid calendar date/);
});

test('generates sequential document numbers by type and year', () => {
  const docs = [
    { type: 'invoice', issueDate: '2026-02-01', number: 'INV-2026-0003' },
    { type: 'invoice', issueDate: '2025-02-01', number: 'INV-2025-0012' },
    { type: 'receipt', issueDate: '2026-02-01', number: 'RCT-2026-0008' }
  ];
  assert.equal(generateDocumentNumber('invoice', '2026-11-09', docs), 'INV-2026-0004');
  assert.equal(generateDocumentNumber('proforma', '2026-11-09', docs), 'PFI-2026-0001');
  assert.equal(generateDocumentNumber('receipt', '2026-11-09', docs), 'RCT-2026-0009');
});

test('formats Nigerian naira', () => {
  assert.match(formatCurrency(12500, 'NGN', 'en-NG'), /12,500\.00/);
  assert.match(formatCurrency(12500, 'USD', 'en-US'), /12,500\.00/);
  assert.match(formatCurrency(12500, 'EUR', 'fr-FR'), /12/);
});

test('application confirmation handler replaces rather than accumulates callbacks', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(source, /function confirmAction\([^]*?proceed\.onclick=\(\)=>\{proceed\.onclick=null;callback\(\);\};dialog\.showModal\(\);\}/);
  assert.doesNotMatch(source, /proceed\.addEventListener\('click',handler/);
});

test('document sharing actions are wired and explicitly ask users to attach saved PDFs', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(source, /shareWhatsApp/);
  assert.match(source, /emailDocument/);
  assert.match(source, /attach the PDF copy after saving it/i);
});

test('release includes the requested feedback destinations and browser-permission explanation', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /wa\.me\/2349053903530/);
  assert.match(html, /mailto:viborg\.outsourcing@gmail\.com/);
  assert.match(html, /cannot override phone or browser permissions/i);
});

test('invoice preview exposes calendar action only through invoice due-date logic', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(html, /id="addCalendarEvent"/);
  assert.match(app, /doc\.type==='invoice'&&Boolean\(doc\.dueDate\)/);
  assert.match(app, /BEGIN:VCALENDAR/);
  assert.match(app, /TRIGGER:-P1D/);
});

test('PDF print title uses Invoice_Gen-DD-MM-YYYY-HH-MM and restores page title', async () => {
  const { readFile } = await import('node:fs/promises');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(app, /Invoice_Gen-\$\{pad\(now\.getDate\(\)\)\}-\$\{pad\(now\.getMonth\(\)\+1\)\}-\$\{now\.getFullYear\(\)\}-\$\{pad\(now\.getHours\(\)\)\}-\$\{pad\(now\.getMinutes\(\)\)\}/);
  assert.match(app, /window\.print\(\)/);
  assert.match(app, /document\.title=previousTitle/);
});

test('service worker caches core.js and uses a new versioned cache', async () => {
  const { readFile } = await import('node:fs/promises');
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(sw, /invoice-gen-static-v3\.0\.0-r3/);
  assert.match(sw, /'\/core\.js'/);
  assert.match(sw, /self\.clients\.claim\(\)/);
});


test('formats all supported international currencies', () => {
  for (const code of ['NGN','XOF','GHS','USD','CAD','GBP','EUR','MXN','BRL','AED','AUD','INR']) {
    const result = formatCurrency(1234.5, code, 'en');
    assert.ok(result.length > 0, `Expected a formatted value for ${code}`);
  }
});

test('international release exposes five languages, twelve currencies and six structural themes', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  for (const language of ['en','fr','es','pt','ar']) assert.match(html, new RegExp(`value="${language}"`));
  for (const currency of ['NGN','XOF','GHS','USD','CAD','GBP','EUR','MXN','BRL','AED','AUD','INR']) assert.match(html, new RegExp(`value="${currency}"`));
  for (const theme of ['corporate','minimal','executive','creative','ledger','editorial']) assert.match(html, new RegExp(`value="${theme}"`));
  assert.match(app, /currency:currentCurrency\(\),language:state\.settings\.language/);
  assert.match(app, /invoice-gen-data-v2/);
});
