import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CONFIG } from '../config.js';
import { SECTIONS, KINKS, PHOTOS } from '../src/questions.js';
import { checkDealbreakers } from '../src/rules.js';
import { sunSign, compatibility, pairScore } from '../src/astro.js';
import { buildPayload, formatAnswer, toFormBody, send, isConfigured, payloadToText } from '../src/submit.js';
import { missingRequired } from '../src/ui.js';
import { existsSync } from 'node:fs';

const clean = { drinking: 'social', drugs: ['never'], married: 'never', kids: 'no', prenup: 'open', partners: 7 };

test('a clean gate passes', () => {
  assert.deepEqual(checkDealbreakers(clean, CONFIG.dealbreakers), { passed: true, reasons: [] });
});

test('each dealbreaker turns him away', () => {
  for (const [question, value] of [['drinking', 'heavy'], ['married', 'divorced'], ['married', 'separated'], ['married', 'married'], ['married', 'widowed'], ['kids', 'yes'], ['kids', 'expecting']]) {
    const verdict = checkDealbreakers({ ...clean, [question]: value }, CONFIG.dealbreakers);
    assert.equal(verdict.passed, false, `${question}=${value}`);
    assert.equal(verdict.reasons.length, 1);
  }
});

test('recorded-only answers never turn him away', () => {
  const answers = { ...clean, drugs: ['hard', 'weed-often'], prenup: 'no', partners: 300 };
  assert.equal(checkDealbreakers(answers, CONFIG.dealbreakers).passed, true);
});

test('several dealbreakers list every reason', () => {
  const verdict = checkDealbreakers({ ...clean, drinking: 'heavy', kids: 'yes' }, CONFIG.dealbreakers);
  assert.deepEqual(verdict.reasons, ['drinks heavily', 'has children']);
});

test('every dealbreaker rule points at a real option', () => {
  const truth = SECTIONS.find((s) => s.id === 'truth');
  for (const rule of CONFIG.dealbreakers) {
    const q = truth.questions.find((x) => x.id === rule.question);
    assert.ok(q, rule.question);
    for (const value of rule.values) assert.ok(q.options.some((o) => o.value === value), `${rule.question}:${value}`);
  }
});

test('sun signs, including cusps and the year wrap', () => {
  const cases = {
    '1993-07-30': 'Leo', '1990-01-01': 'Capricorn', '1990-01-19': 'Capricorn', '1990-01-20': 'Aquarius',
    '1990-03-20': 'Pisces', '1990-03-21': 'Aries', '1990-07-22': 'Cancer', '1990-07-23': 'Leo',
    '1990-12-21': 'Sagittarius', '1990-12-22': 'Capricorn', '1990-12-31': 'Capricorn', '1990-11-22': 'Sagittarius',
  };
  for (const [date, sign] of Object.entries(cases)) assert.equal(sunSign(date)?.name, sign, date);
  assert.equal(sunSign('1990-07-23').onCusp, true);
  assert.equal(sunSign('1990-08-05').onCusp, false);
  assert.equal(sunSign(''), null);
  assert.equal(sunSign('nonsense'), null);
});

test('compatibility uses only the signs he knows', () => {
  const hers = CONFIG.chart;
  const sunOnly = compatibility({ sun: 'Aries' }, hers);
  assert.equal(sunOnly.lines.length, 2);
  const full = compatibility({ sun: 'Aries', moon: 'Taurus', rising: 'Virgo' }, hers);
  assert.equal(full.lines.length, 4);
  assert.ok(full.score > 0 && full.score <= 100);
  assert.equal(pairScore('Leo', 'Aquarius'), 78);
  assert.equal(pairScore('Leo', 'Sagittarius'), 92);
  assert.equal(pairScore('Leo', 'Leo'), 86);
  assert.equal(pairScore('Leo', 'Nope'), null);
});

test('question ids are unique and photos exist', () => {
  const ids = SECTIONS.flatMap((s) => s.questions.map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const s of SECTIONS) assert.ok(PHOTOS[s.photo], s.id);
  for (const path of Object.values(PHOTOS)) assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), path);
  assert.ok(KINKS.flatMap(([, items]) => items).length >= 25);
});

