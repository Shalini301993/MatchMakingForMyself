// The goddess's private inbox: sign in, then read, star, download or delete offerings.

import { CONFIG } from '../config.js';
import { SECTIONS, PHOTOS } from './questions.js';
import { el } from './ui.js';
import {
  storageConfigured, signIn, refreshSession, listOfferings, updateOffering, deleteOffering,
} from './store.js';

const SESSION_KEY = 'goddess-inbox-session';
const root = document.getElementById('inbox');
const cfg = CONFIG.storage;
const TITLES = Object.fromEntries(SECTIONS.map((s) => [s.id, s.title]));
const ORDER = SECTIONS.map((s) => s.id).filter((id) => id !== 'intro');

let session = loadSession();
let rows = [];
let filter = 'all';
let query = '';
let openId = null;

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function saveSession(value) {
  session = value;
  try {
    if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* private mode: stays signed in for this tab only */ }
}

async function freshSession() {
  if (!session) return null;
  if (session.expiresAt - Date.now() > 60_000) return session;
  try {
    saveSession(await refreshSession(cfg, session));
    return session;
  } catch {
    saveSession(null);
    return null;
  }
}

function shell(...children) {
  root.replaceChildren(el('div', { class: 'inbox-shell' },
    el('header', { class: 'top' },
      el('img', { class: 'watcher', src: PHOTOS['goddess-sunlit'], alt: '' }),
      el('span', { class: 'brand', text: 'The goddess’s inbox' }),
      session ? el('button', { class: 'linkish', type: 'button', text: 'Sign out', onclick: signOut }) : null),
    children));
}

function signOut() {
  saveSession(null);
  rows = [];
  openId = null;
  renderLogin();
}

/* ---------- Not set up / sign in ---------- */

function renderSetup() {
  shell(el('section', { class: 'trial-main inbox-card' },
    el('p', { class: 'kicker', text: 'Private inbox' }),
    el('h1', { text: 'Not connected yet' }),
    el('p', { class: 'lead', text: 'Offerings are not being stored yet. Connect a free Supabase project (README → "Private inbox"), then put its URL and key in config.js.' })));
}

function renderLogin(message = '') {
  const email = el('input', { type: 'email', id: 'in-email', autocomplete: 'username', required: true });
  const password = el('input', { type: 'password', id: 'in-password', autocomplete: 'current-password', required: true });
  const error = el('p', { class: 'error', role: 'alert', text: message });
  const button = el('button', { class: 'btn primary', type: 'submit', text: 'Enter' });
  const form = el('form', { class: 'questions' },
    el('div', { class: 'q' }, el('label', { for: 'in-email', text: 'Email' }), email),
    el('div', { class: 'q' }, el('label', { for: 'in-password', text: 'Password' }), password),
    error,
    el('div', { class: 'actions' }, button));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    button.textContent = 'Opening…';
    try {
      saveSession(await signIn(cfg, email.value.trim(), password.value));
      await load();
    } catch (err) {
      error.textContent = err.message;
      button.disabled = false;
      button.textContent = 'Enter';
    }
  });
  shell(el('section', { class: 'trial-main inbox-card' },
    el('p', { class: 'kicker', text: 'Private inbox' }),
    el('h1', { tabindex: '-1', text: 'Only for the goddess' }),
    el('p', { class: 'lead', text: 'Sign in to read the offerings.' }),
    form));
  email.focus();
}

/* ---------- Inbox ---------- */

async function load() {
  shell(el('p', { class: 'lead inbox-loading', text: 'Gathering offerings…' }));
  const live = await freshSession();
  if (!live) return renderLogin('Please sign in again.');
  try {
    rows = await listOfferings(cfg, live);
    renderInbox();
  } catch (err) {
    shell(el('section', { class: 'trial-main inbox-card' },
      el('h1', { text: 'Could not open the inbox' }),
      el('p', { class: 'error', text: err.message }),
      el('div', { class: 'actions' }, el('button', { class: 'btn ghost', type: 'button', text: 'Try again', onclick: load }))));
  }
}

const counts = () => ({
  all: rows.length,
  worthy: rows.filter((r) => r.passed).length,
  away: rows.filter((r) => !r.passed).length,
  starred: rows.filter((r) => r.starred).length,
});

function visible() {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (filter === 'worthy' && !r.passed) return false;
    if (filter === 'away' && r.passed) return false;
    if (filter === 'starred' && !r.starred) return false;
    if (!q) return true;
    return [r.name, r.city, r.contact, r.scroll].some((v) => (v ?? '').toLowerCase().includes(q));
  });
}

const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function cosmic(row) {
  const match = /Compatibility with [^:]+: (\d+)%/.exec(row.sections?.stars ?? '');
  return match ? `${match[1]}% cosmic` : null;
}

