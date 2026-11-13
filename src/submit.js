// Turns his answers into readable text and sends them to Shalini's Google Form.

const YNM_LABELS = { yes: 'Yes', maybe: 'Maybe', no: 'No' };

/** Human-readable value of one answer, or '' when it was left blank. */
export function formatAnswer(question, value) {
  if (value == null || value === '') return '';
  switch (question.type) {
    case 'choice': {
      const option = question.options.find((o) => o.value === value);
      return option ? option.label : String(value);
    }
    case 'multi':
      return (Array.isArray(value) ? value : [value])
        .map((v) => question.options.find((o) => o.value === v)?.label ?? v)
        .join(', ');
    case 'scale':
      return `${value}/${question.max}`;
    case 'list':
      return (Array.isArray(value) ? value : []).filter(Boolean).map((v, i) => `${i + 1}. ${v}`).join('; ');
    case 'ynm': {
      const grouped = { yes: [], maybe: [], no: [] };
      for (const [item, pick] of Object.entries(value ?? {})) grouped[pick]?.push(item);
      return Object.entries(grouped)
        .filter(([, items]) => items.length)
        .map(([pick, items]) => `${YNM_LABELS[pick]}: ${items.join(', ')}`)
        .join('\n');
    }
    default:
      return String(value).trim();
  }
}

/** One block of "Question: answer" lines for a section; blank answers are left out. */
export function formatSection(section, answers, extras = []) {
  const lines = [];
  for (const question of section.questions) {
    const text = formatAnswer(question, answers[question.id]);
    if (!text) continue;
    const joiner = text.includes('\n') ? '\n' : /[?.!]$/.test(question.label) ? ' ' : ': ';
    lines.push(`${question.label}${joiner}${text}`);
  }
  return [...extras, ...lines].join('\n');
}

/**
 * Builds { fieldKey: text } for the form: one field per section plus his identity and verdict.
 * @param {{passed: boolean, reasons: string[]}} verdict
 * @param {Record<string, string[]>} extras  extra lines per section id (e.g. computed sun sign)
 */
export function buildPayload(sections, answers, verdict, extras = {}) {
  const payload = {
    verdict: verdict.passed ? 'Passed the gate' : `Turned away: ${verdict.reasons.join(', ')}`,
    name: answers.name ?? '',
    contact: answers.contact ?? '',
    age: answers.age == null ? '' : String(answers.age),
    city: answers.city ?? '',
  };
  for (const section of sections) {
    if (section.id === 'intro') continue;
    payload[section.id] = formatSection(section, answers, extras[section.id]);
  }
  return payload;
}

/** The whole questionnaire as one plain-text document, for demo mode and downloads. */
export function payloadToText(sections, payload) {
  const title = Object.fromEntries(sections.map((s) => [s.id, s.title]));
  const head = [
    `Name: ${payload.name}`, `Age: ${payload.age}`, `City: ${payload.city}`,
    `Contact: ${payload.contact}`, `Verdict: ${payload.verdict}`,
  ];
  const body = sections
    .filter((s) => s.id !== 'intro' && payload[s.id])
    .map((s) => `\n== ${title[s.id]} ==\n${payload[s.id]}`);
  return [...head, ...body].join('\n');
}

export function isConfigured(form) {
  return Boolean(form?.formId) && Object.values(form.fields ?? {}).some(Boolean);
}

/** URL-encoded body for Google Forms: entry.NNNN=value for every mapped field. */
export function toFormBody(payload, fields) {
  const body = new URLSearchParams();
  for (const [key, entry] of Object.entries(fields)) {
    if (!entry || payload[key] == null) continue;
    body.append(entry.startsWith('entry.') ? entry : `entry.${entry}`, payload[key]);
  }
  return body;
}

/**
 * Sends to Google Forms. Google does not allow reading the reply from another site, so a
 * request that leaves the browser without a network error counts as sent.
 */
export async function send(payload, form, fetchImpl = globalThis.fetch) {
  if (!isConfigured(form)) return { sent: false, demo: true };
  const url = `https://docs.google.com/forms/d/e/${encodeURIComponent(form.formId)}/formResponse`;
  try {
    await fetchImpl(url, { method: 'POST', mode: 'no-cors', body: toFormBody(payload, form.fields) });
    return { sent: true };
  } catch (error) {
    return { sent: false, error: String(error) };
  }
}
