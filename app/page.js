// Phase 2: the hero proof. One continuous scroll: the headline turns into stars,
// the stars form ASTRA 2027, the camera flies through, and we arrive at Arts.
// The 3D canvas behind is fixed; this page only provides the scroll length.
import HeroTitle from "@/components/Hero/HeroTitle";
import ArtsArrival from "@/components/Hero/ArtsArrival";
import ScrollReadout from "@/components/Debug/ScrollReadout";
import { hero } from "@/lib/motion";

export default function Home() {
  return (
    <main>
      <HeroTitle />
      {/* Scroll room for the sequence: first screen + this spacer + Arts screen = scrollLengthVh */}
      <div
        aria-hidden="true"
        className="hero-spacer"
        style={{ "--hero-spacer": `${hero.scrollLengthVh - 200}vh` }}
      />
      <ArtsArrival />
      <ScrollReadout />
    </main>
  );
}
