import type { Metadata } from 'next'
import './globals.css'
import { BettingProvider } from '@/context/BettingContext'
import Navbar from '@/components/Navbar'
import BetSlip from '@/components/BetSlip'

export const metadata: Metadata = {
  title: 'Atlas Sportsbook',
  description: 'Track, analyze, and place bets like a sharp.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased">
        <BettingProvider>
          <Navbar />
          <BetSlip />
          <main className="pt-14 md:pt-14 max-w-7xl mx-auto px-4 py-6">{children}</main>
        </BettingProvider>
      </body>
    </html>
  )
}
