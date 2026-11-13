// Builds accessible HTML inputs for each question type and keeps `answers` in sync.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

let uid = 0;
const nextId = (base) => `${base}-${++uid}`;

/** Renders one question. `onChange()` fires after `answers` is updated. */
export function renderQuestion(q, answers, onChange) {
  const set = (value) => { answers[q.id] = value; onChange(q); };
  // '' rather than null: Element.append() would print "null" as text.
  const hint = q.hint ? el('p', { class: 'hint', text: q.hint }) : '';
  const star = q.required ? el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }) : null;
  const wrap = el('div', { class: `q q-${q.type}`, 'data-q': q.id });
  if (q.group) wrap.append(el('h3', { class: 'q-group', text: q.group }));

  switch (q.type) {
    case 'text': case 'number': case 'date': case 'time': {
      const id = nextId(q.id);
      const input = el('input', {
        id, type: q.type, name: q.id, placeholder: q.placeholder, required: q.required,
        min: q.min, max: q.max, inputmode: q.type === 'number' ? 'numeric' : null,
        autocomplete: q.id === 'name' ? 'name' : 'off',
      });
      if (answers[q.id] != null) input.value = answers[q.id];
      input.addEventListener('input', () => {
        if (q.type !== 'number') return set(input.value);
        return set(input.value === '' ? null : Number(input.value));
      });
      wrap.append(el('label', { for: id }, q.label, star), hint, input);
      break;
    }
    case 'textarea': {
      const id = nextId(q.id);
      const area = el('textarea', { id, name: q.id, rows: q.rows ?? 3, required: q.required });
      area.value = answers[q.id] ?? '';
      area.addEventListener('input', () => set(area.value));
      wrap.append(el('label', { for: id }, q.label, star), hint, area);
      break;
    }
    case 'choice': {
      if (q.compact) {
        const id = nextId(q.id);
        const select = el('select', { id, name: q.id },
          el('option', { value: '', text: 'Choose…' }),
          q.options.map((o) => el('option', { value: o.value, text: o.label })));
        select.value = answers[q.id] ?? '';
        select.addEventListener('change', () => set(select.value || null));
        wrap.append(el('label', { for: id }, q.label, star), hint, select);
        break;
      }
      wrap.append(pills(q, 'radio', answers, set, star, hint));
      break;
    }
    case 'multi':
      wrap.append(pills(q, 'checkbox', answers, set, star, hint));
      break;
    case 'scale': {
      const id = nextId(q.id);
      const out = el('output', { for: id, class: 'scale-value', text: answers[q.id] ?? '–' });
      const range = el('input', { id, type: 'range', min: q.min, max: q.max, step: 1, name: q.id });
      range.value = answers[q.id] ?? Math.round((q.min + q.max) / 2);
      if (answers[q.id] == null) range.classList.add('untouched');
      range.addEventListener('input', () => {
        range.classList.remove('untouched');
        out.textContent = range.value;
        set(Number(range.value));
      });
      wrap.append(
        el('label', { for: id }, q.label, star, ' ', out), hint, range,
        el('div', { class: 'scale-ends', 'aria-hidden': 'true' }, el('span', { text: q.minLabel }), el('span', { text: q.maxLabel })),
      );
      break;
    }
    case 'list': {
      const values = Array.from({ length: q.count }, (_, i) => (answers[q.id] ?? [])[i] ?? '');
      const fs = el('fieldset', {}, el('legend', {}, q.label, star), hint);
      const ol = el('ol', { class: 'list-inputs' });
      values.forEach((value, i) => {
        const input = el('input', { type: 'text', 'aria-label': `${q.label} ${i + 1}`, name: `${q.id}-${i}` });
        input.value = value;
        input.addEventListener('input', () => { values[i] = input.value; set([...values]); });
        ol.append(el('li', {}, input));
      });
      fs.append(ol);
      wrap.append(fs);
      break;
    }
    case 'ynm': {
      const picks = { ...(answers[q.id] ?? {}) };
      const fs = el('fieldset', {}, el('legend', {}, q.label));
      for (const [groupName, items] of q.groups) {
        fs.append(el('h3', { class: 'ynm-group', text: groupName }));
        for (const item of items) {
          const name = nextId('ynm');
          const row = el('div', { class: 'ynm-row', role: 'radiogroup', 'aria-label': item }, el('span', { class: 'ynm-item', text: item }));
          for (const [value, label] of [['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No']]) {
            const input = el('input', { type: 'radio', name, value, class: `ynm-${value}` });
            input.checked = picks[item] === value;
            input.addEventListener('change', () => { picks[item] = value; set({ ...picks }); });
            row.append(el('label', { class: `pill pill-${value}` }, input, el('span', { text: label })));
          }
          fs.append(row);
        }
      }
      wrap.append(fs);
      break;
    }
    default:
      throw new Error(`Unknown question type ${q.type}`);
  }
  return wrap;
}

function pills(q, kind, answers, set, star, hint) {
  const name = nextId(q.id);
  const fs = el('fieldset', { class: 'pills' }, el('legend', {}, q.label, star), hint);
  const box = el('div', { class: 'pill-row' });
  const inputs = [];
  for (const option of q.options) {
    const input = el('input', { type: kind, name, value: option.value });
    const current = answers[q.id];
    input.checked = kind === 'radio' ? current === option.value : (current ?? []).includes(option.value);
    input.addEventListener('change', () => {
      if (kind === 'radio') return set(option.value);
      // "Never" style options cannot be combined with the others.
      if (input.checked && option.value === 'never') inputs.forEach((i) => { if (i !== input) i.checked = false; });
      else if (input.checked) inputs.forEach((i) => { if (i.value === 'never') i.checked = false; });
      return set(inputs.filter((i) => i.checked).map((i) => i.value));
    });
    inputs.push(input);
    box.append(el('label', { class: 'pill' }, input, el('span', { text: option.label })));
  }
  fs.append(box);
  return fs;
}

/** Ids of required questions in a section that are still unanswered or invalid. */
export function missingRequired(section, answers) {
  return section.questions.filter((q) => {
    if (!q.required) return false;
    const value = answers[q.id];
    if (value == null || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    if (q.type === 'number') return Number.isNaN(value) || (q.min != null && value < q.min) || (q.max != null && value > q.max);
    return false;
  }).map((q) => q.id);
}
