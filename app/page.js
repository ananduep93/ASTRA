// One continuous scroll: stars assemble ASTRA 2027, the camera flies through the
// letters, then travels through the five squad stops. The 3D canvas behind is
// fixed; this page provides the real text, the buttons and the scroll length.
import HeroTitle from "@/components/Hero/HeroTitle";
import SquadJourney from "@/components/Journey/SquadJourney";
import ProgressMarks from "@/components/Journey/ProgressMarks";
import ProgramDialog from "@/components/Journey/ProgramDialog";
import ScrollReadout from "@/components/Debug/ScrollReadout";
import { TOTAL_SCROLL_VH } from "@/lib/journey";
import { touchScroll } from "@/lib/motion";

export default function Home() {
  return (
    <main>
      <HeroTitle />
      {/* Scroll room for the hero flight and the five stops (removed in static mode).
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
      <ProgressMarks />
      <ProgramDialog />
      <ScrollReadout />
    </main>
  );
}
