"use client";

/**
 * The finale, after the Fun stop (about 300vh of scroll, not pinned: a fixed
 * overlay like the squad stops, driven by the shared scroll value).
 *
 * Live: the dots (ProgramField, behind) appear as five clouds, form the five
 * squad emblems in the ".finale-slot" areas, then travel into the ASTRA logo
 * in the ".finale-logo" area (both are sampled from this layout, so they fit
 * every screen). A comet streak sweeps through, then the line and the call to
 * action rise. Every reveal is a paused timeline set from scroll, so scrolling
 * back plays it in reverse. Transform and opacity only.
 *
 * Static (low tier, reduced motion, no JS): the logo image, the line and the
 * button as a plain black section (lib/staticCss.js).
 */
import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { SQUADS } from "@/data/programs";
import { finale as copy } from "@/data/story";
import { brand } from "@/lib/theme";
import { ease, stagger, duration } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { toVh, finaleTextAt } from "@/lib/journey";

const isStatic = () => document.documentElement.dataset.world === "static";

export default function Finale() {
  const root = useRef(null);

  useGSAP(
    () => {
      const el = root.current;
      const sweep = el.querySelector(".finale-sweep");
      const cta = el.querySelector(".finale-cta");

      let lineTl = null;
      const split = SplitText.create(el.querySelector(".finale-line"), {
        type: "words,chars",
        mask: "chars",
        autoSplit: true,
        onSplit(self) {
          const tl = gsap.timeline({ paused: true, defaults: { ease: ease.out } });
          tl.from(self.chars, { yPercent: 110, duration: duration.base, stagger: stagger.tight });
          tl.progress(lineTl?.progress() ?? 0);
          lineTl = tl;
          return tl;
        },
      });
      const ctaTl = gsap.timeline({ paused: true }).from(cta, { opacity: 0, yPercent: 40, duration: duration.base, ease: ease.out });

      let last = {};
      const tick = () => {
        const live = !isStatic();
        const t = live ? finaleTextAt(toVh(scrollState.smooth)) : { visible: true, line: 1, cta: 1, sweep: 0 };
        if (t.visible !== last.visible) el.style.visibility = t.visible ? "visible" : "hidden";
        if (t.line !== last.line) lineTl?.progress(t.line);
        if (t.cta !== last.cta) ctaTl.progress(t.cta);
        if (t.sweep !== last.sweep) {
          // Streak travels along the logo's own comet angle; bright in the middle of its run.
          sweep.style.transform = `translate3d(${-60 + t.sweep * 220}%, 0, 0)`;
          sweep.style.opacity = String(Math.sin(Math.PI * t.sweep));
        }
        last = t;
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        split.revert();
      };
    },
    { scope: root }
  );

  return (
    <section ref={root} className="finale" data-tone="dark" aria-labelledby="finale-title">
      {/* Where the dots draw the five emblems and the logo (sampled from these boxes). */}
      <div className="finale-stage" aria-hidden="true">
        {SQUADS.map((squad, i) => (
          <div key={squad} className="finale-slot" data-slot={i} />
        ))}
        <div className="finale-logo">
          <div className="finale-sweep-clip">
            <span className="finale-sweep" />
          </div>
        </div>
      </div>
      {/* Static mode only: the logo as an image. */}
      <Image
        className="finale-static-logo"
        src={brand.mark}
        width={brand.markSize[0]}
        height={brand.markSize[1]}
        alt="ASTRA logo"
        unoptimized
      />
      <div className="finale-copy">
        <h2 id="finale-title" className="finale-line">
          {copy.line}
        </h2>
        <button type="button" className="finale-cta" disabled aria-disabled="true">
          {copy.cta}
        </button>
      </div>
    </section>
  );
}
