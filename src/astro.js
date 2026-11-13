// Sun signs from a birth date, and a playful compatibility reading against the goddess's chart.

export const SIGNS = [
  { name: 'Aries', glyph: '♈', element: 'fire', from: [3, 21] },
  { name: 'Taurus', glyph: '♉', element: 'earth', from: [4, 20] },
  { name: 'Gemini', glyph: '♊', element: 'air', from: [5, 21] },
  { name: 'Cancer', glyph: '♋', element: 'water', from: [6, 21] },
  { name: 'Leo', glyph: '♌', element: 'fire', from: [7, 23] },
  { name: 'Virgo', glyph: '♍', element: 'earth', from: [8, 23] },
  { name: 'Libra', glyph: '♎', element: 'air', from: [9, 23] },
  { name: 'Scorpio', glyph: '♏', element: 'water', from: [10, 23] },
  { name: 'Sagittarius', glyph: '♐', element: 'fire', from: [11, 22] },
  { name: 'Capricorn', glyph: '♑', element: 'earth', from: [12, 22] },
  { name: 'Aquarius', glyph: '♒', element: 'air', from: [1, 20] },
  { name: 'Pisces', glyph: '♓', element: 'water', from: [2, 19] },
];

const byName = Object.fromEntries(SIGNS.map((sign) => [sign.name, sign]));

/** Tropical sun sign for a "YYYY-MM-DD" date. Returns null for an invalid date. */
export function sunSign(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate ?? '');
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const key = month * 100 + day;
  // Walk the signs from latest start date in the calendar year to earliest.
  const ordered = [...SIGNS].sort((a, b) => (b.from[0] * 100 + b.from[1]) - (a.from[0] * 100 + a.from[1]));
  const found = ordered.find((sign) => key >= sign.from[0] * 100 + sign.from[1]);
  const sign = found ?? byName.Capricorn; // Jan 1–19
  // Cusp dates shift by a day between years, so flag the two days either side of a change.
  const onCusp = SIGNS.some((s) => {
    const start = new Date(Date.UTC(2001, s.from[0] - 1, s.from[1]));
    const birth = new Date(Date.UTC(2001, month - 1, day));
    return Math.abs(birth - start) <= 86_400_000;
  });
  return { ...sign, onCusp };
}

const SUPPORTIVE = { fire: 'air', air: 'fire', earth: 'water', water: 'earth' };

/** 0–100 harmony between two signs, traditional element logic with a little flattery. */
export function pairScore(a, b) {
  const x = byName[a];
  const y = byName[b];
  if (!x || !y) return null;
  const gap = Math.abs(SIGNS.indexOf(x) - SIGNS.indexOf(y));
  if (x === y) return 86;
  if (gap === 6) return 78; // opposites attract
  if (x.element === y.element) return 92;
  if (SUPPORTIVE[x.element] === y.element) return 84;
  return 58;
}

/**
 * Compares his signs with hers. His moon and rising are optional.
 * @returns {{score: number, lines: string[]}}
 */
export function compatibility(his, hers) {
  const pairs = [
    ['sun', 'sun', 'Your sun meets her sun', 3],
    ['sun', 'moon', 'Your sun warms her moon', 1],
    ['moon', 'moon', 'Your moon beside her moon', 2],
    ['rising', 'rising', 'Your rising faces her rising', 1],
  ];
  let total = 0;
  let weight = 0;
  const lines = [];
  for (const [mine, theirs, label, w] of pairs) {
    const score = pairScore(his[mine], hers[theirs]);
    if (score == null) continue;
    total += score * w;
    weight += w;
    lines.push(`${label} (${his[mine]} × ${hers[theirs]}): ${verdict(score)}`);
  }
  return { score: weight ? Math.round(total / weight) : 0, lines };
}

function verdict(score) {
  if (score >= 90) return 'kindred spirits';
  if (score >= 84) return 'easy, natural pull';
  if (score >= 78) return 'magnetic tension';
  return 'friction that could forge something, or burn it';
}
