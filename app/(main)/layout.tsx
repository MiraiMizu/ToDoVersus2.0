import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Centered page container - optimized for desktop & mobile */}
      <main className="pt-6 pb-32 min-h-screen">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          {children}
        </div>
      </main>
      <Navbar />
    </div>
  )
}
