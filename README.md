# Worthy of the Goddess

A matchmaking quest for the browser. A man who wants a date with Shalini passes through the
**Gate of Truth** (dealbreakers), then nine themed trials: rapid fire, the stars (astrology and
Human Design), love languages, strengths and weaknesses, past relationships, caretaking, family,
and desire. At the end he reviews his answers and offers them; they land in Shalini's private inbox.

It opens with Shalini's own story, then the trials. The look is lavender minimalism: white space,
thin lines and quiet type, with [p5.js](https://p5js.org/) drawing the softly drifting lavender
backdrop and the zodiac wheel over plain HTML forms. A static site for GitHub Pages, no build step.

## The quest

| Step | What he answers |
|---|---|
| How I got here | Her story, in her own words ([`src/story.js`](src/story.js)) |
| Who approaches? | Name, age (18+), city, how to reach him |
| I · Gate of Truth | Drinking, drugs, past marriage, kids, prenup, number of partners. One card at a time. |
| II · Trial of Fire | Colbert-style rapid fire questions |
| III · Trial of the Stars | Birth date, time and place. The wheel finds his sun sign and scores him against her Leo sun and Capricorn moon and rising. He self-reports moon, rising and Human Design. |
| IV · Trial of the Heart | Each of the five love languages: how much he gives (1–5) and how |
| V · Trial of the Mirror | Five strengths, five weaknesses, what he is working on |
| VI · Trial of Memory | What past relationships taught him |
| VII · Trial of the Vow | Would he take care of her emotionally, sexually and financially, how much (1–10), and how |
| VIII · Trial of the Hearth | Kids wanted, when, the wife he envisions, the husband he will be |
| IX · Trial of Desire | 18+, behind a veil, skippable: frequency, ~34 kinks (Yes / Maybe / No), hard limits |
| The offering | He reviews everything, edits anything, then offers it to her private inbox |

Progress saves in his browser, so a refresh loses nothing.

## Dealbreakers

Set in [`config.js`](config.js) under `dealbreakers`. Right now he is turned away if he:

- drinks to get drunk several times a week,
- has ever been married (currently married, separated, divorced or widowed),
- has children or one on the way.

Drug use, prenup stance and number of partners are **recorded only**. When he is turned away he
sees a kind goodbye. His copy of the answers is marked `Turned away: <reason>`. To change a rule, edit the `values` list for that question (the
possible values are the `value`s in [`src/questions.js`](src/questions.js)).

## Private inbox

Every finished (or turned-away) quest can be saved to your own free [Supabase](https://supabase.com)
database, and you read them at **`inbox.html`** on the site
(`https://shalini301993.github.io/MatchMakingForMyself/inbox.html`): list, search, filter
Worthy / Turned away / Starred, read each scroll, star, download or delete.

Anyone can *add* an offering, but only you can *read* one. That rule lives in the database
(row-level security in [`supabase/setup.sql`](supabase/setup.sql)), so the key in `config.js` is safe
to publish: it can only add rows, never read them.

Until it is set up, the game falls back to asking him to copy or download his answers and send them
to you.

**One-time setup (about 5 minutes):**

1. Sign up at supabase.com (free) and create a **New project**. Any name, a strong database
   password, the region nearest you.
2. Open **SQL Editor → New query**, paste all of [`supabase/setup.sql`](supabase/setup.sql) and
   click **Run**.
3. Open **Authentication → Users → Add user → Create new user**. Enter your email and a password,
   and tick **Auto confirm**. This is your inbox login.
4. Back in the **SQL Editor**, run this one line with your own email:
   `insert into public.inbox_readers select id from auth.users where email = 'you@example.com';`
5. Optional but recommended: in **Authentication → Sign In / Providers**, turn off
   **Allow new users to sign up**.
6. Open **Project Settings → API** (called **API Keys** / **Data API** in newer dashboards) and copy
   the **Project URL** and the **anon** (or **publishable**) key. Never the `service_role` or
   secret key. Put them in `config.js` under `storage`, or send them to Claude to do it.
7. Open `inbox.html` on the site and sign in.

Supabase pauses free projects after a week with no activity. If that happens, open the project in
the dashboard and click **Restore**.

### Optional: a Google Form instead

The game can also post to a Google Form (`googleForm` in `config.js`): 14 questions (`Verdict`,
`Name`, `Contact`, `Age`, `City`, then one paragraph question per trial), published to **Anyone
with the link** with no sign-in, and the `entry.NNNNNN` ids from **⋮ → Get pre-filled link**.

## Privacy

- The repository and the site are public: anyone with the link sees the photos and your name. The
  photos had their location and camera metadata removed.
- His answers go only to your private Supabase inbox (or, until it is set up, only to you when he
  sends them). The title screen tells him which before he starts.
- Your chart in `config.js` holds only your signs, not your birth date.

## Publishing on GitHub Pages

In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**, then re-run the
latest `Deploy to GitHub Pages` workflow (Actions tab). After that it tests and publishes the site
on every push to `main`, at
`https://shalini301993.github.io/MatchMakingForMyself/`.

## Changing things

| To change | Edit |
|---|---|
| Her story | [`src/story.js`](src/story.js) |
| Questions, options, kinks list | [`src/questions.js`](src/questions.js) |
| Dealbreakers, your signs, inbox storage | [`config.js`](config.js) |
| Photos | Replace the files in [`assets/photos/`](assets/photos/) (keep the names), or add one in `PHOTOS` in `src/questions.js` |
| Colours and fonts | [`styles/main.css`](styles/main.css) (the tokens at the top) |
| The background animation | [`src/background.js`](src/background.js) |

## Run it locally

```bash
npm start
```

Then open http://localhost:8080/.

```bash
npm test
```

```bash
npm run smoke
```

`npm test` checks the rules, sun signs and form payload. `npm run smoke` plays the whole quest in
a headless Chromium: a worthy run, a turned-away run, and a run that submits to a stubbed Google
Form. It saves screenshots to `screenshots/` and needs Playwright installed.

## Credits

p5.js 2.3.4 is vendored in `vendor/` under the LGPL 2.1 (see `vendor/P5-LICENSE.txt`). Fonts:
Cormorant Garamond and Outfit from Google Fonts.
