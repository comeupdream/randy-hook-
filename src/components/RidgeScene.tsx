/**
 * A living, procedurally generated Blue Ridge horizon — the view from the
 * Shenandoah Valley at first light, drawn and animated entirely in code.
 * It plays like a background video (sunrise, drifting valley mist, slow
 * clouds, a passing flock, rising light motes, pointer parallax) at zero
 * video payload: everything is SVG + CSS keyframes.
 *
 * Each ridgeline is built by seeded midpoint displacement: a deterministic
 * PRNG (so server and client render identically) roughens a baseline into a
 * mountain profile, and four layers stack with atmospheric perspective —
 * lightest and smoothest in the distance, deepest evergreen up close.
 *
 * Structure: every scene element sits inside a `.rs-px-*` parallax group
 * (consuming --par-x/--par-y from the <Parallax> wrapper) which wraps the
 * CSS-animated group — separate elements, so the transforms never fight.
 * All motion stops under prefers-reduced-motion (see globals.css).
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

export const RIDGE_W = 1440;
export const RIDGE_H = 460;

export const RIDGE_LAYERS = [
  // Farthest — pale mist, nearly flat.
  { seed: 11, base: 208, amplitude: 66, segments: 32, fill: "rgb(214 224 213)", opacity: 0.55 },
  { seed: 23, base: 252, amplitude: 92, segments: 64, fill: "rgb(168 187 170)", opacity: 0.7 },
  { seed: 47, base: 306, amplitude: 118, segments: 128, fill: "rgb(107 135 112)", opacity: 0.85 },
  // Nearest — deep evergreen.
  { seed: 83, base: 368, amplitude: 132, segments: 128, fill: "rgb(52 77 59)", opacity: 1 },
] as const;

export function ridgeLayerPath(i: number): string {
  return ridgePath({ ...RIDGE_LAYERS[i], width: RIDGE_W, height: RIDGE_H });
}

/** One drifting band of valley mist (two copies tile a seamless loop). */
function MistBand({ y, opacity = 0.2 }: { y: number; opacity?: number }) {
  const blobs: Array<[number, number, number]> = [
    // [cx, rx, ry]
    [110, 190, 22],
    [360, 150, 17],
    [620, 220, 26],
    [880, 160, 18],
    [1130, 210, 24],
    [1360, 140, 16],
  ];
  return (
    <>
      {blobs.map(([cx, rx, ry], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={y + (i % 2 === 0 ? 0 : 9)}
          rx={rx}
          ry={ry}
          fill="rgb(240 245 240)"
          opacity={opacity + (i % 3) * 0.05}
        />
      ))}
    </>
  );
}

/** A tiny three-bird flock glyph. */
function Flock() {
  const bird = "M0 0 Q4 -4 8 0 Q12 -4 16 0";
  return (
    <g stroke="rgb(56 74 62)" strokeWidth="1.7" fill="none" strokeLinecap="round">
      <path d={bird} />
      <path d={bird} transform="translate(24 11) scale(0.82)" />
      <path d={bird} transform="translate(46 4) scale(0.66)" />
    </g>
  );
}

/** Rising motes of dawn light near the valley floor. */
const MOTES: Array<{ x: number; y: number; r: number; dur: number; delay: number }> = [
  { x: 150, y: 400, r: 2.2, dur: 11, delay: 0 },
  { x: 320, y: 428, r: 1.6, dur: 9, delay: 2.2 },
  { x: 505, y: 392, r: 2.6, dur: 13, delay: 4.1 },
  { x: 668, y: 434, r: 1.8, dur: 10, delay: 1.3 },
  { x: 815, y: 405, r: 2.3, dur: 12, delay: 5.4 },
  { x: 990, y: 430, r: 1.5, dur: 9.5, delay: 3.2 },
  { x: 1150, y: 398, r: 2.4, dur: 12.5, delay: 0.8 },
  { x: 1310, y: 424, r: 1.9, dur: 10.5, delay: 6.1 },
];

