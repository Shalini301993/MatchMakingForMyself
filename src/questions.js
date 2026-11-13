// The whole questionnaire as data. Each section is one screen ("trial") of the quest.
// Question types: text, textarea, number, date, time, choice, multi, scale, list, ynm.

import { SIGNS } from './astro.js';

const SIGN_OPTIONS = [
  ...SIGNS.map((s) => ({ value: s.name, label: `${s.glyph}\uFE0E ${s.name}` })),
  { value: 'unknown', label: "I don't know" },
];

const yesNo = (id, label, extra = {}) => ({ id, type: 'choice', label, ...extra });

const LOVE_LANGUAGES = [
  ['words', 'Words of affirmation', 'How would you make her feel seen, out loud and in writing?'],
  ['time', 'Quality time', 'What does undistracted time together look like for you?'],
  ['gifts', 'Receiving gifts', 'Tell her about the best gift you ever gave and why it landed.'],
  ['service', 'Acts of service', 'What would you take off her plate without being asked?'],
  ['touch', 'Physical touch', 'How affectionate are you day to day, in public and at home?'],
];

const CARE = [
  ['emotional', 'Emotionally', 'When she has a hard day, what do you actually do?'],
  ['sexual', 'Sexually', 'How do you make sure her pleasure matters as much as yours?'],
  ['financial', 'Financially', 'How do you see money in a partnership: who pays for what, and how much can you carry?'],
];

const CARE_OPTIONS = [
  { value: 'fully', label: 'Yes, fully, it is my role' },
  { value: 'yes', label: 'Yes, as an equal partner' },
  { value: 'some', label: 'Within reason' },
  { value: 'unsure', label: "I'm not sure yet" },
  { value: 'no', label: 'No' },
];

export const KINKS = [
  ['Power', ['Being dominant', 'Being submissive', 'Switching it up', 'Praise', 'Verbal degradation', 'Orgasm control or denial', 'Giving orders / taking orders']],
  ['Sensation', ['Spanking', 'Hair pulling', 'Biting and scratching', 'A hand on the throat (with care)', 'Temperature play (ice, wax)', 'Blindfolds', 'Light bondage (cuffs, rope)', 'Impact toys (paddle, flogger)']],
  ['Play', ['Role-play scenarios', 'Lingerie and costumes', 'Dirty talk', 'Sexting and photos (private only)', 'Filming for our eyes only', 'Toys used together', 'Foot worship']],
  ['Setting', ['Slow, tantric sessions', 'Rough and fast', 'Quickies anywhere', 'Semi-public thrill', 'Mirrors', 'Shower or bath', 'Morning sex', 'Multiple rounds']],
  ['Care', ['Giving oral', 'Receiving oral', 'Aftercare and cuddling', 'Safe words, always']],
];

