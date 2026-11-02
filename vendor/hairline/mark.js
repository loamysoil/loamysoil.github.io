/* Shared by the three figures: Liam Owen's mark, read from images/logo.svg (a 635 × 635 drawing), as convex
   footprints in world units, and the rounded rings the kernel's prism() takes. Proportions are the drawing's own. */
const K = 1 / 5;
const s = (q) => q.map(([x, y]) => [x * K, y * K]);
export const MARK = [
  { name: "blade", pts: s([[0, 0], [189.58, 0], [189.58, 634.73], [0, 445.15]]) },
  { name: "frame", pts: s([[220.96, 0], [635, 0], [635, 414.04], [220.96, 414.04]]), hole: s([[342.5, 121.54], [513.46, 121.54], [513.46, 292.5], [342.5, 292.5]]) },
  { name: "bar", pts: s([[220.96, 445.85], [635, 445.85], [635, 635], [220.96, 635]]) },
];
export const SIDE = 635 * K;
const area = (q) => q.reduce((a, p, i) => { const n = q[(i + 1) % q.length]; return a + p[0] * n[1] - n[0] * p[1]; }, 0);
const norms = (q) => { const g = Math.sign(area(q)); return q.map((p, i) => { const n = q[(i + 1) % q.length], dx = n[0] - p[0], dy = n[1] - p[1], l = Math.hypot(dx, dy); return [(g * dy) / l, (-g * dx) / l]; }); };
/** A convex polygon moved in by d. */
export function inset(q, d) {
  const N = norms(q), L = q.length, line = (i) => ({ p: [q[i][0] - N[i][0] * d, q[i][1] - N[i][1] * d], dir: [q[(i + 1) % L][0] - q[i][0], q[(i + 1) % L][1] - q[i][1]] });
  return q.map((_, i) => {
    const a = line((i - 1 + L) % L), b = line(i), den = a.dir[0] * b.dir[1] - a.dir[1] * b.dir[0];
    const t = ((b.p[0] - a.p[0]) * b.dir[1] - (b.p[1] - a.p[1]) * b.dir[0]) / den;
    return [a.p[0] + a.dir[0] * t, a.p[1] + a.dir[1] * t];
  });
}
/** A convex polygon with every corner rounded to r, as a ring of {u, v, nu, nv}; b moves it in, for the crease. */
export function ring(q, r, b = 0, steps = 4) {
  const c = inset(q, r), N = norms(q), L = q.length, out = [];
  for (let i = 0; i < L; i++) {
    let a0 = Math.atan2(N[(i - 1 + L) % L][1], N[(i - 1 + L) % L][0]), a1 = Math.atan2(N[i][1], N[i][0]);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    for (let k = 0; k <= steps; k++) { const a = a0 + (da * k) / steps, nu = Math.cos(a), nv = Math.sin(a); out.push({ u: c[i][0] + (r - b) * nu, v: c[i][1] + (r - b) * nv, nu, nv }); }
  }
  return out;
}
/** Turns a ring about (cx, cy) by th radians. */
export const turn = (R, th, cx, cy) => { const c = Math.cos(th), s2 = Math.sin(th); return R.map(({ u, v, nu, nv }) => ({ u: cx + (u - cx) * c - (v - cy) * s2, v: cy + (u - cx) * s2 + (v - cy) * c, nu: nu * c - nv * s2, nv: nu * s2 + nv * c })); };
export const inside = (q, [x, y]) => { const g = Math.sign(area(q)); return q.every((p, i) => { const n = q[(i + 1) % q.length]; return g * ((n[0] - p[0]) * (y - p[1]) - (n[1] - p[1]) * (x - p[0])) >= 0; }); };
export const centre = (q) => [q.reduce((a, p) => a + p[0], 0) / q.length, q.reduce((a, p) => a + p[1], 0) / q.length];
