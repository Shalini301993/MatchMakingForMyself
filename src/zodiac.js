// A zodiac wheel that turns to bring his sun sign to the top, with her Leo sun and
// Capricorn moon and rising softly marked.

import { SIGNS } from './astro.js';

const ELEMENT_COLORS = { fire: '#8f6fc4', earth: '#7a6b8f', air: '#9a8cc0', water: '#6f64a8' };

export function createZodiac(container, hers) {
  let api = { setSign() {} };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // eslint-disable-next-line no-undef
  const instance = new p5((p) => {
    let angle = 0;
    let goal = 0;
    let his = null;
    const step = p.TWO_PI / 12;

    p.setup = () => {
      const size = Math.min(container.clientWidth || 280, 300);
      const canvas = p.createCanvas(size, size);
      canvas.elt.setAttribute('role', 'img');
      canvas.elt.setAttribute('aria-label', 'Zodiac wheel');
      p.textAlign(p.CENTER, p.CENTER);
      p.textFont('Cormorant Garamond, Georgia, serif');
    };

    p.draw = () => {
      angle += (goal - angle) * (reduceMotion ? 1 : 0.1);
      p.clear();
      const r = p.width / 2 - 6;
      p.translate(p.width / 2, p.height / 2);

      p.noStroke();
      p.fill(255, 255, 255, 235);
      p.circle(0, 0, r * 2);
      p.stroke('#d9cdee');
      p.strokeWeight(1);
      p.noFill();
      p.circle(0, 0, r * 2);
      p.circle(0, 0, r * 1.3);

      SIGNS.forEach((sign, i) => {
        const a = angle + i * step - p.HALF_PI;
        const isHis = his === sign.name;
        const isHers = [hers.sun, hers.moon, hers.rising].includes(sign.name);
        p.push();
        p.rotate(a + step / 2);
        p.stroke('#ebe4f6');
        p.strokeWeight(1);
        p.line(r * 0.65, 0, r, 0);
        p.pop();
        const x = Math.cos(a) * r * 0.83;
        const y = Math.sin(a) * r * 0.83;
        p.noStroke();
        if (isHis) { p.fill('#7c5cc4'); p.circle(x, y, r * 0.3); }
        else if (isHers) { p.fill(201, 182, 232, 120); p.circle(x, y, r * 0.24); }
        p.fill(isHis ? '#fff' : ELEMENT_COLORS[sign.element]);
        p.textSize(r * 0.17);
        p.text(`${sign.glyph}\uFE0E`, x, y + 1);
      });

      // Pointer at the top.
      p.fill('#7c5cc4');
      p.noStroke();
      p.triangle(-9, -r - 2, 9, -r - 2, 0, -r + 14);

      p.fill('#2d2640');
      p.textSize(r * 0.13);
      p.text(his ?? 'Your sign?', 0, -6);
      p.textSize(r * 0.08);
      p.fill('#8a7fa3');
      p.text(`Hers: ☉ ${hers.sun} · ☽ ${hers.moon}`, 0, r * 0.14);
    };

    api = {
      setSign(name) {
        const index = SIGNS.findIndex((s) => s.name === name);
        his = index >= 0 ? name : null;
        if (index < 0) return;
        // Turn the shortest way so this sign lands at the top.
        const want = -index * step;
        const turns = Math.round((angle - want) / p.TWO_PI);
        goal = want + turns * p.TWO_PI;
      },
    };
  }, container);

  return {
    setSign: (name) => api.setSign(name),
    remove: () => instance.remove(),
  };
}