export const SECTIONS = [
  {
    id: 'intro',
    title: 'Who approaches?',
    kicker: 'Before the trials',
    photo: 'goddess-city',
    intro: 'Every seeker gives his name at the temple door. She will want to reach you if you are worthy.',
    questions: [
      { id: 'name', type: 'text', label: 'Your name', required: true, placeholder: 'First and last' },
      { id: 'age', type: 'number', label: 'Your age', required: true, min: 18, max: 99 },
      { id: 'city', type: 'text', label: 'Where do you live?', placeholder: 'City, country' },
      { id: 'contact', type: 'text', label: 'How can she reach you?', required: true, placeholder: 'Instagram, phone or email' },
    ],
  },
  {
    id: 'truth',
    gate: true,
    title: 'The Gate of Truth',
    kicker: 'Trial I',
    photo: 'goddess-sunlit',
    intro: 'Six questions. Answer true; the goddess can tell.',
    questions: [
      yesNo('drinking', 'How do you drink?', {
        required: true,
        options: [
          { value: 'never', label: "I don't drink" },
          { value: 'social', label: 'Socially, now and then' },
          { value: 'weekly', label: 'A few drinks most weeks' },
          { value: 'heavy', label: 'I drink to get drunk, several times a week' },
        ],
      }),
      {
        id: 'drugs', type: 'multi', label: 'Are you into drugs? Pick all that are true.', required: true,
        options: [
          { value: 'never', label: 'Never touched anything' },
          { value: 'past', label: 'Used to, not anymore' },
          { value: 'weed-sometimes', label: 'Weed, occasionally' },
          { value: 'weed-often', label: 'Weed, weekly or more' },
          { value: 'psychedelics', label: 'Psychedelics, occasionally' },
          { value: 'hard', label: 'Cocaine, MDMA or other hard drugs' },
        ],
      },
      yesNo('married', 'Have you ever been married?', {
        required: true,
        options: [
          { value: 'never', label: 'Never married' },
          { value: 'married', label: 'Currently married' },
          { value: 'separated', label: 'Separated' },
          { value: 'divorced', label: 'Divorced' },
          { value: 'widowed', label: 'Widowed' },
        ],
      }),
      yesNo('kids', 'Do you have children?', {
        required: true,
        options: [
          { value: 'no', label: 'No children' },
          { value: 'expecting', label: 'One on the way' },
          { value: 'yes', label: 'Yes' },
        ],
      }),
      yesNo('prenup', 'Do you believe in a prenup?', {
        required: true,
        options: [
          { value: 'yes', label: "Yes, I'd want one" },
          { value: 'open', label: 'Open to it if she wants one' },
          { value: 'depends', label: 'Depends on our situation' },
          { value: 'no', label: "No, I don't believe in them" },
        ],
      }),
      {
        id: 'partners', type: 'number', label: 'How many women have you slept with?', required: true, min: 0, max: 9999,
        hint: 'Honesty is sexier than a round number.',
      },
    ],
  },
  {
    id: 'fire',
    title: 'The Trial of Fire',
    kicker: 'Trial II · rapid fire',
    photo: 'goddess-witch',
    intro: 'No overthinking. First answer that comes to you.',
    questions: [
      { id: 'fiveWords', type: 'text', label: 'Describe yourself in five words.' },
      { id: 'sandwich', type: 'text', label: 'What is the best sandwich?' },
      { id: 'catsDogs', type: 'choice', label: 'Cats or dogs?', options: [{ value: 'cats', label: 'Cats' }, { value: 'dogs', label: 'Dogs' }, { value: 'both', label: 'Both, obviously' }, { value: 'neither', label: 'Neither' }] },
      { id: 'mountainsOcean', type: 'choice', label: 'Mountains or ocean?', options: [{ value: 'mountains', label: 'Mountains' }, { value: 'ocean', label: 'Ocean' }] },
      { id: 'birdOwl', type: 'choice', label: 'Early bird or night owl?', options: [{ value: 'bird', label: 'Early bird' }, { value: 'owl', label: 'Night owl' }] },
      { id: 'scariestAnimal', type: 'text', label: 'Scariest animal?' },
      { id: 'afterDeath', type: 'text', label: 'What do you think happens when we die?' },
      { id: 'smell', type: 'text', label: 'Favourite smell?' },
      { id: 'song', type: 'text', label: 'The song you would play at full volume right now?' },
      { id: 'lastCry', type: 'text', label: 'The last thing that made you cry?' },
      { id: 'oneMeal', type: 'text', label: 'One meal for the rest of your life?' },
      { id: 'million', type: 'text', label: 'Something you would never do, even for a million dollars?' },
      { id: 'wasteTime', type: 'text', label: 'Your favourite way to waste time?' },
      { id: 'greenFlag', type: 'text', label: 'The biggest green flag in a woman?' },
      { id: 'whyHer', type: 'textarea', label: 'Why are you here, for her?' },
    ],
  },
  {
    id: 'stars',
    title: 'The Trial of the Stars',
    kicker: 'Trial III · astrology & Human Design',
    photo: 'goddess-witch',
    intro: 'She is a Leo sun with a Capricorn moon and rising: fire on the outside, earth all the way down. Let us see how your sky meets hers.',
    zodiac: true,
    questions: [
      { id: 'birthDate', type: 'date', label: 'Your birth date', hint: 'Your sun sign appears on the wheel.' },
      { id: 'birthTime', type: 'time', label: 'Birth time (as exact as you know)' },
      { id: 'birthPlace', type: 'text', label: 'Birth place', placeholder: 'City, country' },
      { id: 'moon', type: 'choice', label: 'Your moon sign', options: SIGN_OPTIONS, compact: true },
      { id: 'rising', type: 'choice', label: 'Your rising sign', options: SIGN_OPTIONS, compact: true },
      {
        id: 'hdType', type: 'choice', label: 'Your Human Design type', compact: true,
        hint: 'Any free Human Design chart site will tell you from your birth date, time and place.',
        options: ['Manifestor', 'Generator', 'Manifesting Generator', 'Projector', 'Reflector'].map((v) => ({ value: v, label: v }))
          .concat({ value: 'unknown', label: "I don't know" }),
      },
      {
        id: 'hdAuthority', type: 'choice', label: 'Your inner authority', compact: true,
        options: ['Emotional', 'Sacral', 'Splenic', 'Ego', 'Self-projected', 'Mental / environmental', 'Lunar'].map((v) => ({ value: v, label: v }))
          .concat({ value: 'unknown', label: "I don't know" }),
      },
      { id: 'hdProfile', type: 'text', label: 'Your profile (e.g. 3/5), if you know it' },
      { id: 'astroBelief', type: 'scale', label: 'How much do you believe in all this?', min: 1, max: 5, minLabel: 'Not at all', maxLabel: 'Written in the stars' },
    ],
  },
  {
    id: 'heart',
    title: 'The Trial of the Heart',
    kicker: 'Trial IV · love languages',
    photo: 'goddess-sunlit',
    intro: 'Five ways to love. Tell her how much you give in each, and show her how.',
    questions: LOVE_LANGUAGES.flatMap(([id, name, prompt]) => [
      { id: `ll_${id}`, type: 'scale', label: name, min: 1, max: 5, minLabel: 'Rarely', maxLabel: 'Fluently', group: name },
      { id: `ll_${id}_how`, type: 'textarea', label: prompt, rows: 2 },
    ]),
  },
  {
    id: 'mirror',
    title: 'The Trial of the Mirror',
    kicker: 'Trial V · strengths & weaknesses',
    photo: 'goddess-city',
    intro: 'A man who knows himself is rare. Name five of each.',
    questions: [
      { id: 'strengths', type: 'list', label: 'Your five strengths', count: 5 },
      { id: 'weaknesses', type: 'list', label: 'Your five weaknesses', count: 5 },
      { id: 'workingOn', type: 'textarea', label: 'Which weakness are you working on right now, and how?' },
    ],
  },
  {
    id: 'memory',
    title: 'The Trial of Memory',
    kicker: 'Trial VI · past relationships',
    photo: 'goddess-witch',
    intro: 'The past is a teacher. What did yours teach you?',
    questions: [
      { id: 'serious', type: 'number', label: 'How many serious relationships have you had?', min: 0, max: 99 },
      {
        id: 'lastEnded', type: 'choice', label: 'When did your last relationship end?',
        options: [{ value: '<3m', label: 'Under 3 months ago' }, { value: '3-12m', label: '3–12 months ago' }, { value: '1-3y', label: '1–3 years ago' }, { value: '3y+', label: 'More than 3 years ago' }],
      },
      { id: 'lesson', type: 'textarea', label: 'What is the biggest thing your past relationships taught you?' },
      { id: 'yourPart', type: 'textarea', label: 'What was your part in how they ended?' },
      { id: 'pattern', type: 'textarea', label: 'Which pattern will you never repeat?' },
    ],
  },
  {
    id: 'vow',
    title: 'The Trial of the Vow',
    kicker: 'Trial VII · would you take care of her?',
    photo: 'goddess-sunlit',
    intro: 'A goddess is cherished. Tell her how, and how much.',
    questions: CARE.flatMap(([id, name, prompt]) => [
      { id: `care_${id}`, type: 'choice', label: `Would you take care of her ${name.toLowerCase()}?`, options: CARE_OPTIONS, group: name },
      { id: `care_${id}_much`, type: 'scale', label: 'How much?', min: 1, max: 10, minLabel: 'A little', maxLabel: 'Everything I have' },
      { id: `care_${id}_how`, type: 'textarea', label: prompt, rows: 2 },
    ]),
  },
  {
    id: 'hearth',
    title: 'The Trial of the Hearth',
    kicker: 'Trial VIII · family & the wife you envision',
    photo: 'goddess-city',
    intro: 'Build the home in words first.',
    questions: [
      {
        id: 'kidsWanted', type: 'choice', label: 'How many kids do you want?',
        options: ['0', '1', '2', '3', '4', '5+'].map((v) => ({ value: v, label: v })).concat({ value: 'open', label: 'Open to what life brings' }),
      },
      {
        id: 'kidsWhen', type: 'choice', label: 'When?',
        options: [{ value: 'asap', label: 'As soon as possible' }, { value: '1-3y', label: 'In 1–3 years' }, { value: 'later', label: 'Later' }, { value: 'na', label: 'Not for me' }],
      },
      {
        id: 'wifeVibe', type: 'multi', label: 'The wife you envision is…',
        options: ['Ambitious', 'Nurturing', 'Wild', 'Spiritual', 'Glamorous', 'Homebody', 'Adventurous', 'Traditional', 'Independent', 'Playful', 'Intellectual', 'Devoted']
          .map((v) => ({ value: v, label: v })),
      },
      { id: 'wife', type: 'textarea', label: 'Describe the wife you envision, and a normal Tuesday with her.' },
      { id: 'husband', type: 'textarea', label: 'And what kind of husband will you be?' },
    ],
  },
  {
    id: 'desire',
    adult: true,
    title: 'The Trial of Desire',
    kicker: 'Trial IX · 18+ only',
    photo: 'goddess-witch',
    intro: 'Behind this veil: what you want in bed. Yes, no or maybe for each. Nothing here is judged; everything here is noted.',
    questions: [
      {
        id: 'frequency', type: 'choice', label: 'How often would you ideally want sex?',
        options: [{ value: 'daily+', label: 'Daily or more' }, { value: 'few-week', label: 'A few times a week' }, { value: 'weekly', label: 'Once a week' }, { value: 'less', label: 'Less often' }],
      },
      { id: 'kinks', type: 'ynm', label: 'Yes, no or maybe?', groups: KINKS },
      { id: 'limits', type: 'textarea', label: 'Your hard limits' },
      { id: 'secret', type: 'textarea', label: 'Anything else you crave that is not on the list?' },
    ],
  },
];

export const PHOTOS = {
  'goddess-witch': 'assets/photos/goddess-witch.jpg',
  'goddess-city': 'assets/photos/goddess-city.jpg',
  'goddess-sunlit': 'assets/photos/goddess-sunlit.jpg',
};
