import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* pt-0 because header is gone, pb-32 for bottom floating dock */}
      <main className="pt-4 pb-32 min-h-screen">
        {children}
      </main>
      <Navbar />
    </div>
  )
}
