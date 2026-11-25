"use client";

/**
 * Program detail panel. A native <dialog> (shown with showModal), which gives
 * focus trapping, Escape and an inert page behind it for free.
 *
 * - Opens when a roster button calls openProgram(id).
 * - Slides in with clip-path + transform (GSAP); plain fade with reduced motion.
 * - Closes on: tapping outside the panel, the Close button, Escape, or the
 *   browser Back button (opening adds a history entry).
 * - Lenis is paused while it is open; focus returns to the program button.
 * Every detail except name and squad is "TBA" from data/programs.js.
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { programs } from "@/data/programs";
import { ease, duration, prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "@/lib/scrollStore";
import { programDialogStore, clearProgram } from "@/lib/programDialog";

const HISTORY_KEY = "astraProgram";

export default function ProgramDialog() {
  const openId = useSyncExternalStore(
    programDialogStore.subscribe,
    programDialogStore.getSnapshot,
    programDialogStore.getServerSnapshot
  );
  const program = programs.find((p) => p.id === openId);
  const dialog = useRef(null);
  const panel = useRef(null);
  const scrim = useRef(null);
  const closing = useRef(false);

  // Animate out, then really close and tidy up.
  const closeNow = useCallback(() => {
    const dlg = dialog.current;
    if (!dlg?.open || closing.current) return;
    closing.current = true;
    const done = () => {
      dlg.close();
      closing.current = false;
      getLenis()?.start();
      programDialogStore.trigger()?.focus({ preventScroll: true });
      clearProgram();
    };
    if (prefersReducedMotion()) {
      gsap.to([panel.current, scrim.current], { opacity: 0, duration: duration.fast, onComplete: done });
      return;
    }
    gsap
      .timeline({ defaults: { duration: duration.fast, ease: ease.inOut }, onComplete: done })
      .to(panel.current, { clipPath: "inset(0% 0% 0% 100%)", xPercent: 8 })
      .to(scrim.current, { opacity: 0 }, 0);
  }, []);

  // Close paths that go through history, so Back and Escape behave the same.
  const requestClose = useCallback(() => {
    if (window.history.state?.[HISTORY_KEY]) window.history.back(); // popstate closes it
    else closeNow();
  }, [closeNow]);

  // Open when a program is chosen.
  useEffect(() => {
    if (!openId) return;
    const dlg = dialog.current;
    if (!dlg.open) dlg.showModal();
    getLenis()?.stop();
    if (!window.history.state?.[HISTORY_KEY]) {
      window.history.pushState({ ...window.history.state, [HISTORY_KEY]: openId }, "");
    }
    if (prefersReducedMotion()) {
      gsap.fromTo([panel.current, scrim.current], { opacity: 0 }, { opacity: 1, duration: duration.fast });
      return;
    }
    gsap
      .timeline({ defaults: { duration: duration.base, ease: ease.expo } })
      .fromTo(scrim.current, { opacity: 0 }, { opacity: 1 }, 0)
      .fromTo(
        panel.current,
        { clipPath: "inset(0% 0% 0% 100%)", xPercent: 8 },
        { clipPath: "inset(0% 0% 0% 0%)", xPercent: 0 },
        0
      );
  }, [openId]);

  // Browser Back closes the panel.
  useEffect(() => {
    const onPop = () => {
      if (dialog.current?.open && !window.history.state?.[HISTORY_KEY]) closeNow();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [closeNow]);

  return (
    <dialog
      ref={dialog}
      className="program-dialog"
      aria-labelledby="program-dialog-title"
      onCancel={(e) => {
        e.preventDefault(); // Escape: animate out instead of an instant close
        requestClose();
      }}
    >
      <div ref={scrim} className="program-dialog__scrim" onClick={requestClose} aria-hidden="true" />
      <div ref={panel} className="program-dialog__panel">
        <button type="button" className="program-dialog__close" onClick={requestClose}>
          Close
        </button>
        {program && (
          <>
            <h2 id="program-dialog-title" className="program-dialog__title">
              {program.name}
            </h2>
            <p className="program-dialog__squad">{program.squad} squad</p>
            <dl className="program-dialog__facts">
              <div>
                <dt>Date</dt>
                <dd>{program.date}</dd>
              </div>
              <div>
                <dt>Venue</dt>
                <dd>{program.venue}</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd>{program.fee}</dd>
              </div>
              <div>
                <dt>Rules</dt>
                <dd>{program.rules}</dd>
              </div>
            </dl>
            <button type="button" className="program-dialog__register" disabled>
              Register <span>Opens soon</span>
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
