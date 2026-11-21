import Navbar from '@/components/layout/Navbar'
import HeroSplit from '@/components/hero/HeroSplit'
import SplitHeading from '@/components/ui/SplitHeading'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <HeroSplit />

        {/* Section Title Showcase using <SplitHeading> */}
        <section className="py-16 sm:py-24 border-b border-[var(--w-border)] text-center px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--w-accent)] mb-3 block">
              [01 // MANIFESTO]
            </span>
            <SplitHeading
              as="h2"
              text="WHERE RAW INK MEETS DIGITAL CODE"
              accentLetters={[0, 8, 23]}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
            />
            <p className="mt-4 text-sm sm:text-base text-[var(--w-text-secondary)] max-w-xl mx-auto leading-relaxed">
              Two days of clash and convergence at Don Bosco College, Mampetta.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
