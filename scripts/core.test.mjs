import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAmounts, addCalendarDays, generateDocumentNumber, formatNaira } from '../core.js';

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
  assert.match(formatNaira(12500), /12,500\.00/);
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
