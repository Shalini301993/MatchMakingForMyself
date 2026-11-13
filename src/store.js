// Private storage for offerings, on a Supabase project (Postgres + auth).
// Anyone may ADD an offering; only Shalini, signed in, may read, star or delete them.
// That rule lives in the database itself (row-level security, see supabase/setup.sql),
// so the public key in config.js cannot be used to read anything.

const TABLE = 'offerings';

export function storageConfigured(cfg) {
  return Boolean(cfg?.url && cfg?.anonKey);
}

const base = (cfg) => cfg.url.replace(/\/+$/, '');

async function failure(res, fallback) {
  let detail = '';
  try {
    const body = await res.json();
    detail = body.error_description || body.msg || body.message || body.error || '';
  } catch { /* not JSON */ }
  return new Error(detail ? `${fallback}: ${detail}` : `${fallback} (${res.status})`);
}

/** One row for the offerings table. */
export function buildRow(payload, answers, scroll) {
  const sections = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!['verdict', 'name', 'contact', 'age', 'city'].includes(key)) sections[key] = value;
  }
  return {
    verdict: payload.verdict,
    passed: payload.verdict === 'Passed the gate',
    name: payload.name || null,
    contact: payload.contact || null,
    age: payload.age || null,
    city: payload.city || null,
    sections,
    answers,
    scroll,
  };
}

/** Saves an offering with the public key. Resolves { sent: true } or throws. */
export async function saveOffering(cfg, row, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(`${base(cfg)}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw await failure(res, 'The offering was not saved');
  return { sent: true };
}

function toSession(body) {
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000,
    email: body.user?.email ?? null,
  };
}

/** Email + password sign-in. Resolves a session or throws with Supabase's reason. */
export async function signIn(cfg, email, password, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(`${base(cfg)}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await failure(res, 'Sign-in failed');
  return toSession(await res.json());
}

export async function refreshSession(cfg, session, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(`${base(cfg)}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  if (!res.ok) throw await failure(res, 'Your session expired');
  return { ...toSession(await res.json()), email: session.email };
}

const authed = (cfg, session, extra = {}) => ({
  apikey: cfg.anonKey,
  Authorization: `Bearer ${session.accessToken}`,
  ...extra,
});

export async function listOfferings(cfg, session, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(`${base(cfg)}/rest/v1/${TABLE}?select=*&order=created_at.desc`, {
    headers: authed(cfg, session),
  });
  if (!res.ok) throw await failure(res, 'Could not load offerings');
  return res.json();
}

export async function updateOffering(cfg, session, id, patch, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(`${base(cfg)}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authed(cfg, session, { 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw await failure(res, 'Could not update');
}

export async function deleteOffering(cfg, session, id, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(`${base(cfg)}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authed(cfg, session, { Prefer: 'return=minimal' }),
  });
  if (!res.ok) throw await failure(res, 'Could not delete');
}
