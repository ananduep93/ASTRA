"use client";

/**
 * THE ISSUE: one continuous comic, read by scrolling.
 *
 * Every page is a layer in one fixed stage (no ScrollTrigger pins: 0 of the
 * allowed 2). The scroll spacer gives the page its length; the PACED scene
 * progress (lib/scrollStore.js) is turned into a story position and drives:
 *  - page moves (phones: a page taller than the screen moves up)
 *  - "zoom into a panel": the page is scaled so one panel fills the screen,
 *    then the next page takes over (cover -> opening -> Arts splash)
 *  - the Arts mission-files page sliding up over the splash
 *  - panel wipes (skewed clip-path from the gutter) and text, state-based
 *    (lib/reveal.js): fully shown or fully hidden, never resting half-clipped.
 * Transform, opacity and clip-path only.
 *
 * Low-end devices: the same pages, fades instead of wipes and zooms.
 * Reduced motion: fades only, no pacing. No JavaScript: the pages stack.
 */
import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { programsBySquad, SQUADS } from "@/data/programs";
import { cover as COVER, opening as OPENING, chapters, sheet as SHEET } from "@/data/issue";
import { brand } from "@/lib/theme";
import { ease, duration, stagger, wipe, touchScroll, prefersReducedMotion } from "@/lib/motion";
import { scrollState, getLenis, snapSmooth } from "@/lib/scrollStore";
import { stateReveal, isJump } from "@/lib/reveal";
import { detectQuality, TIERS } from "@/lib/quality";
import { openSheet } from "@/lib/sheet";
import {
  SCENES,
  TOTAL_VH,
  toVh,
  toProgress,
  sceneT,
  clamp01,
  easeInOutCubic,
  OPENING_PANELS,
  PAGE_MOVE,
  SPLASH_SHOW,
} from "@/lib/issue";
import Art, { HalftoneDefs } from "./Art";

const ARTS = programsBySquad("Arts");
const lin = (v, [a, b]) => clamp01((v - a) / (b - a));

/** Skewed clip-path polygon for a wipe from `dir` at progress x (0 hidden .. 1 shown). */
function wipeClip(dir, x, S) {
  if (dir === "right") {
    const X = 100 - x * (100 + S);
    return `polygon(${100 + S}% 0%, ${X}% 0%, ${X + S}% 100%, ${100 + S}% 100%)`;
  }
  if (dir === "top") {
    const Y = x * (100 + S);
    return `polygon(0% ${-S}%, 100% ${-S}%, 100% ${Y - S}%, 0% ${Y}%)`;
  }
  if (dir === "bottom") {
    const Y = 100 - x * (100 + S);
    return `polygon(0% ${100 + S}%, 100% ${100 + S}%, 100% ${Y}%, 0% ${Y + S}%)`;
  }
  const X = x * (100 + S); // left
  return `polygon(${-S}% 0%, ${X}% 0%, ${X - S}% 100%, ${-S}% 100%)`;
}

