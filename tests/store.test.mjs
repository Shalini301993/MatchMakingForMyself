import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  storageConfigured, buildRow, saveOffering, signIn, refreshSession, listOfferings, updateOffering, deleteOffering,
} from '../src/store.js';
import { CONFIG } from '../config.js';

const cfg = { url: 'https://abc.supabase.co/', anonKey: 'pub-key' };
const reply = (status, body) => ({ ok: status < 300, status, json: async () => body });

function recorder(response) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => { calls.push({ url, ...init }); return response; };
  return { calls, fetchImpl };
}

test('storage is off until both url and key are set', () => {
  assert.equal(storageConfigured(CONFIG.storage), false);
  assert.equal(storageConfigured({ url: 'x' }), false);
  assert.equal(storageConfigured(cfg), true);
});

test('a row splits identity from the trial sections', () => {
  const row = buildRow({ verdict: 'Passed the gate', name: 'Arjun', contact: '@a', age: '34', city: '', truth: 't', fire: 'f' }, { name: 'Arjun' }, 'scroll');
  assert.deepEqual(row, {
    verdict: 'Passed the gate', passed: true, name: 'Arjun', contact: '@a', age: '34', city: null,
    sections: { truth: 't', fire: 'f' }, answers: { name: 'Arjun' }, scroll: 'scroll',
  });
  assert.equal(buildRow({ verdict: 'Turned away: x' }, {}, '').passed, false);
});

test('saving posts the row with only the public key', async () => {
  const { calls, fetchImpl } = recorder(reply(201, null));
  assert.deepEqual(await saveOffering(cfg, { name: 'A' }, fetchImpl), { sent: true });
  assert.equal(calls[0].url, 'https://abc.supabase.co/rest/v1/offerings');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].headers.apikey, 'pub-key');
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.equal(calls[0].headers.Prefer, 'return=minimal');
  assert.deepEqual(JSON.parse(calls[0].body), { name: 'A' });
});

test('a refused save throws with the reason', async () => {
  const { fetchImpl } = recorder(reply(401, { message: 'Invalid API key' }));
  await assert.rejects(saveOffering(cfg, {}, fetchImpl), /not saved: Invalid API key/);
});

test('sign-in returns a session; a bad password says why', async () => {
  const { calls, fetchImpl } = recorder(reply(200, { access_token: 'AT', refresh_token: 'RT', expires_in: 3600, user: { email: 'me@x' } }));
  const session = await signIn(cfg, 'me@x', 'pw', fetchImpl);
  assert.equal(calls[0].url, 'https://abc.supabase.co/auth/v1/token?grant_type=password');
  assert.deepEqual(JSON.parse(calls[0].body), { email: 'me@x', password: 'pw' });
  assert.equal(session.accessToken, 'AT');
  assert.ok(session.expiresAt > Date.now() + 3_500_000);
  const bad = recorder(reply(400, { error_description: 'Invalid login credentials' }));
  await assert.rejects(signIn(cfg, 'me@x', 'no', bad.fetchImpl), /Invalid login credentials/);
});

test('refresh keeps the email and swaps the tokens', async () => {
  const { calls, fetchImpl } = recorder(reply(200, { access_token: 'AT2', refresh_token: 'RT2', expires_in: 60 }));
  const next = await refreshSession(cfg, { refreshToken: 'RT', email: 'me@x' }, fetchImpl);
  assert.deepEqual(JSON.parse(calls[0].body), { refresh_token: 'RT' });
  assert.equal(next.accessToken, 'AT2');
  assert.equal(next.email, 'me@x');
});

test('reading, starring and deleting use her token', async () => {
  const session = { accessToken: 'AT' };
  const list = recorder(reply(200, [{ id: '1' }]));
  assert.deepEqual(await listOfferings(cfg, session, list.fetchImpl), [{ id: '1' }]);
  assert.equal(list.calls[0].url, 'https://abc.supabase.co/rest/v1/offerings?select=*&order=created_at.desc');
  assert.equal(list.calls[0].headers.Authorization, 'Bearer AT');

  const patch = recorder(reply(204, null));
  await updateOffering(cfg, session, 'a b', { starred: true }, patch.fetchImpl);
  assert.equal(patch.calls[0].url, 'https://abc.supabase.co/rest/v1/offerings?id=eq.a%20b');
  assert.equal(patch.calls[0].method, 'PATCH');

  const del = recorder(reply(204, null));
  await deleteOffering(cfg, session, '1', del.fetchImpl);
  assert.equal(del.calls[0].method, 'DELETE');

  const denied = recorder(reply(401, { message: 'JWT expired' }));
  await assert.rejects(listOfferings(cfg, session, denied.fetchImpl), /JWT expired/);
});
