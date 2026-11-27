"use client";

/**
 * The finale, after the programs section (a fixed overlay, not pinned, driven
 * by the shared scroll value; the programs section scrolls away above it).
 *
 * Live: the dots (ProgramField, behind) appear scattered across the view and
 * gather into the ASTRA logo in the ".finale-logo" area (sampled from this
 * layout, so it fits every screen). A comet streak sweeps through, then the line and the call to
 * action rise. The sweep follows scroll; the text reveals are state-based
 * (lib/reveal.js), so they never rest half-clipped. Transform and opacity only.
 *
 * Static (low tier, reduced motion, no JS): the logo image, the line and the
 * button as a plain black section (lib/staticCss.js).
 */
import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { finale as copy } from "@/data/story";
import { brand } from "@/lib/theme";
import { ease, stagger, duration } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { toVh, finaleTextAt } from "@/lib/journey";
import { stateReveal, isJump } from "@/lib/reveal";

const isStatic = () => document.documentElement.dataset.world === "static";

export default function Finale() {
  const root = useRef(null);

  useGSAP(
    () => {
      const el = root.current;
      const sweep = el.querySelector(".finale-sweep");
      const cta = el.querySelector(".finale-cta");

      let lineTl = null;
      const lineR = stateReveal(() => lineTl);
      const split = SplitText.create(el.querySelector(".finale-line"), {
        type: "words,chars",
        mask: "chars",
        autoSplit: true,
        onSplit(self) {
          const tl = gsap.timeline({ paused: true, defaults: { ease: ease.out } });
          tl.from(self.chars, { yPercent: 110, duration: duration.base, stagger: stagger.tight });
          tl.progress(lineR.target);
          lineTl = tl;
          return tl;
        },
      });
      const ctaTl = gsap.timeline({ paused: true }).from(cta, { opacity: 0, yPercent: 40, duration: duration.base, ease: ease.out });
      const ctaR = stateReveal(() => ctaTl);

      let last = {};
      let snapped = false; // static mode: jumped to the final state once
      let prevS = 0;
      const tick = () => {
        const live = !isStatic();
        const s = toVh(scrollState.smooth);
        const jumped = isJump(prevS, s);
        prevS = s;
        const t = live ? finaleTextAt(s) : { visible: true, line: 1, cta: 1, sweep: 0 };
        if (t.visible !== last.visible) el.style.visibility = t.visible ? "visible" : "hidden";
        // Text: shown / hidden by state (never rests half-clipped); the sweep stays tied to scroll.
        if (live) {
          lineR.set(t.line > 0.5, jumped);
          ctaR.set(t.cta > 0.5, jumped);
        } else if (!snapped) {
          lineR.snap(true);
          ctaR.snap(true);
          snapped = true;
        }
        if (live) snapped = false;
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
      {/* Where the dots draw the logo (sampled from this box). */}
      <div className="finale-stage" aria-hidden="true">
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
