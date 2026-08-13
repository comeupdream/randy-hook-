/**
 * The hero's gutter columns — a slow vertical drift of strong, giving words
 * beside the sunrise footage. Pure CSS marquee (the list is doubled and the
 * track translates -50%, so the loop is seamless); the left column rises,
 * the right descends. Faded top and bottom by a mask, frozen entirely under
 * prefers-reduced-motion. "possibility" passes in the sun's gold.
 */

const WORDS = [
  "hope",
  "love",
  "peace",
  "spirit",
  "healing",
  "courage",
  "grace",
  "possibility",
  "strength",
  "stillness",
  "renewal",
  "belonging",
  "presence",
  "becoming",
];

function WordStack() {
  return (
    <div className="flex flex-col items-center">
      {WORDS.map((w) => (
        <span
          key={w}
          className={`py-7 font-serif text-xl italic leading-none ${
            w === "possibility" ? "text-sun/80" : "text-accent/35"
          }`}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

export default function GutterWords({
  side,
  className = "",
}: {
  side: "left" | "right";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] ${className}`}
    >
      <div
        className={`gutter-track ${side === "right" ? "gutter-track-reverse" : ""}`}
      >
        {/* Two copies back-to-back make the -50% translate loop seamless. */}
        <WordStack />
        <WordStack />
      </div>
    </div>
  );
}
