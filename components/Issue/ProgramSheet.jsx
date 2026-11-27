"use client";

/**
 * The program detail sheet ("mission file"): name, squad, TBA fields and a
 * disabled Register button. A native <dialog> (showModal): the browser traps
 * focus inside and makes the page behind inert. Escape closes it (native),
 * as does the Close button or a tap on the dimmed area. While open, Lenis is
 * paused; on close, focus returns to the panel that opened it.
 * Slides in from the right with a skewed clip-path (fade with reduced motion).
 */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { programs } from "@/data/programs";
import { sheet as COPY } from "@/data/issue";
import { ease, duration, prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "@/lib/scrollStore";
import { SHEET_EVENT } from "@/lib/sheet";
import Art from "./Art";

export default function ProgramSheet() {
  const dialog = useRef(null);
  const panel = useRef(null);
  const returnTo = useRef(null);
  const [program, setProgram] = useState(null);

  useEffect(() => {
    const onOpen = (e) => {
      returnTo.current = e.detail.returnTo ?? null;
      setProgram(programs.find((p) => p.id === e.detail.programId) ?? null);
    };
    window.addEventListener(SHEET_EVENT, onOpen);
    return () => window.removeEventListener(SHEET_EVENT, onOpen);
  }, []);

  // Open once the program is rendered into the sheet.
  useEffect(() => {
    const d = dialog.current;
    if (!program || !d || d.open) return;
    getLenis()?.stop();
    d.showModal();
    const reduced = prefersReducedMotion();
    gsap.fromTo(
      panel.current,
      reduced ? { opacity: 0 } : { clipPath: "polygon(100% 0%, 100% 0%, 112% 100%, 112% 100%)" },
      reduced
        ? { opacity: 1, duration: duration.fast, ease: ease.out }
        : { clipPath: "polygon(-12% 0%, 100% 0%, 112% 100%, 0% 100%)", duration: duration.base, ease: ease.wipe, clearProps: "clipPath" }
    );
  }, [program]);

  const close = () => dialog.current?.close();

  // Native close (Escape, the button, the scrim): resume scrolling, focus back.
  const onClose = () => {
    getLenis()?.start();
    setProgram(null);
    const back = returnTo.current;
    returnTo.current = null;
    back?.focus({ preventScroll: true });
  };

  return (
    <dialog ref={dialog} className="sheet" aria-labelledby="sheet-title" onClose={onClose}>
      <div className="sheet-scrim" onClick={close} aria-hidden="true" />
      <div ref={panel} className="sheet-panel">
        <button type="button" className="sheet-close" onClick={close}>
          {COPY.close}
        </button>
        {program && (
          <>
            <p className="caption sheet-label">{COPY.label}</p>
            <h2 id="sheet-title" className="sheet-title">
              {program.name}
            </h2>
            <p className="caption sheet-squad">{program.squad} squad</p>
            <div className="sheet-art panel">
              <Art name={program.id} />
            </div>
            <dl className="sheet-facts">
              {COPY.fields.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{program[f.key]}</dd>
                </div>
              ))}
            </dl>
            <button type="button" className="sheet-register" disabled aria-disabled="true">
              {COPY.register}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
