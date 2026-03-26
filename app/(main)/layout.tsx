import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {/* pt-14 for top bar, pb-16 for mobile bottom nav */}
      <main className="pt-14 pb-16 md:pb-6 min-h-screen">
        {children}
      </main>
    </div>
  )
}
