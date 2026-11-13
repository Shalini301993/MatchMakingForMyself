// The living backdrop: a saffron sky, a slow mandala sun, tiger stripes at the edges and
// marigold petals drifting down. p5 instance mode, behind all the page content.

const MOODS = {
  dawn: { top: '#ffcf6b', bottom: '#f0682c', sun: '#fff3c4', stripe: '#2a120a', stars: 0 },
  fire: { top: '#ffb13b', bottom: '#c8331f', sun: '#ffe08a', stripe: '#200b06', stars: 0 },
  night: { top: '#120c3a', bottom: '#5b1f6e', sun: '#ffd27a', stripe: '#0a0618', stars: 1 },
  rose: { top: '#ffb38a', bottom: '#c2325b', sun: '#ffe6d2', stripe: '#2b0b16', stars: 0 },
  desire: { top: '#2a0614', bottom: '#8c0f2e', sun: '#ff9a6b', stripe: '#120208', stars: 0.6 },
};

const PETAL_COLORS = ['#ffb000', '#ff8a00', '#ff6a00', '#ffd23f', '#e8451e'];

export function createBackground(container) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let api = { setMood() {}, celebrate() {} };

  // eslint-disable-next-line no-undef
  new p5((p) => {
    let sky;
    let stripes = [];
    let stars = [];
    const petals = [];
    let mood = MOODS.dawn;
    let target = MOODS.dawn;
    let blend = 1;

    const makePetal = (x, y, burst = false) => ({
      x: x ?? p.random(p.width),
      y: y ?? p.random(-p.height, 0),
      vx: burst ? p.random(-4, 4) : 0,
      vy: burst ? p.random(-7, -1) : p.random(0.4, 1.3),
      rot: p.random(p.TWO_PI),
      spin: p.random(-0.03, 0.03),
      size: p.random(8, 18),
      color: p.random(PETAL_COLORS),
      seed: p.random(1000),
      life: burst ? 1 : Infinity,
    });

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
      stripes = [];
      const count = Math.ceil(p.height / 70);
      for (const side of [0, 1]) {
        for (let i = 0; i < count; i++) {
          stripes.push({
            side,
            y: (i + p.random(0.1, 0.9)) * (p.height / count),
            len: p.random(0.05, 0.13) * Math.max(p.width, 700),
            thick: p.random(10, 26),
            bend: p.random(-30, 30),
          });
        }
      }
      stars = Array.from({ length: 120 }, () => ({ x: p.random(p.width), y: p.random(p.height), r: p.random(0.6, 2.2), t: p.random(1000) }));
      paintSky();
    };

    const drawStripe = (s) => {
      const dir = s.side === 0 ? 1 : -1;
      const x0 = s.side === 0 ? -10 : p.width + 10;
      p.beginShape();
      for (let t = 0; t <= 1.0001; t += 0.1) {
        const half = s.thick * (1 - t) * 0.5;
        p.vertex(x0 + dir * s.len * t, s.y - half + s.bend * t * t);
      }
      for (let t = 1; t >= -0.0001; t -= 0.1) {
        const half = s.thick * (1 - t) * 0.5;
        p.vertex(x0 + dir * s.len * t, s.y + half + s.bend * t * t);
      }
      p.endShape(p.CLOSE);
    };

    const drawMandala = (palette) => {
      const cx = p.width / 2;
      const cy = Math.min(p.height * 0.18, 160);
      const r = Math.min(p.width, p.height) * 0.28;
      p.push();
      p.translate(cx, cy);
      p.rotate(reduceMotion ? 0 : p.frameCount * 0.0015);
      const sun = p.color(palette.sun);
      for (let ring = 3; ring >= 1; ring--) {
        sun.setAlpha(26 + ring * 8);
        p.fill(sun);
        const petalsInRing = 8 + ring * 4;
        for (let i = 0; i < petalsInRing; i++) {
          p.push();
          p.rotate((p.TWO_PI * i) / petalsInRing + ring * 0.2);
          p.ellipse(0, r * ring * 0.3, r * 0.12 * ring * 0.6, r * 0.34 * ring * 0.4);
          p.pop();
        }
      }
      sun.setAlpha(70);
      p.fill(sun);
      p.circle(0, 0, r * 0.45);
      p.pop();
    };

    const drawPetal = (pt) => {
      p.push();
      p.translate(pt.x, pt.y);
      p.rotate(pt.rot);
      const c = p.color(pt.color);
      if (pt.life !== Infinity) c.setAlpha(255 * Math.max(0, pt.life));
      p.fill(c);
      for (let i = 0; i < 5; i++) {
        p.rotate(p.TWO_PI / 5);
        p.ellipse(pt.size * 0.32, 0, pt.size * 0.6, pt.size * 0.36);
      }
      p.fill(120, 40, 0, 200 * (pt.life === Infinity ? 1 : Math.max(0, pt.life)));
      p.circle(0, 0, pt.size * 0.25);
      p.pop();
    };

    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.elt.setAttribute('aria-hidden', 'true');
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      p.noStroke();
      layout();
      const count = p.width < 600 ? 22 : 40;
      for (let i = 0; i < count; i++) petals.push(makePetal(null, p.random(p.height)));
      if (reduceMotion) p.frameRate(4);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      layout();
    };

    p.draw = () => {
      if (blend < 1) {
        blend = Math.min(1, blend + 0.04);
        paintSky();
        if (blend === 1) mood = target;
      }
      p.image(sky, 0, 0);
      const palette = blend < 1 ? target : mood;

      if (palette.stars) {
        for (const s of stars) {
          const twinkle = reduceMotion ? 0.7 : 0.5 + 0.5 * Math.sin(p.millis() / 600 + s.t);
          p.fill(255, 240, 210, 220 * twinkle * palette.stars);
          p.circle(s.x, s.y, s.r * 2);
        }
      }

      drawMandala(palette);

      const stripe = p.color(palette.stripe);
      stripe.setAlpha(200);
      p.fill(stripe);
      stripes.forEach(drawStripe);

      for (let i = petals.length - 1; i >= 0; i--) {
        const pt = petals[i];
        if (!reduceMotion) {
          pt.x += pt.vx + Math.sin(p.millis() / 900 + pt.seed) * 0.5;
          pt.y += pt.vy;
          pt.rot += pt.spin;
          if (pt.life !== Infinity) { pt.vy += 0.12; pt.vx *= 0.99; pt.life -= 0.008; }
        }
        drawPetal(pt);
        if (pt.life <= 0) petals.splice(i, 1);
        else if (pt.life === Infinity && pt.y > p.height + 20) Object.assign(pt, makePetal(null, -20));
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
        if (!p.width) return;
        for (let i = 0; i < 90; i++) petals.push(makePetal(p.width / 2 + p.random(-60, 60), p.height * 0.55, true));
      },
    };
  }, container);

  return {
    setMood: (name) => api.setMood(name),
    celebrate: () => api.celebrate(),
  };
}
