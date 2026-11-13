// Plays the whole quest in a real browser: a passing run, a turned-away run, and a run that
// submits to a (stubbed) Google Form. Usage: node tests/smoke.mjs [screenshot-dir]
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { startServer } from '../scripts/serve.mjs';

// require() also finds a globally installed Playwright (NODE_PATH), which ESM import does not.
const { chromium } = createRequire(import.meta.url)('playwright');
const shots = process.argv[2] ?? 'screenshots';
await mkdir(shots, { recursive: true });
const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const problems = [];

async function open({ width = 390, height = 844, scale = 2, config } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error' && !/fonts\.g/.test(msg.location().url)) problems.push(`console: ${msg.text()}`); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  if (config) await page.route('**/config.js', (route) => route.fulfill({ contentType: 'text/javascript', body: config }));
  await page.goto(base);
  await page.waitForSelector('#sky canvas');
  return { context, page };
}

const pick = (page, text) => page.locator('label.pill', { hasText: text }).first().click();
const h1 = (page) => page.locator('h1').innerText();
async function shot(page, name) {
  // Every photo on screen must actually load.
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 5000 });
  const broken = await page.evaluate(() => [...document.images].filter((img) => !img.naturalWidth).map((img) => img.src));
  assert.deepEqual(broken, [], `broken images on ${name}`);
  await page.screenshot({ path: `${shots}/${name}.png`, fullPage: false });
}
const proceed = (page) => page.locator('button[type=submit]').click();

async function introAndGate(page, overrides = {}) {
  await page.getByRole('button', { name: /Begin the trials/ }).click();
  assert.equal(await h1(page), 'How I got here');
  assert.match(await page.locator('.letter').innerText(), /8 languages[\s\S]*PTSD[\s\S]*— Shalini/);
  if (overrides.storyShot) await shot(page, overrides.storyShot);
  await page.getByRole('button', { name: /ready for the trials/ }).click();
  assert.equal(await h1(page), 'Who approaches?');
  // Required fields are enforced.
  await proceed(page);
  assert.match(await page.locator('.error').innerText(), /starred/);
  await page.getByLabel('Your name').fill('Arjun Rao');
  await page.getByLabel('Your age').fill('34');
  await page.getByLabel('Where do you live?').fill('Orlando, USA');
  await page.getByLabel('How can she reach you?').fill('@arjun');
  await proceed(page);
  assert.equal(await h1(page), 'The Gate of Truth');
  await pick(page, overrides.drinking ?? 'Socially, now and then');
  await page.waitForSelector('text=Are you into drugs?');
  await pick(page, 'Never touched anything');
  await proceed(page);
  await pick(page, 'Never married');
  await page.waitForSelector('text=Do you have children?');
  await pick(page, 'No children');
  await page.waitForSelector('text=Do you believe in a prenup?');
  await pick(page, 'Open to it if she wants one');
  await page.waitForSelector('text=How many women');
  await page.getByLabel(/How many women/).fill('6');
}

