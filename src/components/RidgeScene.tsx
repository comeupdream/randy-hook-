/**
 * A procedurally generated Blue Ridge horizon — the view from the Shenandoah
 * Valley at first light, drawn entirely in code (no image assets).
 *
 * Each ridgeline is built by seeded midpoint displacement: a deterministic
 * PRNG (so server and client render identically) roughens a baseline into a
 * mountain profile, and four layers stack with atmospheric perspective —
 * lightest and smoothest in the distance, deepest evergreen up close. A dawn
 * glow rises behind the far ridge.
 *
 * Server component: renders once to static SVG. The gentle drift on the mist
 * layers is pure CSS and disabled for prefers-reduced-motion.
 */

/** Deterministic PRNG (mulberry32) so the ridges never shift between renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Midpoint-displacement ridgeline across [0, width] at `base` height. */
function ridgePath(opts: {
  seed: number;
  width: number;
  height: number;
  base: number; // y of the ridge's midline (0 = top)
  amplitude: number; // initial displacement, halves each octave
  segments: number; // final point count = segments + 1
}): string {
  const { seed, width, height, base, amplitude, segments } = opts;
  const rnd = mulberry32(seed);

  // Start with the two endpoints, then displace midpoints recursively.
  let points: { x: number; y: number }[] = [
    { x: 0, y: base + (rnd() - 0.5) * amplitude },
    { x: width, y: base + (rnd() - 0.5) * amplitude },
  ];
  let amp = amplitude;
  while (points.length < segments + 1) {
    const next: { x: number; y: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      next.push(a);
      next.push({
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2 + (rnd() - 0.5) * amp,
      });
    }
    next.push(points[points.length - 1]);
    points = next;
    amp *= 0.55;
  }

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  return `${line} L${width} ${height} L0 ${height} Z`;
}

const W = 1440;
const H = 460;

const LAYERS = [
  // Farthest — pale mist, nearly flat.
  { seed: 11, base: 208, amplitude: 66, segments: 32, fill: "rgb(214 224 213)", opacity: 0.55 },
  { seed: 23, base: 252, amplitude: 92, segments: 64, fill: "rgb(168 187 170)", opacity: 0.7 },
  { seed: 47, base: 306, amplitude: 118, segments: 128, fill: "rgb(107 135 112)", opacity: 0.85 },
  // Nearest — deep evergreen.
  { seed: 83, base: 368, amplitude: 132, segments: 128, fill: "rgb(52 77 59)", opacity: 1 },
] as const;

export default function RidgeScene({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="ridge-dawn" cx="50%" cy="58%" r="62%">
          <stop offset="0%" stopColor="rgb(245 222 178)" stopOpacity="0.9" />
          <stop offset="45%" stopColor="rgb(242 227 208)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(242 227 208)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Dawn glow rising behind the far ridge. */}
      <ellipse cx={W / 2} cy={236} rx={520} ry={220} fill="url(#ridge-dawn)" className="animate-breathe" />
      <circle cx={W / 2} cy={216} r={46} fill="rgb(245 222 178)" opacity={0.95} />

      {LAYERS.map((layer, i) => (
        <path
          key={layer.seed}
          d={ridgePath({ ...layer, width: W, height: H })}
          fill={layer.fill}
          opacity={layer.opacity}
          className={i === 1 ? "animate-drift" : undefined}
          style={i === 1 ? { animationDuration: "12s" } : undefined}
        />
      ))}
    </svg>
  );
}
