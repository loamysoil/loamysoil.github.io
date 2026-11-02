/**
 * Lift: the mark as three solids extruded down from the ground (the blade with its cut foot, the frame with its
 * window, the bar). The pointer picks a part on its rest top and it lifts out; the others follow a beat later and
 * rise a little, staggered by distance. At rest the parts are stepped and the window's rim is the bright mark.
 * The slider is the lift.
 */
import { MARK, ring, inside, centre } from "./mark.js";
const { Cam, fit, prism, proj, unproj, facing, ringAt, poly, open, tween, tset, tval, tdone, mk, put, register, pointer, disposer, solid } = HL;

const DEPTH = 24, RAD = 1.1, CREASE = 1, REST = [9, 0, -7], FOLLOW = 0.22, STEP = 45;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value, chosen = -1;
  const C = Cam(45, 0.5, 1.5);
  const ext = [];
  MARK.forEach((m, i) => m.pts.forEach(([x, y]) => { ext.push([x, y, REST[i] + 40], [x, y, REST[i] - DEPTH]); }));
  fit(C, ext, 200, 166);
  const P = proj(C), front = facing(C);

  const id = "hl-lift-" + Math.random().toString(36).slice(2);
  const defs = mk("defs", {}, svg), g = mk("g", {}, svg);
  // Back to front: blade, frame, bar sit at ascending x + y.
  const parts = MARK.map((m, i) => {
    const p = { ...m, i, rest: REST[i], tw: tween(REST[i]), drawn: NaN, out: ring(m.pts, RAD), inn: ring(m.pts, RAD, CREASE), el: solid(g), mid: centre(m.pts) };
    if (m.hole) {
      p.hr = ring(m.hole, 0.8);
      const clip = mk("clipPath", { id: id + i }, defs);
      p.cp = mk("path", {}, clip);
      p.rim = mk("path", { class: "hi" }, p.el.g);
      p.well = mk("path", { class: "lo nf", "clip-path": `url(#${id + i})` }, p.el.g);
    }
    return p;
  });

  function draw(p, z) {
    if (z === p.drawn) return;
    p.drawn = z;
    put(p.el, prism(P, front, p.out, p.inn, z - DEPTH, z));
    if (p.hr) {
      const top = poly(ringAt(P, p.hr, z)), bot = ringAt(P, p.hr, z - DEPTH);
      p.rim.setAttribute("d", top);
      p.cp.setAttribute("d", top);
      p.well.setAttribute("d", open(bot.concat([bot[0]])));
    }
  }
  function marks() {
    parts.forEach((p) => p.el.sil.classList.toggle("hi", p.i === chosen));
    parts[1].rim.setAttribute("class", chosen === -1 ? "hi" : "sil");
  }

  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const p of parts) { draw(p, tval(p.tw, now)); if (!tdone(p.tw, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  function retarget() {
    const now = performance.now();
    parts.forEach((p) => {
      const to = chosen === -1 ? p.rest : p.rest + (p.i === chosen ? LIFT : LIFT * FOLLOW);
      tset(p.tw, to, now, chosen === -1 ? 0 : Math.abs(p.i - chosen) * STEP);
    });
    read.textContent = chosen === -1 ? "rest" : parts[chosen].name;
    marks();
    B.wake();
  }

  // Rule 01: each part is tested on its own rest top, never on where it is drawn now.
  function pick(sx, sy) {
    let best = -1, d = Infinity;
    for (const p of parts) {
      const w = unproj(C, sx, sy, p.rest);
      if (!inside(p.pts, w)) continue;
      const e = Math.hypot(w[0] - p.mid[0], w[1] - p.mid[1]);
      if (e < d) { d = e; best = p.i; }
    }
    return best;
  }

  bag.add(pointer(stage, {
    move: (pt) => { const c = pick(pt[0], pt[1]); if (c !== chosen) { chosen = c; retarget(); } },
    leave: () => { if (chosen !== -1) { chosen = -1; retarget(); } },
  }));
  bag.add(() => svg.replaceChildren());

  parts.forEach((p) => draw(p, p.rest));
  marks();
  read.textContent = "rest";
  return { set: (v) => { LIFT = v; retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "lift",
  means: "The mark in three solids; the part under the pointer lifts out of the set.",
  rules: [1, 2, 5, 9],
  range: [16, 28, 40],
  tour: [[152, 143], [254, 178], [163, 238], null],
  mount,
});
