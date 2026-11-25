// Phase 1 test page: just enough height to scroll and watch the 3D camera move.
import ScrollReadout from "@/components/Debug/ScrollReadout";

const blocks = [1, 2, 3, 4, 5, 6];

export default function Home() {
  return (
    <main className="px-gutter">
      <section className="flex min-h-svh items-end pb-xl">
        <h1 className="font-display text-display leading-[var(--astra-lh-display)] uppercase">
          ASTRA 2027
        </h1>
      </section>

      {blocks.map((n) => (
        <section
          key={n}
          aria-label={`Test block ${n}`}
          className="h-[120svh] border-t border-paper/10"
        />
      ))}

      <ScrollReadout />
    </main>
  );
}
