'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, TrendingUp, BarChart2, Zap } from 'lucide-react'
import { useBetting } from '@/context/BettingContext'

export default function Navbar() {
  const pathname = usePathname()
  const { state, toggleSlip } = useBetting()
  const slipCount = state.betSlip.length

  const navLinks = [
    { href: '/', label: 'Odds', icon: Zap },
    { href: '/picks', label: 'Picks', icon: TrendingUp },
    { href: '/bets', label: 'My Bets', icon: BarChart2 },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  ]

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-emerald-400 font-black text-xl tracking-tight">ATLAS</span>
          <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase mt-0.5">Sportsbook</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-slate-500">Bankroll</span>
            <span className="text-sm font-bold text-emerald-400">${state.bankroll.toFixed(2)}</span>
          </div>

          <button
            onClick={toggleSlip}
            className="relative flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <ShoppingCart size={15} />
            <span>Bet Slip</span>
            {slipCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {slipCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-slate-800">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
              pathname === href ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
