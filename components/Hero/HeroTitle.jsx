/**
 * The hero headline. Server component, no client code.
 *
 * - The real <h1>ASTRA 2027</h1> is always in the DOM for screen readers and
 *   SEO. It is visually hidden (sr-only, never display:none) because the stars
 *   draw the title. It becomes visible only in static mode: reduced motion,
 *   WebGL failure (html[data-world="static"]) or no JavaScript.
 * - The invisible "ghost" copy below has the same font, size and line breaks.
 *   The particle sampler reads its word boxes ([data-hero-word]) to know where
 *   each letter pixel goes. It is never shown and hidden from assistive tech.
 * - The logo image shows only in static mode (live, the comet brings it in).
 */
import Image from "next/image";
import { brand } from "@/lib/theme";

export default function HeroTitle() {
  return (
    <section id="top" className="hero-stage h-svh">
      <Image
        className="hero-static-logo"
        src={brand.mark}
        width={brand.markSize[0]}
        height={brand.markSize[1]}
        alt="ASTRA logo"
        unoptimized
      />
      <div className="hero-title-wrap">
        <h1 className="hero-title hero-h1">
          <span className="hero-line">ASTRA</span> <span className="hero-line">2027</span>
        </h1>
        <div className="hero-ghost" aria-hidden="true">
          <div className="hero-title">
            <span className="hero-line">
              <span data-hero-word>ASTRA</span>
            </span>{" "}
            <span className="hero-line">
              <span data-hero-word>2027</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