test('every section except intro has a form field', () => {
  for (const s of SECTIONS) if (s.id !== 'intro') assert.ok(s.id in CONFIG.googleForm.fields, s.id);
});

test('answers format into readable text', () => {
  const truth = SECTIONS.find((s) => s.id === 'truth');
  const drugs = truth.questions.find((q) => q.id === 'drugs');
  assert.equal(formatAnswer(drugs, ['never']), 'Never touched anything');
  const desire = SECTIONS.find((s) => s.id === 'desire');
  const kinks = desire.questions.find((q) => q.id === 'kinks');
  assert.equal(formatAnswer(kinks, { Blindfolds: 'yes', Mirrors: 'maybe', Spanking: 'yes' }), 'Yes: Blindfolds, Spanking\nMaybe: Mirrors');
  assert.equal(formatAnswer({ type: 'scale', max: 5 }, 4), '4/5');
  assert.equal(formatAnswer({ type: 'list' }, ['brave', '', 'kind']), '1. brave; 2. kind');
  assert.equal(formatAnswer({ type: 'text' }, ''), '');
});

test('payload has identity, verdict and one block per trial', () => {
  const answers = { ...clean, name: 'Arjun', contact: '@arjun', age: 34, city: 'Orlando', fiveWords: 'loyal, funny, tall, calm, driven' };
  const payload = buildPayload(SECTIONS, answers, { passed: true, reasons: [] }, { stars: ['Sun sign (from birth date): Leo'] });
  assert.equal(payload.verdict, 'Passed the gate');
  assert.equal(payload.age, '34');
  assert.match(payload.truth, /How many women have you slept with\? 7/);
  assert.match(payload.fire, /Describe yourself in five words\. loyal/);
  assert.match(payload.stars, /^Sun sign/);
  assert.equal(payload.memory, '');
  const text = payloadToText(SECTIONS, payload);
  assert.match(text, /== The Gate of Truth ==/);
  assert.doesNotMatch(text, /== The Trial of Memory ==/);
  const turned = buildPayload(SECTIONS, answers, { passed: false, reasons: ['has children'] });
  assert.equal(turned.verdict, 'Turned away: has children');
});

test('form body maps fields to entry ids and skips unmapped ones', () => {
  const body = toFormBody({ name: 'Arjun', verdict: 'Passed the gate', fire: 'x' }, { name: 'entry.111', verdict: '222', fire: '' });
  assert.equal(body.get('entry.111'), 'Arjun');
  assert.equal(body.get('entry.222'), 'Passed the gate');
  assert.equal([...body.keys()].length, 2);
});

test('send is demo mode until the form is configured', async () => {
  assert.equal(isConfigured(CONFIG.googleForm), false);
  assert.deepEqual(await send({}, CONFIG.googleForm, () => assert.fail('no fetch in demo')), { sent: false, demo: true });
  const calls = [];
  const form = { formId: 'abc', fields: { name: 'entry.1' } };
  const ok = await send({ name: 'Arjun' }, form, async (url, init) => { calls.push([url, init]); return {}; });
  assert.deepEqual(ok, { sent: true });
  assert.equal(calls[0][0], 'https://docs.google.com/forms/d/e/abc/formResponse');
  assert.equal(calls[0][1].mode, 'no-cors');
  const failed = await send({ name: 'Arjun' }, form, async () => { throw new Error('offline'); });
  assert.equal(failed.sent, false);
});

test('required answers are enforced', () => {
  const intro = SECTIONS.find((s) => s.id === 'intro');
  assert.deepEqual(missingRequired(intro, {}), ['name', 'age', 'contact']);
  assert.deepEqual(missingRequired(intro, { name: 'A', age: 17, contact: 'x' }), ['age']);
  assert.deepEqual(missingRequired(intro, { name: 'A', age: 30, contact: 'x' }), []);
  const truth = SECTIONS.find((s) => s.id === 'truth');
  assert.ok(missingRequired(truth, { ...clean, drugs: [] }).includes('drugs'));
  assert.deepEqual(missingRequired(truth, { ...clean, partners: 0 }), []);
});
