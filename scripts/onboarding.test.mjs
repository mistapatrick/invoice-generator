import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const app = await readFile(new URL('app.js', root), 'utf8');
const sw = await readFile(new URL('sw.js', root), 'utf8');

test('first-run setup is ordered language and currency before business profile', () => {
  const pref = html.indexOf('id="internationalSettingsCard"');
  const profile = html.indexOf('id="profileForm"');
  assert.ok(pref > -1 && profile > pref, 'preferences card must precede business profile form');
  assert.match(html, /WELCOME TO INVOICE GEN/);
  assert.match(html, /id="setupPreferenceStep"/);
  assert.match(html, /id="setupBusinessStep"/);
});

test('new users land in setup and cannot open document creation before completing both steps', () => {
  assert.match(app, /if\(!setupComplete\(\)\)setView\('settings'\)/);
  assert.match(app, /function setupComplete\(\)\{return Boolean\(state\.settings\.preferencesConfigured&&state\.settings\.profileConfigured\);\}/);
  assert.match(app, /if\(name==='create'&&!setupComplete\(\)\)/);
});

test('preferences must be saved before business profile can be completed', () => {
  assert.match(app, /function savePreferences\(\)[^]*?preferencesConfigured:true/);
  assert.match(app, /function saveProfile\(event\)[^]*?if\(!state\.settings\.preferencesConfigured\)/);
  assert.match(app, /profileConfigured:true/);
});

test('returning users with an existing business profile are not forced through onboarding', () => {
  assert.match(app, /if\(state\.profile\.businessName&&!state\.settings\.profileConfigured\)\{state\.settings=\{\.\.\.state\.settings,preferencesConfigured:true,profileConfigured:true\}/);
});

test('service worker cache revision changes for the onboarding update', () => {
  assert.match(sw, /invoice-gen-static-v3\.0\.0-r3/);
});