function renderInbox() {
  const c = counts();
  const tabs = el('div', { class: 'pill-row inbox-tabs', role: 'tablist' },
    [['all', 'All'], ['worthy', 'Worthy'], ['away', 'Turned away'], ['starred', 'Starred']].map(([key, label]) => el('button', {
      type: 'button', role: 'tab', class: `tab ${filter === key ? 'on' : ''}`, 'aria-selected': filter === key ? 'true' : 'false',
      onclick: () => { filter = key; renderInbox(); },
    }, label, el('span', { class: 'count', text: String(c[key]) }))));

  const search = el('input', { type: 'search', placeholder: 'Search names, cities, answers…', 'aria-label': 'Search offerings', value: query });
  search.addEventListener('input', () => { query = search.value; renderList(listBox); });

  const listBox = el('div', { class: 'inbox-list' });
  const detail = el('div', { class: 'inbox-detail' });

  shell(
    el('div', { class: 'inbox-toolbar' },
      el('h1', { tabindex: '-1', text: 'Offerings' }),
      el('button', { class: 'btn ghost', type: 'button', text: 'Refresh', onclick: load })),
    tabs,
    search,
    el('div', { class: `inbox-body ${openId ? 'reading' : ''}` }, listBox, detail),
  );
  renderList(listBox);
  renderDetail(detail);
}

function renderList(box) {
  const items = visible();
  if (!rows.length) {
    box.replaceChildren(el('p', { class: 'empty', text: 'No offerings yet. When a man finishes the quest, he appears here.' }));
    return;
  }
  if (!items.length) {
    box.replaceChildren(el('p', { class: 'empty', text: 'Nothing matches.' }));
    return;
  }
  box.replaceChildren(el('ul', { class: 'offer-list' }, items.map((r) => el('li', {},
    el('button', {
      type: 'button',
      class: `offer-item ${r.id === openId ? 'on' : ''}`,
      onclick: () => { openId = r.id; renderInbox(); },
    },
    el('span', { class: 'offer-name' }, r.starred ? '★ ' : '', r.name || 'Unnamed seeker'),
    el('span', { class: 'offer-meta', text: [r.age, r.city].filter(Boolean).join(' · ') }),
    el('span', { class: 'offer-foot' },
      el('span', { class: `chip ${r.passed ? 'yes' : 'no'}`, text: r.passed ? 'Worthy' : 'Turned away' }),
      cosmic(r) ? el('span', { class: 'chip', text: cosmic(r) }) : null,
      el('span', { class: 'offer-date', text: when(r.created_at) })))))));
}

function renderDetail(box) {
  const r = rows.find((x) => x.id === openId);
  if (!r) {
    box.replaceChildren(el('p', { class: 'empty', text: 'Choose an offering to read it.' }));
    return;
  }
  const star = el('button', {
    class: 'btn ghost', type: 'button', text: r.starred ? '★ Starred' : '☆ Star',
    onclick: async () => {
      star.disabled = true;
      try {
        await updateOffering(cfg, await freshSession(), r.id, { starred: !r.starred });
        r.starred = !r.starred;
        renderInbox();
      } catch (err) { alert(err.message); star.disabled = false; }
    },
  });
  const download = el('a', {
    class: 'btn ghost',
    download: `offering-${(r.name || 'seeker').replace(/[^\w-]+/g, '-').toLowerCase()}.txt`,
    href: `data:text/plain;charset=utf-8,${encodeURIComponent(r.scroll ?? '')}`,
    text: 'Download',
  });
  const remove = el('button', {
    class: 'btn ghost danger', type: 'button', text: 'Delete',
    onclick: async () => {
      if (!confirm(`Delete ${r.name || 'this'} offering for good?`)) return;
      try {
        await deleteOffering(cfg, await freshSession(), r.id);
        rows = rows.filter((x) => x.id !== r.id);
        openId = null;
        renderInbox();
      } catch (err) { alert(err.message); }
    },
  });

  box.replaceChildren(el('article', { class: 'trial-main offer-read' },
    el('button', { class: 'linkish back', type: 'button', text: '← All offerings', onclick: () => { openId = null; renderInbox(); } }),
    el('p', { class: 'kicker', text: when(r.created_at) }),
    el('h2', { class: 'offer-title', text: r.name || 'Unnamed seeker' }),
    el('p', { class: 'offer-meta' }, [r.age, r.city].filter(Boolean).join(' · '), r.contact ? ` · ${r.contact}` : ''),
    el('p', {}, el('span', { class: `chip ${r.passed ? 'yes' : 'no'}`, text: r.verdict })),
    el('div', { class: 'actions' }, star, download, remove),
    ORDER.filter((id) => r.sections?.[id]).map((id) => el('section', { class: 'offer-section' },
      el('h3', { text: TITLES[id] }),
      el('pre', { text: r.sections[id] }))),
  ));
}

if (!storageConfigured(cfg)) renderSetup();
else if (session) load();
else renderLogin();