export default function RidgeScene({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${RIDGE_W} ${RIDGE_H}`}
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
        <filter id="rs-soften" x="-30%" y="-300%" width="160%" height="700%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="rs-soften-lg" x="-40%" y="-400%" width="180%" height="900%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* ---------------------------------------------------- sky (depth 1) */}
      <g className="rs-px rs-px-sky">
        {/* Dawn glow breathing behind the far ridge. */}
        <ellipse
          cx={RIDGE_W / 2}
          cy={236}
          rx={520}
          ry={220}
          fill="url(#ridge-dawn)"
          className="rs-breathe"
        />

        {/* Slow clouds. */}
        <g className="rs-cloud rs-cloud-1" filter="url(#rs-soften-lg)">
          <ellipse cx={300} cy={112} rx={150} ry={20} fill="white" opacity={0.5} />
          <ellipse cx={392} cy={97} rx={92} ry={14} fill="white" opacity={0.42} />
        </g>
        <g className="rs-cloud rs-cloud-2" filter="url(#rs-soften-lg)">
          <ellipse cx={1020} cy={74} rx={170} ry={18} fill="white" opacity={0.4} />
          <ellipse cx={1120} cy={88} rx={100} ry={13} fill="white" opacity={0.34} />
        </g>

        {/* The sun rises once on load; its halo keeps a soft pulse. */}
        <g className="rs-sunrise">
          <circle
            className="rs-halo"
            cx={RIDGE_W / 2}
            cy={216}
            r={92}
            fill="rgb(245 222 178)"
            opacity={0.35}
          />
          <circle cx={RIDGE_W / 2} cy={216} r={46} fill="rgb(245 222 178)" opacity={0.95} />
        </g>

        {/* Passing flocks (hidden entirely under reduced motion). */}
        <g className="rs-flock rs-flock-1" opacity="0" transform="translate(-200 0)">
          <g transform="translate(0 132)">
            <Flock />
          </g>
        </g>
        <g className="rs-flock rs-flock-2" opacity="0" transform="translate(-200 0)">
          <g transform="translate(0 84) scale(0.72)">
            <Flock />
          </g>
        </g>
      </g>

      {/* --------------------------------------------- far ridge (depth 2) */}
      <g className="rs-px rs-px-far">
        <path d={ridgeLayerPath(0)} fill={RIDGE_LAYERS[0].fill} opacity={RIDGE_LAYERS[0].opacity} />
        {/* High valley mist drifting between the far ridges. */}
        <g filter="url(#rs-soften)" opacity={0.8}>
          <g className="rs-mist-track rs-mist-slow">
            <MistBand y={246} opacity={0.16} />
            <g transform={`translate(${-RIDGE_W} 0)`}>
              <MistBand y={246} opacity={0.16} />
            </g>
          </g>
        </g>
        <path d={ridgeLayerPath(1)} fill={RIDGE_LAYERS[1].fill} opacity={RIDGE_LAYERS[1].opacity} />
      </g>

      {/* --------------------------------------------- mid ridge (depth 3) */}
      <g className="rs-px rs-px-mid">
        {/* Lower mist, moving a touch faster the nearer it is. */}
        <g filter="url(#rs-soften)" opacity={0.75}>
          <g className="rs-mist-track rs-mist-fast">
            <MistBand y={306} opacity={0.14} />
            <g transform={`translate(${-RIDGE_W} 0)`}>
              <MistBand y={306} opacity={0.14} />
            </g>
          </g>
        </g>
        <path d={ridgeLayerPath(2)} fill={RIDGE_LAYERS[2].fill} opacity={RIDGE_LAYERS[2].opacity} />
      </g>

      {/* -------------------------------------------- near ridge (depth 4) */}
      <g className="rs-px rs-px-near">
        <path d={ridgeLayerPath(3)} fill={RIDGE_LAYERS[3].fill} opacity={RIDGE_LAYERS[3].opacity} />
        {/* Rising motes of dawn light (hidden under reduced motion). */}
        <g fill="rgb(197 164 98)">
          {MOTES.map((m, i) => (
            <circle
              key={i}
              className="rs-mote"
              cx={m.x}
              cy={m.y}
              r={m.r}
              opacity="0"
              style={{ animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
