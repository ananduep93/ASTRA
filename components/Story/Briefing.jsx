"use client";

/**
 * The briefing, right after the star-iris has turned the screen white and
 * before the first squad. A fixed overlay (not pinned) in two beats, every
 * reveal a paused GSAP timeline set from the shared scene progress, so it
 * plays in reverse on scroll back. Transform, opacity and clip-path only.
 *   Beat 1: label, a big kinetic headline (SplitText lines rise out of masks,
 *           alternate lines drift sideways while it holds), what ASTRA is,
 *           the college and the year.
 *   Beat 2: the facts as dossier tiles opening with a clip-path mask; the
 *           Programs and Squads numbers count up with the scroll (counted from
 *           data/programs.js, never typed). Date and Venue stay TBA.
 * Static mode (low tier, reduced motion, no JS): a plain white section that
 * cross-fades in (opacity only), every value shown.
 */
import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { programs, SQUADS } from "@/data/programs";
import { briefingCopy as copy } from "@/data/story";
import { briefing as BRF, ease, stagger, duration } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { toVh, briefingProgress } from "@/lib/journey";

const isStatic = () => document.documentElement.dataset.world === "static";
const lin = (v, [a, b]) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const pad = (n) => String(n).padStart(2, "0");

const TILES = [
  { key: "date", ...copy.facts.date },
  { key: "venue", ...copy.facts.venue },
  { key: "programs", ...copy.facts.programs, count: programs.length },
  { key: "squads", ...copy.facts.squads, count: SQUADS.length },
];

export default function Briefing() {
  const root = useRef(null);

  useGSAP(
    () => {
      const el = root.current;
      const intro = el.querySelector(".briefing-intro");
      const facts = el.querySelector(".briefing-facts");
      const counters = [...el.querySelectorAll("[data-count]")];
      let headTl = null;
      let lines = [];

      const split = SplitText.create(el.querySelector(".briefing-headline"), {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          lines = self.lines;
          const tl = gsap.timeline({ paused: true });
          tl.from(self.lines, { yPercent: 110, rotate: 2, duration: duration.slow, ease: ease.expo, stagger: stagger.loose });
          tl.from(
            intro.querySelectorAll(".briefing-label, .briefing-about, .briefing-meta"),
            { opacity: 0, yPercent: 30, duration: duration.base, ease: ease.out, stagger: stagger.base },
            duration.fast
          );
          tl.progress(headTl?.progress() ?? 0);
          headTl = tl;
          return tl;
        },
      });

      // Beat 2: label, then each tile opens left to right through a clip-path mask, plus the photo slot.
      const factsTl = gsap.timeline({ paused: true });
      factsTl.from(facts.querySelector(".briefing-label"), { opacity: 0, yPercent: 30, duration: duration.base, ease: ease.out });
      factsTl.fromTo(
        facts.querySelectorAll(".briefing-tile, .briefing-photo"),
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: duration.base, ease: ease.inOut, stagger: stagger.base },
        duration.fast
      );

      const last = {};
      const tick = () => {
        const live = !isStatic();
        const f = live ? briefingProgress(toVh(scrollState.smooth)) : 1;
        const inV = live ? lin(f, BRF.intro.in) * (1 - lin(f, BRF.intro.out)) : 1;
        const factsV = live ? lin(f, BRF.facts.in) * (1 - lin(f, BRF.facts.out)) : 1;
        const count = live ? lin(f, BRF.facts.count) : 1;
        const visible = !live || inV > 0.001 || factsV > 0.001;

        if (visible !== last.visible) el.style.visibility = (last.visible = visible) ? "visible" : "hidden";
        if (inV !== last.inV) {
          headTl?.progress((last.inV = inV));
          intro.style.visibility = inV > 0.001 ? "visible" : "hidden";
        }
        // Kinetic hold: alternate lines drift apart a little while beat 1 is on screen.
        const drift = live ? (lin(f, [BRF.intro.in[1], BRF.intro.out[1]]) - 0.5) * BRF.drift : 0;
        if (drift !== last.drift) {
          last.drift = drift;
          lines.forEach((line, i) => gsap.set(line.parentElement, { xPercent: (i % 2 ? -1 : 1) * drift }));
        }
        if (factsV !== last.factsV) {
          factsTl.progress((last.factsV = factsV));
          facts.style.visibility = factsV > 0.001 ? "visible" : "hidden";
        }
        if (count !== last.count) {
          last.count = count;
          counters.forEach((c) => (c.textContent = pad(Math.round(+c.dataset.count * count))));
        }
      };
      gsap.ticker.add(tick);

      // Static mode: cross-fade in once it scrolls into view (opacity only).
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      io.observe(el);

      return () => {
        gsap.ticker.remove(tick);
        io.disconnect();
        split.revert();
      };
    },
    { scope: root }
  );

  return (
    <section ref={root} className="briefing" data-tone="light" aria-labelledby="briefing-title">
      <div className="briefing-intro">
        <p className="briefing-label">
          <span className="briefing-dot" aria-hidden="true" />
          {copy.label}
        </p>
        <h2 id="briefing-title" className="briefing-headline">
          {copy.headline.map((line) => (
            <span key={line} className="briefing-line">
              {line}
            </span>
          ))}
        </h2>
        <p className="briefing-about">{copy.about}</p>
        <p className="briefing-meta">
          <span>{copy.college}</span>
          <span className="briefing-year">{copy.year}</span>
        </p>
      </div>

      <div className="briefing-facts">
        <p className="briefing-label">
          <span className="briefing-dot" aria-hidden="true" />
          {copy.factsLabel}
        </p>
        <dl className="briefing-tiles">
          {TILES.map((t) => (
            <div key={t.key} className="briefing-tile">
              <dt>{t.label}</dt>
              <dd>
                {/* Counts render their final value on the server (no-JS / static); live they count up. */}
                {t.count != null ? <span data-count={t.count}>{pad(t.count)}</span> : t.value}
              </dd>
            </div>
          ))}
        </dl>
        {/* PHOTO SLOT: reserved for future student hero photos (Phase TBA). Replace this
            empty bracketed frame with an <Image>; keep its size so the layout never shifts. */}
        <div className="briefing-photo" aria-hidden="true">
          <span className="briefing-photo-label">Photo TBA</span>
        </div>
      </div>
    </section>
  );
}
