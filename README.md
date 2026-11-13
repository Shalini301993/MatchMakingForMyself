# Worthy of the Goddess

A matchmaking quest for the browser. A man who wants a date with Shalini passes through the
**Gate of Truth** (dealbreakers), then nine themed trials: rapid fire, the stars (astrology and
Human Design), love languages, strengths and weaknesses, past relationships, caretaking, family,
and desire. At the end he reviews his answers, then copies or downloads them and sends them to Shalini.

Built with [p5.js](https://p5js.org/) (the living saffron sky, tiger stripes, marigold petals and
the zodiac wheel) over plain HTML forms, as a static site for GitHub Pages. No build step.

## The quest

| Step | What he answers |
|---|---|
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
| The offering | He reviews everything, edits anything, then copies or downloads it to send to her |

Progress saves in his browser, so a refresh loses nothing.

## Dealbreakers

Set in [`config.js`](config.js) under `dealbreakers`. Right now he is turned away if he:

- drinks to get drunk several times a week,
- has ever been married (currently married, separated, divorced or widowed),
- has children or one on the way.

Drug use, prenup stance and number of partners are **recorded only**. When he is turned away he
sees a kind goodbye. His copy of the answers is marked `Turned away: <reason>`. To change a rule, edit the `values` list for that question (the
possible values are the `value`s in [`src/questions.js`](src/questions.js)).

## Receiving answers

Nothing is sent anywhere automatically. On the last screen he copies or downloads his answers
(a plain-text file) and sends them to you himself, by message or email.

The game can also post answers straight to a Google Form, which saves them to a Google Sheet.
That is switched off while `formId` in [`config.js`](config.js) is empty. To switch it on later:

1. Create a Google Form with these 14 questions: `Verdict`, `Name`, `Contact`, `Age`, `City`
   (short answer), then `Gate of Truth`, `Trial of Fire`, `Trial of the Stars`,
   `Trial of the Heart`, `Trial of the Mirror`, `Trial of Memory`, `Trial of the Vow`,
   `Trial of the Hearth`, `Trial of Desire` (paragraph). None required.
2. Publish it to **Anyone with the link**, with email collection and "Limit to 1 response" off,
   so no sign-in is needed.
3. Use **⋮ → Get pre-filled link**, then copy the long id after `/d/e/` into `formId` and each
   `entry.NNNNNN` into the matching field in `config.js`.

## Privacy

- The repository and the site are public: anyone with the link sees the photos and your name. The
  photos had their location and camera metadata removed.
- His answers never leave his browser unless he sends them to you, and the site tells him so
  before he starts.
- Your chart in `config.js` holds only your signs, not your birth date.

## Publishing on GitHub Pages

In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**, then re-run the
latest `Deploy to GitHub Pages` workflow (Actions tab). After that it tests and publishes the site
on every push to `main`, at
`https://shalini301993.github.io/MatchMakingForMyself/`.

## Changing things

| To change | Edit |
|---|---|
| Questions, options, kinks list | [`src/questions.js`](src/questions.js) |
| Dealbreakers, your signs, the optional form | [`config.js`](config.js) |
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
Cinzel Decorative, Cormorant Garamond and Outfit from Google Fonts. The look takes its colours
from traditional Pahari paintings of Durga riding her tiger.
