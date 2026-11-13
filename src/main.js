// Worthy of the Goddess: the quest's flow from the temple gate to the offering.

import { CONFIG } from '../config.js';
import { SECTIONS, PHOTOS } from './questions.js';
import { checkDealbreakers } from './rules.js';
import { sunSign, compatibility } from './astro.js';
import { buildPayload, payloadToText, send, isConfigured } from './submit.js';
import { el, renderQuestion, missingRequired } from './ui.js';
import { createBackground } from './background.js';
import { createZodiac } from './zodiac.js';
import { STORY } from './story.js';
import { storageConfigured, saveOffering, buildRow } from './store.js';

const STORE_KEY = 'goddess-quest-v1';
const STEPS = ['gate', 'story', ...SECTIONS.map((s) => s.id), 'summary', 'end'];
const TRIALS = SECTIONS.filter((s) => s.id !== 'intro');
const MOODS = {
  gate: 'dawn', story: 'dawn', intro: 'dawn', truth: 'fire', fire: 'fire', stars: 'night', heart: 'rose',
  mirror: 'dawn', memory: 'rose', vow: 'fire', hearth: 'dawn', desire: 'desire', summary: 'dawn', end: 'dawn',
};
const GODDESS = CONFIG.goddessName;

const app = document.getElementById('app');
const bg = createBackground(document.getElementById('sky'));
let state = load() ?? fresh();
let zodiac = null;

function fresh() {
  return { step: 'gate', answers: {}, verdict: null, finished: false, result: null };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved && STEPS.includes(saved.step) ? saved : null;
  } catch {
    return null;
  }
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* private mode: fine */ }
}

function go(step, { focus = true } = {}) {
  state.step = step;
  save();
  render(focus);
}

function photo(name, alt, cls = 'arch') {
  return el('figure', { class: `photo ${cls}` }, el('img', { src: PHOTOS[name], alt }));
}

function mala(current) {
  const index = TRIALS.findIndex((s) => s.id === current);
  return el('ol', { class: 'mala', 'aria-label': `Trial ${index + 1} of ${TRIALS.length}` },
    TRIALS.map((s, i) => el('li', {
      class: i < index ? 'done' : i === index ? 'now' : '',
      title: s.title,
      'aria-current': i === index ? 'step' : null,
    })));
}

function header(current) {
  return el('header', { class: 'top' },
    el('img', { class: 'watcher', src: PHOTOS['goddess-sunlit'], alt: '' }),
    el('span', { class: 'brand', text: 'Worthy of the Goddess' }),
    current ? mala(current) : null);
}

function render(focus = true) {
  zodiac?.remove();
  zodiac = null;
  bg.setMood(MOODS[state.step]);
  app.replaceChildren();
  const step = state.step;
  if (step === 'gate') renderGate();
  else if (step === 'story') renderStory();
  else if (step === 'summary') renderSummary();
  else if (step === 'end') renderEnd();
  else {
    const section = SECTIONS.find((s) => s.id === step);
    if (section.gate) renderTruth(section);
    else renderSection(section);
  }
  if (focus) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    app.querySelector('h1')?.focus({ preventScroll: true });
  }
}

/* ---------- Temple gate ---------- */

function renderGate() {
  const resumable = Object.keys(state.answers).length > 0 && !state.finished;
  const begin = () => { bg.celebrate(); go('story'); };
  app.append(
    el('section', { class: 'gate' },
      el('div', { class: 'tarot', 'aria-hidden': 'true' },
        photo('goddess-city', '', 'card c1'),
        photo('goddess-sunlit', '', 'card c3'),
        photo('goddess-witch', '', 'card c2')),
      el('div', { class: 'gate-text' },
        el('p', { class: 'kicker', text: `A quest for one man, set by ${GODDESS}` }),
        el('h1', { tabindex: '-1' }, 'Worthy of the ', el('em', { text: 'Goddess' })),
        el('p', { class: 'lead', text: `She wears witch hats, speaks eight languages, and knows exactly what she wants. Nine trials stand between you and a date with ${GODDESS}. Answer honestly; the goddess can tell.` }),
        el('ul', { class: 'promises' },
          el('li', { text: 'About 20 minutes. Your progress is saved on this device.' }),
          el('li', { text: AUTO_SENDS ? `Your answers go privately to ${GODDESS}, and only she can read them.` : `Nothing is sent anywhere. At the end you send your answers to ${GODDESS} yourself.` }),
          el('li', { text: 'For men 18 and over. One trial is very personal.' })),
        state.finished
          ? el('p', { class: 'lead', text: 'You have already completed the quest. The goddess has your offering.' })
          : el('div', { class: 'actions' },
            el('button', { class: 'btn primary', type: 'button', onclick: begin, text: resumable ? 'Continue the trials' : 'Begin the trials' }),
            resumable ? el('button', {
              class: 'btn ghost', type: 'button', text: 'Start over',
              onclick: () => { state = fresh(); save(); render(); },
            }) : null))),
  );
  if (resumable) {
    // Resume at the first section with nothing answered yet.
    const firstOpen = SECTIONS.find((s) => !s.questions.some((q) => state.answers[q.id] != null));
    const btn = app.querySelector('.btn.primary');
    btn.onclick = () => { bg.celebrate(); go(firstOpen?.id ?? 'summary'); };
  }
}

