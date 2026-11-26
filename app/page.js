// One continuous scroll: stars form ASTRA 2027, a transmission goes out, the
// camera flies through the letters, travels through the five squad stops, and
// the squads come together into the logo in the finale. The 3D canvas behind
// is fixed; this page provides the real text, the buttons and the scroll length.
import HeroTitle from "@/components/Hero/HeroTitle";
import Transmission from "@/components/Story/Transmission";
import SquadJourney from "@/components/Journey/SquadJourney";
import Finale from "@/components/Story/Finale";
import Hud from "@/components/HUD/Hud";
import ProgramIndex from "@/components/Journey/ProgramIndex";
import ProgramDialog from "@/components/Journey/ProgramDialog";
import ScrollReadout from "@/components/Debug/ScrollReadout";
import Menu from "@/components/Menu/Menu";
import { TOTAL_SCROLL_VH } from "@/lib/journey";
import { touchScroll } from "@/lib/motion";

export default function Home() {
  return (
    <>
      <main>
        <HeroTitle />
        <Transmission />
        {/* Scroll room for the hero flight, the five stops and the finale (removed in static mode).
            Touch screens get touchScroll.lengthMultiplier times more (CSS, so no reload jump). */}
        <div
          aria-hidden="true"
          className="journey-spacer"
          style={{
            "--journey-spacer": `${TOTAL_SCROLL_VH}vh`,
            "--touch-length": touchScroll.lengthMultiplier,
          }}
        />
        <SquadJourney />
        <Finale />
        <ProgramIndex />
        <Hud />
        <ProgramDialog />
        <ScrollReadout />
      </main>
      {/* Outside <main>: the menu makes <main> inert while open, never itself. */}
      <Menu />
    </>
  );
}
