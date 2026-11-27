// ASTRA #2027, Design B: the website is one continuous comic issue.
// Cover -> opening page -> Chapter 1 (Arts) in Phase B1.
import Issue from "@/components/Issue/Issue";
import ProgramSheet from "@/components/Issue/ProgramSheet";
import Hud from "@/components/Hud/Hud";

export default function Home() {
  return (
    <>
      <main>
        <Issue />
        <ProgramSheet />
      </main>
      {/* Outside <main>: the menu makes <main> inert while open, never itself. */}
      <Hud />
    </>
  );
}