/* ---------- Her story ---------- */

function renderStory() {
  app.append(el('section', { class: 'trial trial-story' },
    header(null),
    el('div', { class: 'trial-grid' },
      el('aside', { class: 'trial-side' }, photo('goddess-city', GODDESS)),
      el('article', { class: 'trial-main letter' },
        el('p', { class: 'kicker', text: STORY.kicker }),
        el('h1', { tabindex: '-1', text: STORY.title }),
        el('ul', { class: 'highlights' }, STORY.highlights.map((h) => el('li', { text: h }))),
        STORY.paragraphs.map((text) => el('p', { text })),
        el('p', { class: 'signoff', text: `— ${STORY.signoff}` }),
        el('div', { class: 'actions' },
          el('button', { class: 'btn ghost', type: 'button', text: 'Back', onclick: () => go('gate') }),
          el('button', { class: 'btn primary', type: 'button', text: 'I am ready for the trials', onclick: () => { bg.celebrate(); go('intro'); } }))))));
}

/* ---------- Ordinary trials ---------- */

function sectionFrame(section, body) {
  const isTrial = section.id !== 'intro';
  return el('section', { class: `trial trial-${section.id}` },
    header(isTrial ? section.id : null),
    el('div', { class: 'trial-grid' },
      el('aside', { class: 'trial-side' },
        photo(section.photo, `${GODDESS}`),
        section.zodiac ? el('div', { class: 'zodiac-slot' }) : null),
      el('div', { class: 'trial-main' },
        el('p', { class: 'kicker', text: section.kicker }),
        el('h1', { tabindex: '-1', text: section.title }),
        el('p', { class: 'lead', text: section.intro }),
        body)));
}

function nav(section, nextLabel = 'Continue') {
  const index = STEPS.indexOf(section.id);
  return el('div', { class: 'actions' },
    el('button', { class: 'btn ghost', type: 'button', text: 'Back', onclick: () => go(STEPS[index - 1]) }),
    el('button', { class: 'btn primary', type: 'submit', text: nextLabel }));
}

function nextStep(id) {
  return STEPS[STEPS.indexOf(id) + 1];
}

function renderSection(section) {
  const form = el('form', { class: 'questions', novalidate: true });
  const error = el('p', { class: 'error', role: 'alert' });

  if (section.adult && !state.answers.desireOpened) {
    renderVeil(section);
    return;
  }

  const onChange = (q) => {
    save();
    if (section.zodiac && ['birthDate', 'moon', 'rising'].includes(q.id)) updateStars();
  };
  for (const q of section.questions) form.append(renderQuestion(q, state.answers, onChange));

  if (section.zodiac) form.prepend(el('div', { class: 'star-reading', 'aria-live': 'polite' }));
  if (section.adult) {
    form.append(el('p', { class: 'hint' }, el('button', {
      class: 'linkish', type: 'button', text: 'Skip this trial',
      onclick: () => { state.answers.desireSkipped = true; go(nextStep(section.id)); },
    })));
  }

  form.append(error, nav(section, section.id === 'desire' ? 'To the offering' : 'Continue'));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const missing = missingRequired(section, state.answers);
    if (missing.length) {
      error.textContent = 'The goddess needs every starred answer.';
      form.querySelector(`[data-q="${missing[0]}"] input, [data-q="${missing[0]}"] textarea`)?.focus();
      return;
    }
    if (section.adult) delete state.answers.desireSkipped;
    bg.celebrate();
    go(nextStep(section.id));
  });

  app.append(sectionFrame(section, form));

  if (section.zodiac) {
    zodiac = createZodiac(app.querySelector('.zodiac-slot'), CONFIG.chart);
    updateStars();
  }
}

function renderVeil(section) {
  app.append(sectionFrame(section, el('div', { class: 'veil' },
    el('p', { text: 'This trial asks about sex: what you like, what you would try, and your limits. It is for adults only and you may skip it.' }),
    el('div', { class: 'actions' },
      el('button', { class: 'btn ghost', type: 'button', text: 'Skip this trial', onclick: () => { state.answers.desireSkipped = true; go(nextStep(section.id)); } }),
      el('button', {
        class: 'btn primary', type: 'button', text: "I'm 18+. Lift the veil",
        onclick: () => { state.answers.desireOpened = true; delete state.answers.desireSkipped; render(); },
      })))));
}

