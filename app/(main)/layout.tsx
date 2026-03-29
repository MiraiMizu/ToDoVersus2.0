import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* pt-16 for top bar, pb-24 for mobile bottom nav */}
      <main className="pt-16 pb-24 md:pb-10 min-h-screen">
        {children}
      </main>
    </div>
  )
}
