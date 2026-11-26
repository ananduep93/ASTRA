"use client";

/**
 * The opening transmission. Time-based, once per page load:
 *  1. once the stars have formed ASTRA 2027, a line types in under it
 *     (SplitText characters snapping on: opacity only),
 *  2. the logo crosses the screen once as a comet with a trail of fading
 *     points and settles top left, exactly on the HUD mark,
 *  3. the HUD mark takes over (components/HUD/Hud.jsx); the comet hides.
 * Scrolling back never replays it. Reloaded mid-page: skipped, mark shown at once.
 * Then the line fades with scroll as the camera starts its flight.
 *
 * Static mode (low tier, reduced motion, no JS): the line is plain text under
 * the headline and the comet is never shown (lib/staticCss.js).
 * Transform and opacity only.
 */
import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { transmission as copy } from "@/data/story";
import { transmission as T, ease, stagger, duration } from "@/lib/motion";
import { brand } from "@/lib/theme";
import { scrollState, rangeSmooth } from "@/lib/scrollStore";
import { storyStatus } from "@/lib/storyStatus";
import { heroProgress, toVh } from "@/lib/journey";

const isStatic = () => document.documentElement.dataset.world === "static";

/** Point on a quadratic curve (start, bend, end) at t. */
const bezier = (a, b, c, t) => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
};

export default function Transmission() {
  const root = useRef(null);

  useGSAP(
    () => {
      const wrap = root.current;
      const line = wrap.querySelector(".transmission-line");
      const comet = wrap.querySelector(".transmission-comet");
      const trail = [...wrap.querySelectorAll(".transmission-trail i")];
      let split = null;
      let tl = null;

      /** Place the line just under the headline's last word. */
      const placeLine = () => {
        const words = document.querySelectorAll("[data-hero-word]");
        const last = words[words.length - 1];
        if (!last) return;
        const r = last.getBoundingClientRect();
        line.style.transform = `translate3d(0, ${Math.round(r.bottom + 12)}px, 0)`;
      };

      /** The HUD mark's centre and size: where the comet lands. */
      const markBox = () => {
        const mark = document.querySelector(".hud-mark");
        const r = mark ? mark.getBoundingClientRect() : { left: 16, top: 16, width: 32, height: 26 };
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
      };

      function play() {
        storyStatus.transmission = "typing";
        placeLine();
        split = SplitText.create(line.querySelector("span"), { type: "words,chars" });
        gsap.set(line, { opacity: 1 });
        const W = window.innerWidth;
        const H = window.innerHeight;
        const end = markBox();
        // Rises from below the left edge, arcs over the headline, settles on the mark.
        const a = [-0.12 * W, 1.08 * H];
        const b = [0.68 * W, 0.12 * H];
        const c = [end.x, end.y];
        const cometW = comet.offsetWidth || end.w;
        const scaleEnd = end.w / cometW;
        const n = trail.length;
        const pathState = { t: 0 };

        const drawComet = () => {
          const t = pathState.t;
          const [x, y] = bezier(a, b, c, t);
          const scale = scaleEnd * (T.cometScale + (1 - T.cometScale) * t);
          comet.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
          comet.style.opacity = String(Math.min(1, t * 8));
          const fadeTrail = 1 - rangeSmooth(t, [0.75, 1]);
          trail.forEach((dot, k) => {
            const tk = t - (k + 1) * T.trailGap;
            if (tk <= 0) {
              dot.style.opacity = "0";
              return;
            }
            const [dx, dy] = bezier(a, b, c, tk);
            const s = (1 - k / n) * (0.6 + 0.4 * (1 - t));
            dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${s})`;
            dot.style.opacity = String((1 - k / n) * fadeTrail);
          });
        };

        tl = gsap.timeline({ delay: T.delay, onComplete: () => (storyStatus.transmission = "done") });
        tl.from(split.chars, { opacity: 0, duration: stagger.type, ease: ease.type, stagger: stagger.type });
        tl.call(() => (storyStatus.transmission = "comet"), [], `+=${T.cometStart}`);
        tl.to(pathState, { t: 1, duration: T.cometDuration, ease: ease.inOut, onUpdate: drawComet }, "<");
        tl.to(comet, { opacity: 0, duration: duration.fast, ease: ease.out });
      }

      function skip() {
        storyStatus.transmission = "skipped";
        placeLine();
        gsap.set(line, { opacity: 1 });
      }

      // Wait for the headline to form (or for the static page / a skipped intro).
      const tick = () => {
        if (isStatic()) {
          gsap.ticker.remove(tick);
          return;
        }
        if (storyStatus.transmission === "waiting") {
          if (storyStatus.heroRunning && storyStatus.heroSkipped) skip();
          else if (storyStatus.heroForm >= 1) play();
        }
        // The line fades as the camera starts its flight (scroll-linked, reverses on scroll back).
        if (storyStatus.transmission !== "waiting") {
          const p = heroProgress(toVh(scrollState.smooth));
          wrap.style.opacity = String(1 - rangeSmooth(p, T.lineFade));
        }
      };
      gsap.ticker.add(tick);

      const onResize = () => {
        if (storyStatus.transmission !== "waiting") placeLine();
      };
      window.addEventListener("resize", onResize);

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("resize", onResize);
        tl?.kill();
        split?.revert();
      };
    },
    { scope: root }
  );

  return (
    <div ref={root} className="transmission">
      <p className="transmission-line">
        <span>{copy.line}</span>
      </p>
      <div className="transmission-trail" aria-hidden="true">
        {Array.from({ length: T.trailDots }, (_, k) => (
          <i key={k} data-red={k % T.trailRedEvery === 1 ? "" : undefined} />
        ))}
      </div>
      <Image
        className="transmission-comet"
        src={brand.mark}
        width={brand.markSize[0]}
        height={brand.markSize[1]}
        alt=""
        aria-hidden="true"
        unoptimized
        priority
      />
    </div>
  );
}