function starsExtras() {
  const sign = sunSign(state.answers.birthDate);
  if (!sign) return [];
  const his = { sun: sign.name, moon: known(state.answers.moon), rising: known(state.answers.rising) };
  const reading = compatibility(his, CONFIG.chart);
  return [
    `Sun sign (from birth date): ${sign.name}${sign.onCusp ? ' (on the cusp)' : ''}`,
    `Compatibility with ${GODDESS}: ${reading.score}%`,
    ...reading.lines,
  ];
}

function known(value) {
  return value && value !== 'unknown' ? value : null;
}

function updateStars() {
  const box = app.querySelector('.star-reading');
  if (!box) return;
  const sign = sunSign(state.answers.birthDate);
  zodiac?.setSign(sign?.name ?? null);
  if (!sign) {
    box.replaceChildren(el('p', { text: 'Enter your birth date and the wheel will find your sun.' }));
    return;
  }
  const his = { sun: sign.name, moon: known(state.answers.moon), rising: known(state.answers.rising) };
  const reading = compatibility(his, CONFIG.chart);
  box.replaceChildren(
    el('p', { class: 'sun' }, `${sign.glyph}\uFE0E You are a `, el('strong', { text: sign.name }), ' sun',
      sign.onCusp ? el('span', { class: 'hint', text: ' (born on a cusp, so check your exact chart)' }) : null),
    el('div', { class: 'meter', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': reading.score, 'aria-label': 'Cosmic compatibility' },
      el('span', { style: `width:${reading.score}%` })),
    el('p', { class: 'score' }, el('strong', { text: `${reading.score}%` }), ` cosmic pull with ${GODDESS}`),
    el('ul', { class: 'reading' }, reading.lines.map((line) => el('li', { text: line }))),
  );
}

/* ---------- Gate of Truth: one card at a time ---------- */

function renderTruth(section) {
  const questions = section.questions;
  let index = Math.max(0, questions.findIndex((q) => state.answers[q.id] == null || (Array.isArray(state.answers[q.id]) && !state.answers[q.id].length)));
  if (index < 0) index = 0;

  const slot = el('div', { class: 'truth-slot' });
  const frame = sectionFrame(section, slot);
  app.append(frame);

  const showCard = (i, direction = 1) => {
    index = i;
    const q = questions[i];
    const error = el('p', { class: 'error', role: 'alert' });
    const form = el('form', { class: `truth-card flip-in ${direction < 0 ? 'from-left' : ''}`, novalidate: true });
    const advance = () => {
      if (missingRequired({ questions: [q] }, state.answers).length) {
        error.textContent = q.type === 'number' ? 'A number, please. The goddess can count.' : 'Choose an answer to pass.';
        return;
      }
      if (i + 1 < questions.length) showCard(i + 1);
      else finishTruth();
    };
    const onChange = () => {
      save();
      error.textContent = '';
      if (q.type === 'choice') setTimeout(advance, 380);
    };
    form.append(
      el('p', { class: 'card-count', text: `${i + 1} / ${questions.length}` }),
      renderQuestion(q, state.answers, onChange),
      error,
      el('div', { class: 'actions' },
        el('button', {
          class: 'btn ghost', type: 'button', text: 'Back',
          onclick: () => (i === 0 ? go('intro') : showCard(i - 1, -1)),
        }),
        q.type === 'choice' ? null : el('button', { class: 'btn primary', type: 'submit', text: i + 1 < questions.length ? 'Next' : 'Pass the gate' })),
    );
    form.addEventListener('submit', (event) => { event.preventDefault(); advance(); });
    slot.replaceChildren(form);
    form.querySelector('input, select, textarea')?.focus({ preventScroll: true });
  };

  showCard(index);
}

async function finishTruth() {
  state.verdict = checkDealbreakers(state.answers, CONFIG.dealbreakers);
  save();
  if (state.verdict.passed) {
    bg.celebrate();
    go(nextStep('truth'));
    return;
  }
  // Turned away: send what he gave so the goddess still knows who knocked.
  state.finished = true;
  state.step = 'end';
  state.result = await offer();
  save();
  render();
}

/* ---------- Summary & offering ---------- */

function currentPayload() {
  const verdict = state.verdict ?? checkDealbreakers(state.answers, CONFIG.dealbreakers);
  const sections = state.answers.desireSkipped ? SECTIONS.filter((s) => s.id !== 'desire') : SECTIONS;
  const extras = { stars: starsExtras() };
  if (state.answers.desireSkipped) extras.desire = ['Skipped this trial'];
  const payload = buildPayload(sections, state.answers, verdict, extras);
  if (state.answers.desireSkipped) payload.desire = 'Skipped this trial';
  return payload;
}

const STORED = storageConfigured(CONFIG.storage);
const AUTO_SENDS = STORED || isConfigured(CONFIG.googleForm);

async function offer() {
  const payload = currentPayload();
  const text = payloadToText(SECTIONS, payload);
  let outcome;
  if (STORED) {
    try {
      outcome = await saveOffering(CONFIG.storage, buildRow(payload, state.answers, text));
    } catch (error) {
      outcome = { sent: false, error: error.message };
    }
  } else {
    outcome = await send(payload, CONFIG.googleForm);
  }
  return { ...outcome, text };
}

function renderSummary() {
  const payload = currentPayload();
  const blocks = SECTIONS.filter((s) => s.id !== 'intro').map((s) => el('details', { class: 'scroll-block', open: s.id === 'truth' },
    el('summary', {}, el('span', { text: s.title }),
      el('button', { class: 'linkish', type: 'button', text: 'Edit', onclick: (e) => { e.preventDefault(); go(s.id); } })),
    el('pre', { text: payload[s.id] || 'Nothing answered yet.' })));

  const button = el('button', { class: 'btn primary', type: 'button', text: 'Offer it to the goddess' });
  button.addEventListener('click', async () => {
    state.verdict = checkDealbreakers(state.answers, CONFIG.dealbreakers);
    button.disabled = true;
    button.textContent = 'Offering…';
    state.result = await offer();
    state.finished = true;
    bg.celebrate();
    go('end');
  });

  app.append(el('section', { class: 'trial trial-summary' },
    header(null),
    el('div', { class: 'trial-grid' },
      el('aside', { class: 'trial-side' }, photo('goddess-city', GODDESS)),
      el('div', { class: 'trial-main' },
        el('p', { class: 'kicker', text: 'The offering' }),
        el('h1', { tabindex: '-1', text: 'Your scroll for the goddess' }),
        el('p', { class: 'lead', text: AUTO_SENDS ? `Read it over and change anything you like, then offer it. It goes privately to ${GODDESS}.` : `Read it over and change anything you like. When you offer it, you will copy or download it to send to ${GODDESS}.` }),
        el('div', { class: 'scroll' }, el('p', {}, el('strong', { text: payload.name || 'Unnamed seeker' }), ` · ${payload.age || '?'} · ${payload.city || 'somewhere'}`), blocks),
        el('div', { class: 'actions' },
          el('button', { class: 'btn ghost', type: 'button', text: 'Back', onclick: () => go(STEPS[STEPS.indexOf('summary') - 1]) }),
          button)))));
}

function renderEnd() {
  const passed = state.verdict?.passed !== false;
  const result = state.result ?? {};
  const needsHandOff = !result.sent;
  const name = state.answers.name?.split(' ')[0] || 'seeker';

  const copy = el('button', {
    class: 'btn ghost', type: 'button', text: 'Copy my answers',
    onclick: async () => {
      try { await navigator.clipboard.writeText(result.text ?? ''); copy.textContent = 'Copied ✓'; } catch { copy.textContent = 'Select the text below to copy'; }
    },
  });
  const download = el('a', {
    class: 'btn ghost', download: 'offering-for-the-goddess.txt',
    href: `data:text/plain;charset=utf-8,${encodeURIComponent(result.text ?? '')}`, text: 'Download',
  });

  app.append(el('section', { class: `ending ${passed ? 'won' : 'parted'}` },
    photo(passed ? 'goddess-sunlit' : 'goddess-witch', GODDESS, 'arch big'),
    el('div', { class: 'ending-text' },
      el('p', { class: 'kicker', text: passed ? 'The trials are complete' : 'The gate stays closed' }),
      el('h1', { tabindex: '-1', text: passed ? `The goddess will be in touch, ${name}.` : `The goddess wishes you well, ${name}.` }),
      el('p', {
        class: 'lead',
        text: passed
          ? `You walked through fire, stars and desire. ${GODDESS} reads every offering herself. If your paths are meant to cross, she will find you.`
          : `Thank you for your honesty; it is rarer than you think. Your path and ${GODDESS}'s lead different ways, and that is how it should be.`,
      }),
      needsHandOff ? el('div', { class: 'handoff' },
        el('p', { text: result.demo
          ? `One last step: copy or download your scroll and send it to ${GODDESS} yourself. That is how she receives your offering.`
          : `Your offering could not be sent (${result.error ?? 'network error'}). Copy or download it and send it to ${GODDESS}.` }),
        el('div', { class: 'actions' }, copy, download),
        el('pre', { class: 'scroll' , text: result.text ?? '' })) : null)));
}

/* ---------- Boot ---------- */

if (!AUTO_SENDS) document.documentElement.dataset.demo = 'true';
render(false);
