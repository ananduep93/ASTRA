/**
 * State-based reveals: nothing rests half-revealed.
 *
 * The scroll only decides the STATE (shown or hidden). When it changes, the
 * paused GSAP timeline plays to its end (or back to its start) at its own
 * pace. So a panel or a line of text is always either fully visible, fully
 * hidden, or moving: never frozen half-clipped when the visitor stops.
 *
 *   const r = stateReveal(() => tl);  // a getter: timelines may be rebuilt
 *   r.set(on, jumped);                // every frame; cheap when nothing changes
 *   r.visible()                       // shown, or still playing in / out
 */
import gsap from "gsap";

/** True when the scene moved further in one frame than any paced frame can (a jump). */
export const isJump = (prevVh, vh) => Math.abs(vh - prevVh) > 20;

export function stateReveal(getTl) {
  let target = 0;
  let tween = null;
  const api = {
    set(on, instant = false) {
      const t = on ? 1 : 0;
      if (instant) {
        if (t !== target || getTl()?.progress() !== t) api.snap(on);
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
    snap(on) {
      tween?.kill();
      target = on ? 1 : 0;
      getTl()?.progress(target);
    },
    get target() {
      return target;
    },
    visible() {
      const tl = getTl();
      return target === 1 || (!!tl && tl.progress() > 0.001);
    },
    settled() {
      const tl = getTl();
      return target === 1 && !!tl && tl.progress() > 0.999;
    },
  };
  return api;
}