/** Offset of `el` inside `page`, in page pixels (layout only: ignores transforms). */
function offsetIn(el, page) {
  let x = 0;
  let y = 0;
  for (let e = el; e && e !== page; e = e.offsetParent) {
    x += e.offsetLeft;
    y += e.offsetTop;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/**
 * Transform that zooms `page` so the panel `g` (page coords) grows from where it
 * sits (its inner content moved up by `shift`, negative) to fill the screen, at
 * eased progress e (0..1).
 */
function zoomTransform(g, e, shift) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const S = Math.max(vw / g.w, vh / g.h) * 1.03;
  const s = Math.pow(S, e); // exponential: feels like a steady camera push
  const cx0 = g.x + g.w / 2;
  const cy0 = g.y + g.h / 2 + shift;
  const cx = cx0 + (vw / 2 - cx0) * e;
  const cy = cy0 + (vh / 2 - cy0) * e;
  const tx = cx - s * (g.x + g.w / 2);
  const ty = cy - s * (g.y + g.h / 2 + shift);
  return `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
}

/* ----------------------------------------------------------------- pages */

function Cover() {
  return (
    <section id="cover" className="page page-cover" data-page="cover" aria-labelledby="cover-title">
      <div className="cover-inner">
        <h1 id="cover-title" className="cover-masthead">
          <span className="cover-title">{COVER.masthead}</span>
          <span className="cover-issue">{COVER.issue}</span>
        </h1>
        <p className="cover-strap caption">{COVER.strap}</p>
        <div className="cover-art">
          <div className="cover-burst halftone-red" aria-hidden="true" />
          <Image
            className="cover-logo"
            src={brand.ink}
            width={brand.inkSize[0]}
            height={brand.inkSize[1]}
            alt="ASTRA logo"
            priority
            unoptimized
          />
          <p className="sound cover-sound" aria-hidden="true">
            {COVER.sound}
          </p>
        </div>
        <p className="cover-tagline">{COVER.tagline}</p>
        <p className="caption cover-college">{COVER.college}</p>
        {/* The small panel the reader zooms into: it becomes the opening page. */}
        <div className="panel cover-inset" data-zoom="cover">
          <Art name="radar" />
          <p className="caption caption-inset">{COVER.inset}</p>
        </div>
      </div>
    </section>
  );
}

function Opening() {
  return (
    <section id="opening" className="page page-opening" data-page="opening" aria-labelledby="opening-title">
      {/* The page moves inside this window, which starts below the logo / menu badges (a page margin). */}
      <div className="page-window">
        <div className="page-inner">
          <h2 id="opening-title" className="sr-only">
            Opening page
          </h2>
          <div className="panel-grid panel-grid-opening">
            {OPENING.map((p, k) => (
              <article
                key={k}
                className={`panel opening-panel opening-${p.art}`}
                data-from={p.from}
                data-panel={k}
                data-zoom={k === OPENING.length - 1 ? "opening" : undefined}
              >
                {p.art === "roster" ? (
                  <ul className="roster" aria-label="The five squads">
                    {SQUADS.map((sq, i) => (
                      <li key={sq} className={`roster-tag${i === 0 ? " roster-tag-first" : ""}`}>
                        {sq}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Art name={p.art} />
                )}
                <p className="caption">{p.caption}</p>
                {p.bubble && <p className="bubble">{p.bubble}</p>}
                {p.shout && <p className="shout">{p.shout}</p>}
                {p.sound && (
                  <p className="sound" aria-hidden="true">
                    {p.sound}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Splash() {
  const ch = chapters.Arts;
  return (
    <section id="chapter-arts" className="page page-splash" data-page="splash" aria-labelledby="splash-title">
      <div className="splash-inner">
        <div className="splash-burst halftone-red" aria-hidden="true" />
        <p className="caption splash-label">Chapter {ch.number}</p>
        <h2 id="splash-title" className="splash-name">
          <span className="splash-name-line">Arts</span>
        </h2>
        <p className="sound splash-sound" aria-hidden="true">
          {ch.sound}
        </p>
        <p className="caption splash-caption">{ch.caption}</p>
      </div>
    </section>
  );
}

function ArtsPage() {
  const ch = chapters.Arts;
  return (
    <section className="page page-arts" data-page="arts" aria-labelledby="arts-files-title">
      <div className="page-window">
        <div className="page-inner">
          <header className="files-head" data-reveal="head">
            <p className="caption files-label">Chapter {ch.number} · Arts</p>
            <h3 id="arts-files-title" className="files-title">
              {ch.filesLabel}
            </h3>
            <p className="caption files-hint">{SHEET.tapHint}</p>
          </header>
          <ul className="panel-grid panel-grid-files">
            {ARTS.map((p, k) => (
              <li key={p.id} className="files-cell">
                <button
                  type="button"
                  className="panel file-panel"
                  data-from={["left", "top", "right", "bottom"][k % 4]}
                  aria-haspopup="dialog"
                  onClick={(e) => openSheet(p.id, e.currentTarget)}
                >
                  <Art name={p.id} />
                  <span className="caption file-name">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="panel next-panel caption" data-from="left">
            {ch.next}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ controller */

export default function Issue() {
  const root = useRef(null);

  useGSAP(
    () => {
      const el = root.current;
      const tier = TIERS[detectQuality()];
      const reduced = prefersReducedMotion();
      const fancy = tier.wipes && !reduced; // skewed wipes and zooms; otherwise fades
      document.documentElement.dataset.motion = fancy ? "full" : "simple";

      const page = {
        cover: el.querySelector('[data-page="cover"]'),
        opening: el.querySelector('[data-page="opening"]'),
        splash: el.querySelector('[data-page="splash"]'),
        arts: el.querySelector('[data-page="arts"]'),
      };
      const inner = {
        opening: page.opening.querySelector(".page-inner"),
        arts: page.arts.querySelector(".page-inner"),
      };
      const win = {
        opening: page.opening.querySelector(".page-window"),
        arts: page.arts.querySelector(".page-window"),
      };
      const zoomTarget = {
        cover: el.querySelector('[data-zoom="cover"]'),
        opening: el.querySelector('[data-zoom="opening"]'),
      };

      /* Panel timelines: wipe in from the gutter, then captions slide and bubbles pop. */
      const panelTl = (panel) => {
        const dir = panel.dataset.from || "left";
        const tl = gsap.timeline({ paused: true });
        if (fancy) {
          const p = { x: 0 };
          const draw = () => (panel.style.clipPath = p.x >= 1 ? "none" : wipeClip(dir, p.x, wipe.skew));
          draw();
          tl.to(p, {
            x: 1,
            duration: wipe.duration,
            ease: ease.wipe,
            onUpdate: draw,
          });
        } else {
          tl.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: duration.base, ease: ease.out });
        }
        const caps = panel.querySelectorAll(".caption");
        const pops = panel.querySelectorAll(".bubble, .sound, .shout");
        if (caps.length)
          tl.from(
            caps,
            {
              opacity: 0,
              xPercent: fancy ? -8 : 0,
              duration: duration.base,
              ease: ease.out,
              stagger: stagger.base,
            },
            fancy ? "-=0.35" : "<",
          );
        if (pops.length)
          tl.from(
            pops,
            {
              opacity: 0,
              scale: fancy ? 0.6 : 1,
              duration: duration.base,
              ease: fancy ? ease.pop : ease.out,
              stagger: stagger.base,
            },
            "-=0.3",
          );
        return tl;
      };

      const openingPanels = [...page.opening.querySelectorAll(".opening-panel")].map((panel) => {
        const tl = panelTl(panel);
        return { panel, r: stateReveal(() => tl) };
      });
      const filePanels = [...page.arts.querySelectorAll(".file-panel, .next-panel")].map((panel) => {
        const tl = panelTl(panel);
        return { panel, r: stateReveal(() => tl) };
      });
      const headTl = gsap.timeline({ paused: true }).from(page.arts.querySelectorAll(".files-head > *"), {
        opacity: 0,
        yPercent: 40,
        duration: duration.base,
        ease: ease.out,
        stagger: stagger.base,
      });
      const headR = stateReveal(() => headTl);

      // Splash: label, the huge name rises out of its mask, the sound word pops, the caption follows.
      const splashTl = gsap.timeline({ paused: true });
      splashTl.from(page.splash.querySelector(".splash-label"), {
        opacity: 0,
        xPercent: -10,
        duration: duration.base,
        ease: ease.out,
      });
      splashTl.from(
        page.splash.querySelector(".splash-name-line"),
        { yPercent: 105, duration: duration.slow, ease: ease.expo },
        "-=0.3",
      );
      splashTl.from(
        page.splash.querySelector(".splash-sound"),
        {
          opacity: 0,
          scale: fancy ? 0.4 : 1,
          rotate: fancy ? -20 : 0,
          duration: duration.base,
          ease: fancy ? ease.pop : ease.out,
        },
        "-=0.5",
      );
      splashTl.from(
        page.splash.querySelector(".splash-caption"),
        { opacity: 0, yPercent: 30, duration: duration.base, ease: ease.out },
        "-=0.3",
      );
      const splashR = stateReveal(() => splashTl);

      // Cover: the sound word stamps on once the page has loaded (time-based, once).
      gsap.fromTo(
        page.cover.querySelector(".cover-sound"),
        { opacity: 0, scale: fancy ? 0.3 : 1, rotate: fancy ? -24 : -8 },
        {
          opacity: 1,
          scale: 1,
          rotate: -8,
          duration: duration.slow,
          ease: fancy ? ease.pop : ease.out,
          delay: 0.25,
        },
      );

      /* Layout measurements (re-measured on resize). */
      let geo = {};
      const measure = () => {
        const vh = window.innerHeight;
        geo = {
          vh,
          moveOpening: Math.max(0, inner.opening.offsetHeight - win.opening.offsetHeight),
          moveArts: Math.max(0, inner.arts.offsetHeight - win.arts.offsetHeight),
          zoomCover: offsetIn(zoomTarget.cover, page.cover),
          zoomOpening: offsetIn(zoomTarget.opening, page.opening),
          openingPanels: openingPanels.map(({ panel }) => offsetIn(panel, page.opening)),
          filePanels: filePanels.map(({ panel }) => offsetIn(panel, page.arts)),
          head: offsetIn(page.arts.querySelector(".files-head"), page.arts),
        };
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(inner.opening);
      ro.observe(inner.arts);
      window.addEventListener("resize", measure);

      const last = new Map();
      const set = (node, key, value, apply) => {
        const k = node.dataset.page + key;
        if (last.get(k) === value) return;
        last.set(k, value);
        apply(value);
      };
      // Pages never fully disappear: an "off" page stays at a tiny, invisible opacity (and `inert`:
      // not clickable, not focusable, hidden from screen readers). Browsers skip drawing fully
      // transparent or hidden layers, so bringing a page back mid-zoom would mean redrawing it
      // from scratch at a large scale (a visible stall). Kept drawn, it just reappears.
      const KEEP_DRAWN = 0.002;
      const show = (node, opacity, transform = "none") => {
        set(node, "o", opacity, (v) => (node.style.opacity = String(Math.max(v, KEEP_DRAWN))));
        set(node, "v", true, () => (node.style.visibility = "visible")); // CSS hides pages until the first frame
        set(node, "i", opacity < 0.5, (v) => (node.inert = v)); // only the page you are reading takes input
        set(node, "t", transform, (v) => (node.style.transform = v));
      };
      // Page moves happen INSIDE the page (its box is the screen and clips), zooms and slides on the page.
      const move = (node, key, y) => set(node, key, y, (v) => (node.style.transform = `translate3d(0, ${v}px, 0)`));

      let prevS = 0;
      const tick = () => {
        const s = toVh(scrollState.smooth);
        const jumped = isJump(prevS, s);
        prevS = s;
        const z1 = sceneT(s, "zoom1");
        const op = sceneT(s, "opening");
        const z2 = sceneT(s, "zoom2");
        const sp = sceneT(s, "splash");
        const sl = sceneT(s, "slide");
        const ar = sceneT(s, "arts");
        const e1 = easeInOutCubic(z1);
        const e2 = easeInOutCubic(z2);
        const handOver = fancy ? [0.82, 1] : [0.35, 0.65]; // when the next page takes over
        // Cover -> (zoom into its inset) -> opening
        const coverO = 1 - lin(z1, handOver);
        show(page.cover, coverO, fancy && z1 > 0 ? zoomTransform(geo.zoomCover, e1, 0) : "none");

        // Opening page: moves up on phones, then zooms into its last panel
        const moveO = -geo.moveOpening * easeInOutCubic(lin(op, PAGE_MOVE.opening));
        const openO = lin(z1, handOver) * (1 - lin(z2, handOver));
        move(inner.opening, "inner-opening", Math.round(moveO));
        show(page.opening, openO, fancy && z2 > 0 ? zoomTransform(geo.zoomOpening, e2, Math.round(moveO)) : "none");

        // Splash, then the Arts page slides up over it
        const slideE = easeInOutCubic(sl);
        const splashO = lin(z2, handOver) * (sl >= 1 ? 0 : 1);
        show(page.splash, splashO);
        const moveA = -geo.moveArts * easeInOutCubic(lin(ar, PAGE_MOVE.arts));
        move(inner.arts, "inner-arts", Math.round(moveA));
        if (fancy) show(page.arts, sl > 0 ? 1 : 0, `translate3d(0, ${(1 - slideE) * geo.vh}px, 0)`);
        else show(page.arts, sl);

        // Opening panels: in order, once each is on screen
        openingPanels.forEach(({ r }, k) => {
          const g = geo.openingPanels[k];
          const top = g.y + moveO;
          const on = op >= OPENING_PANELS[k] && top < geo.vh * 0.9 && s < SCENES.zoom2.end;
          r.set(on, jumped);
        });

        // Splash text
        splashR.set(sp > SPLASH_SHOW || z2 >= 1, jumped);

        // Arts mission files: header and panels as they come on screen
        const artsIn = sl > 0.6;
        const yOff = fancy ? (1 - slideE) * geo.vh : 0;
        headR.set(artsIn && geo.head.y + moveA + yOff < geo.vh * 0.85, jumped);
        filePanels.forEach(({ r }, k) => {
          const g = geo.filePanels[k];
          r.set(artsIn && g.y + moveA + yOff < geo.vh * 0.88, jumped);
        });
      };
      gsap.ticker.add(tick);

      // Tests only (?debug=1): jump the scroll AND the scene to a story position.
      if (new URLSearchParams(window.location.search).get("debug") === "1") {
        window.__issue = {
          totalVh: TOTAL_VH,
          scenes: SCENES,
          scene: () => toVh(scrollState.smooth),
          real: () => toVh(scrollState.progress),
          jump: (vh) => {
            const y = toProgress(vh) * (document.documentElement.scrollHeight - window.innerHeight);
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
            else window.scrollTo(0, y);
            requestAnimationFrame(() => requestAnimationFrame(snapSmooth));
          },
        };
      }

      return () => {
        gsap.ticker.remove(tick);
        ro.disconnect();
        window.removeEventListener("resize", measure);
        delete window.__issue;
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="issue">
      <HalftoneDefs />
      {/* Scroll length of the whole issue. Touch screens scroll further for the same story. */}
      <div
        className="issue-spacer"
        aria-hidden="true"
        style={{
          "--issue-vh": `${TOTAL_VH}vh`,
          "--touch-length": touchScroll.lengthMultiplier,
        }}
      />
      <div className="issue-stage">
        <Cover />
        <Opening />
        <Splash />
        <ArtsPage />
      </div>
    </div>
  );
}