// ---------- 1. A worthy seeker, on a phone ----------
{
  const { context, page } = await open();
  assert.match(await h1(page), /Worthy of the/);
  assert.equal(await page.locator('.tarot img').count(), 3);
  await page.waitForTimeout(600);
  await shot(page, '01-gate-phone');
  await introAndGate(page, { storyShot: '01b-story-phone' });
  await shot(page, '02-gate-of-truth-phone');
  await proceed(page);

  assert.equal(await h1(page), 'The Trial of Fire');
  assert.ok(await page.locator('.trial-side img').isVisible());
  await page.getByLabel('Describe yourself in five words.').fill('loyal, funny, calm, driven, warm');
  await pick(page, 'Both, obviously');
  await shot(page, '03-trial-of-fire-phone');
  await proceed(page);

  assert.equal(await h1(page), 'The Trial of the Stars');
  await page.getByLabel('Your birth date').fill('1990-04-05');
  await page.getByLabel('Your moon sign').selectOption('Taurus');
  await page.waitForTimeout(1200);
  assert.match(await page.locator('.star-reading').innerText(), /Aries sun/);
  assert.match(await page.locator('.star-reading').innerText(), /\d+% cosmic pull/);
  assert.doesNotMatch(await page.locator('.trial-main').innerText(), /^(null|undefined)$/m);
  await page.locator('.trial-main').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, '04-trial-of-stars-phone');
  await proceed(page);

  assert.equal(await h1(page), 'The Trial of the Heart');
  await page.getByLabel('Words of affirmation').fill('5');
  await proceed(page);
  assert.equal(await h1(page), 'The Trial of the Mirror');
  await page.getByLabel('Your five strengths 1').fill('Patient');
  await page.getByLabel('Your five weaknesses 1').fill('Stubborn');
  await proceed(page);
  assert.equal(await h1(page), 'The Trial of Memory');
  await page.getByLabel(/biggest thing your past/).fill('Say what you need early.');
  await proceed(page);
  assert.equal(await h1(page), 'The Trial of the Vow');
  await pick(page, 'Yes, fully, it is my role');
  await proceed(page);
  assert.equal(await h1(page), 'The Trial of the Hearth');
  await pick(page, '2');
  await pick(page, 'Adventurous');
  await proceed(page);

  assert.equal(await h1(page), 'The Trial of Desire');
  assert.equal(await page.locator('.ynm-row').count(), 0, 'kinks hidden behind the veil');
  await shot(page, '05-desire-veil-phone');
  await page.getByRole('button', { name: /Lift the veil/ }).click();
  assert.ok(await page.locator('.ynm-row').count() >= 25);
  await page.locator('.ynm-row', { hasText: 'Blindfolds' }).locator('label.pill-yes').click();
  await page.locator('.ynm-row', { hasText: 'Mirrors' }).locator('label.pill-maybe').click();
  await page.getByLabel('Your hard limits').fill('Nothing that hurts for real.');
  await proceed(page);

  assert.equal(await h1(page), 'Your scroll for the goddess');
  const scroll = await page.locator('.scroll').innerText();
  assert.match(scroll, /Arjun Rao/);
  await shot(page, '06-summary-phone');

  // Progress survives a reload.
  await page.reload();
  await page.waitForSelector('#sky canvas');
  assert.equal(await h1(page), 'Your scroll for the goddess');

  await page.getByRole('button', { name: /Offer it to the goddess/ }).click();
  await page.waitForSelector('text=The goddess will be in touch');
  const handoff = await page.locator('.handoff pre').innerText();
  assert.match(handoff, /Verdict: Passed the gate/);
  assert.match(handoff, /Sun sign \(from birth date\): Aries/);
  assert.match(handoff, /Yes: Blindfolds/);
  assert.match(handoff, /Maybe: Mirrors/);
  await page.waitForTimeout(900);
  await shot(page, '07-ending-phone');
  await context.close();
}

// ---------- 2. A heavy drinker is turned away ----------
{
  const { context, page } = await open({ scale: 1 });
  await introAndGate(page, { drinking: 'I drink to get drunk' });
  await proceed(page);
  await page.waitForSelector('text=The goddess wishes you well');
  assert.match(await page.locator('.handoff pre').innerText(), /Turned away: drinks heavily/);
  assert.equal(await page.locator('.mala').count(), 0);
  await shot(page, '08-turned-away-phone');
  // He cannot simply start again from the gate.
  await page.reload();
  await page.waitForSelector('text=The goddess wishes you well');
  await context.close();
}

// ---------- 3. Desktop views, and a real submission to a stubbed Google Form ----------
{
  const source = await readFile(new URL('../config.js', import.meta.url), 'utf8');
  const config = source
    .replace("formId: '',", "formId: 'TESTFORM',")
    .replace("verdict: '',", "verdict: 'entry.1',")
    .replace("name: '',", "name: 'entry.2',")
    .replace("truth: '',", "truth: 'entry.3',");
  const { context, page } = await open({ width: 1280, height: 860, config });
  const posts = [];
  await page.route('https://docs.google.com/**', async (route) => {
    posts.push({ url: route.request().url(), body: route.request().postData() });
    await route.fulfill({ status: 200, body: 'ok' });
  });
  await page.waitForTimeout(600);
  await shot(page, '09-gate-desktop');
  await introAndGate(page);
  await proceed(page);
  await page.getByRole('button', { name: 'Continue' }).click(); // fire
  await page.getByLabel('Your birth date').fill('1985-07-30');
  await page.waitForTimeout(1200);
  await shot(page, '10-trial-of-stars-desktop');
  for (const _ of ['stars', 'heart', 'mirror', 'memory', 'vow', 'hearth']) await proceed(page);
  await page.getByRole('button', { name: 'Skip this trial' }).click();
  await page.getByRole('button', { name: /Offer it to the goddess/ }).click();
  await page.waitForSelector('text=The goddess will be in touch');
  assert.equal(await page.locator('.handoff').count(), 0, 'no hand-off when sent');
  assert.equal(posts.length, 1);
  assert.match(posts[0].url, /forms\/d\/e\/TESTFORM\/formResponse$/);
  const body = new URLSearchParams(posts[0].body);
  assert.equal(body.get('entry.1'), 'Passed the gate');
  assert.equal(body.get('entry.2'), 'Arjun Rao');
  assert.match(body.get('entry.3'), /How do you drink\? Socially/);
  await shot(page, '11-ending-desktop');
  await context.close();
}

