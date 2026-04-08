export const runtime = 'edge';
import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Full-width centered column - desktop optimized */}
      <main className="w-full max-w-[1280px] pt-6 pb-32 px-4 sm:px-6 lg:px-10 xl:px-14 min-h-screen">
        {children}
      </main>
      <Navbar />
    </div>
  )
}
