/**
 * State-based reveals: no text can rest half-clipped.
 *
 * Instead of tying a reveal's progress directly to scroll (which freezes it
 * half-way when the visitor stops inside the reveal range), the scroll only
 * decides the STATE: shown or hidden. When the state changes, the paused GSAP
 * timeline plays to the end (or back to the start) at its own pace, with the
 * eases it was built with. So inside a title's range it is always fully
 * visible, outside it is fully hidden, and in between it is always moving.
 *
 *   const r = stateReveal(() => tl);   // a getter: timelines are rebuilt on re-split
 *   r.set(scrollValue > 0.5, jumped);  // every frame; cheap when nothing changes
 *   jumped = isJump(prevVh, vh): the scene moved further than any paced frame can
 *   r.visible()                        // true while shown or still playing out
 */
import gsap from "gsap";

/** True when the scene moved further in one frame than the guided pace allows (a jump). */
export const isJump = (prevVh, vh) => Math.abs(vh - prevVh) > 20;

export function stateReveal(getTl) {
  let target = 0;
  let tween = null;
  return {
    /** Ask for shown (true) or hidden (false); plays only when this changes.
     *  `instant`: the scene jumped (menu Home, reload): go straight there, no leftover animation. */
    set(on, instant = false) {
      const t = on ? 1 : 0;
      if (instant) {
        if (t !== target || getTl()?.progress() !== t) this.snap(on);
        return;
      }
      if (t === target) return;
      target = t;
      const tl = getTl();
      if (!tl) return;
      tween?.kill();
      const d = tl.duration() * Math.abs(t - tl.progress());
      tween = gsap.to(tl, { progress: t, duration: Math.max(0.01, d), ease: "none" });
    },
    /** Jump straight to a state (static mode, or a freshly rebuilt timeline). */
    snap(on) {
      tween?.kill();
      target = on ? 1 : 0;
      getTl()?.progress(target);
    },
    /** The state asked for (0 or 1): rebuilt timelines start here. */
    get target() {
      return target;
    },
    /** Shown, or still playing in / out. */
    visible() {
      const tl = getTl();
      return target === 1 || (!!tl && tl.progress() > 0.001);
    },
    /** Fully shown (for enabling buttons). */
    settled() {
      const tl = getTl();
      return target === 1 && !!tl && tl.progress() > 0.999;
    },
  };
}
