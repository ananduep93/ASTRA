// One continuous scroll: stars form ASTRA 2027, a transmission goes out, the
// camera flies through the letters, the star-iris turns the world white, the
// programs section (a normal page section) follows while the scene holds, then
// the finale, where the dots gather into the logo. The 3D canvas behind is fixed; this page provides the
// real text, the buttons and the scroll length.
import HeroTitle from "@/components/Hero/HeroTitle";
import Transmission from "@/components/Story/Transmission";
import Programs from "@/components/Programs/Programs";
import ProgramDetail from "@/components/Programs/ProgramDetail";
import Finale from "@/components/Story/Finale";
import Hud from "@/components/HUD/Hud";
import ScrollReadout from "@/components/Debug/ScrollReadout";
import Menu from "@/components/Menu/Menu";
import { HERO_END } from "@/lib/journey";
import { finale as FIN, touchScroll } from "@/lib/motion";

/** Scroll room for a fixed part of the story (removed in static mode). Touch screens get more (CSS, no reload jump). */
function Spacer({ vh }) {
  return (
    <div
      aria-hidden="true"
      className="journey-spacer"
      style={{ "--journey-spacer": `${vh}vh`, "--touch-length": touchScroll.lengthMultiplier }}
    />
  );
}

export default function Home() {
  return (
    <>
      <main>
        <HeroTitle />
        <Transmission />
        <Spacer vh={HERO_END} />
        <Programs />
        <Spacer vh={FIN.vh} />
        <Finale />
        <Hud />
        <ScrollReadout />
      </main>
      {/* Outside <main>: the menu and the detail make <main> inert while open, never themselves. */}
      <Menu />
      <ProgramDetail />
    </>
  );
}
