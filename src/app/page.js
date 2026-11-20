import Navbar from '@/components/layout/Navbar'
import HeroSplit from '@/components/hero/HeroSplit'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <HeroSplit />
      </main>
      <Footer />
    </div>
  )
}
