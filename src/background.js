// A quiet lavender backdrop: a soft wash with a few translucent orbs drifting slowly, and a
// gentle shower of tiny petals on each step forward. p5 instance mode, behind the page.

const MOODS = {
  dawn: { top: '#faf8fd', bottom: '#ece5f6', orb: '#c9b6e8' },
  fire: { top: '#fbf7fc', bottom: '#efe1f0', orb: '#d7b4dc' },
  night: { top: '#efeaf8', bottom: '#d9cdee', orb: '#a991d6' },
  rose: { top: '#fcf8fb', bottom: '#f0e3ee', orb: '#dcb8d4' },
  desire: { top: '#f3ecf6', bottom: '#dfcde6', orb: '#b98fc9' },
};

const PETALS = ['#b9a3e3', '#cdbbef', '#9f86d4', '#e2d6f6'];

export function createBackground(container) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let api = { setMood() {}, celebrate() {} };

  // eslint-disable-next-line no-undef
  new p5((p) => {
    let sky;
    let orbs = [];
    const petals = [];
    let mood = MOODS.dawn;
    let target = MOODS.dawn;
    let blend = 1;

    const paintSky = () => {
      const from = p.lerpColor(p.color(mood.top), p.color(target.top), blend);
      const to = p.lerpColor(p.color(mood.bottom), p.color(target.bottom), blend);
      sky = p.createGraphics(p.width, p.height);
      sky.pixelDensity(1);
      sky.noStroke();
      for (let y = 0; y < p.height; y += 4) {
        sky.fill(p.lerpColor(from, to, y / p.height));
        sky.rect(0, y, p.width, 4);
      }
    };

    const layout = () => {
      const count = p.width < 600 ? 5 : 8;
      orbs = Array.from({ length: count }, (_, i) => ({
        x: p.random(p.width),
        y: p.random(p.height),
        r: p.random(0.18, 0.42) * Math.max(p.width, p.height) * (p.width < 600 ? 0.8 : 0.5),
        seed: i * 97 + p.random(100),
      }));
      paintSky();
    };

    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.elt.setAttribute('aria-hidden', 'true');
      p.pixelDensity(1);
      p.noStroke();
      layout();
      if (reduceMotion) p.frameRate(2);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      layout();
    };

    p.draw = () => {
      if (blend < 1) {
        blend = Math.min(1, blend + 0.05);
        paintSky();
        if (blend === 1) mood = target;
      }
      p.image(sky, 0, 0);

      const palette = blend < 1 ? target : mood;
      const t = reduceMotion ? 0 : p.millis() / 1000;
      const orbColor = p.color(palette.orb);
      for (const o of orbs) {
        const x = o.x + Math.sin(t * 0.05 + o.seed) * 60;
        const y = o.y + Math.cos(t * 0.04 + o.seed) * 50;
        // Layered circles fake a soft blur cheaply.
        for (let k = 6; k >= 1; k--) {
          orbColor.setAlpha(7);
          p.fill(orbColor);
          p.circle(x, y, o.r * (0.45 + k * 0.1));
        }
      }

      for (let i = petals.length - 1; i >= 0; i--) {
        const pt = petals[i];
        if (!reduceMotion) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.06;
          pt.vx *= 0.99;
          pt.rot += pt.spin;
          pt.life -= 0.012;
        }
        const c = p.color(pt.color);
        c.setAlpha(200 * Math.max(0, pt.life));
        p.push();
        p.translate(pt.x, pt.y);
        p.rotate(pt.rot);
        p.fill(c);
        p.ellipse(0, 0, pt.size, pt.size * 0.55);
        p.pop();
        if (pt.life <= 0 || reduceMotion) petals.splice(i, 1);
      }
    };

    api = {
      setMood(name) {
        const next = MOODS[name] ?? MOODS.dawn;
        if (next === target) return;
        mood = blend < 1 ? target : mood;
        target = next;
        blend = 0;
      },
      celebrate() {
        if (!p.width || reduceMotion) return;
        for (let i = 0; i < 40; i++) {
          petals.push({
            x: p.width / 2 + p.random(-80, 80),
            y: p.height * 0.45,
            vx: p.random(-3, 3),
            vy: p.random(-5, -1.5),
            rot: p.random(p.TWO_PI),
            spin: p.random(-0.05, 0.05),
            size: p.random(6, 12),
            color: p.random(PETALS),
            life: 1,
          });
        }
      },
    };
  }, container);

  return {
    setMood: (name) => api.setMood(name),
    celebrate: () => api.celebrate(),
  };
}