// ---------- 4. Private inbox: offerings are stored, and only she can read them ----------
{
  const source = await readFile(new URL('../config.js', import.meta.url), 'utf8');
  const config = source
    .replace("url: '',      // Project URL", "url: 'https://stub.supabase.co', // Project URL")
    .replace("anonKey: '',  // Project API key", "anonKey: 'pub-key', // Project API key");
  assert.notEqual(config, source);
  const db = [];
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  };
  const fakeSupabase = async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (status, body) => route.fulfill({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: body == null ? '' : JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const h = req.headers();
    if (h.apikey !== 'pub-key') return json(401, { message: 'Invalid API key' });
    if (url.pathname === '/auth/v1/token') {
      const body = req.postDataJSON();
      if (body.password !== 'moonlight') return json(400, { error_description: 'Invalid login credentials' });
      return json(200, { access_token: 'AT', refresh_token: 'RT', expires_in: 3600, user: { email: body.email } });
    }
    const signedIn = h.authorization === 'Bearer AT';
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    if (req.method() === 'POST') { db.push({ id: `o${db.length + 1}`, created_at: new Date(Date.now() + db.length * 1000).toISOString(), starred: false, ...req.postDataJSON() }); return json(201, null); }
    if (!signedIn) return json(401, { message: 'permission denied for table offerings' });
    if (req.method() === 'GET') return json(200, [...db].reverse());
    if (req.method() === 'PATCH') { Object.assign(db.find((r) => r.id === id), req.postDataJSON()); return json(204, null); }
    if (req.method() === 'DELETE') { db.splice(db.findIndex((r) => r.id === id), 1); return json(204, null); }
    return json(405, null);
  };

  // A turned-away seeker, then a worthy one, both saved without any hand-off.
  for (const drinking of ['I drink to get drunk', null]) {
    const { context, page } = await open({ scale: 1, config });
    await page.route('https://stub.supabase.co/**', fakeSupabase);
    assert.match(await page.locator('.promises').innerText(), /only she can read them/);
    await introAndGate(page, drinking ? { drinking } : {});
    await proceed(page);
    if (drinking) {
      await page.waitForSelector('text=The goddess wishes you well');
    } else {
      for (let i = 0; i < 7; i++) await proceed(page);
      await page.getByRole('button', { name: 'Skip this trial' }).click();
      await page.getByRole('button', { name: /Offer it to the goddess/ }).click();
      await page.waitForSelector('text=The goddess will be in touch');
    }
    assert.equal(await page.locator('.handoff').count(), 0, 'saved, so no copy/download hand-off');
    await context.close();
  }
  assert.equal(db.length, 2);
  assert.equal(db[0].passed, false);
  assert.match(db[0].verdict, /Turned away: drinks heavily/);
  assert.equal(db[1].passed, true);
  assert.match(db[1].sections.truth, /How do you drink\? Socially/);
  assert.equal(db[1].answers.name, 'Arjun Rao');

  // The inbox: wrong password, right password, filter, read, star, delete.
  for (const [label, size] of [['desktop', { width: 1280, height: 860 }], ['phone', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
    const page = await context.newPage();
    page.on('pageerror', (error) => problems.push(`inbox pageerror: ${error.message}`));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await page.route('**/config.js', (route) => route.fulfill({ contentType: 'text/javascript', body: config }));
    await page.route('https://stub.supabase.co/**', fakeSupabase);
    await page.goto(`${base}inbox.html`);
    await page.getByLabel('Email').fill('me@example.com');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Enter' }).click();
    await page.waitForSelector('text=Invalid login credentials');
    await page.getByLabel('Password').fill('moonlight');
    await page.getByRole('button', { name: 'Enter' }).click();
    await page.waitForSelector('.offer-item');
    assert.equal(await page.locator('.offer-item').count(), db.length);
    await page.getByRole('tab', { name: /Worthy/ }).click();
    assert.equal(await page.locator('.offer-item').count(), 1);
    await page.getByRole('tab', { name: /^All/ }).click();
    if (label === 'desktop') {
      await page.locator('.offer-item', { hasText: 'Arjun Rao' }).first().click();
      await page.waitForSelector('.offer-read');
      assert.match(await page.locator('.offer-read').innerText(), /The Gate of Truth[\s\S]*Socially/);
      await page.getByRole('button', { name: '☆ Star' }).click();
      await page.waitForSelector('text=★ Starred');
      assert.equal(db[1].starred, true);
      await shot(page, '12-inbox-desktop');
      // Signed in survives a reload.
      await page.reload();
      await page.waitForSelector('.offer-item');
    } else {
      await shot(page, '13-inbox-phone');
      await page.locator('.offer-item', { hasText: 'Turned away' }).first().click();
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Delete' }).click();
      await page.waitForFunction(() => document.querySelectorAll('.offer-item').length === 1);
      assert.equal(db.length, 1);
      await page.getByRole('button', { name: 'Sign out' }).click();
      await page.waitForSelector('text=Only for the goddess');
    }
    await context.close();
  }
}

await browser.close();
server.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Smoke test passed. Screenshots in ${shots}/`);
