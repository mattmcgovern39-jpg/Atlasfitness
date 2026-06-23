'use client'

import { useState } from 'react'
import { MOCK_GAMES } from '@/lib/mockData'
import GameCard from '@/components/GameCard'
import { Sport } from '@/lib/types'
import { sportEmoji } from '@/lib/utils'

const SPORTS: (Sport | 'All')[] = ['All', 'NBA', 'MLB', 'NHL', 'MMA', 'NCAAB']

export default function OddsPage() {
  const [activeSport, setActiveSport] = useState<Sport | 'All'>('All')

  const liveGames = MOCK_GAMES.filter((g) => g.status === 'live')
  const upcomingGames = MOCK_GAMES.filter((g) => g.status === 'upcoming')

  const filterGames = (games: typeof MOCK_GAMES) =>
    activeSport === 'All' ? games : games.filter((g) => g.sport === activeSport)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Today&apos;s Games</h1>
        <p className="text-slate-400 text-sm mt-1">Click any odds to add to your bet slip</p>
      </div>

      {/* Sport filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            onClick={() => setActiveSport(sport)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeSport === sport
                ? 'bg-emerald-500 text-black'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {sport !== 'All' && <span>{sportEmoji(sport)}</span>}
            {sport}
          </button>
        ))}
      </div>

      {/* Live games */}
      {filterGames(liveGames).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Live Now</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {filterGames(liveGames).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming games */}
      {filterGames(upcomingGames).length > 0 && (
        <section>
          <h2 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {filterGames(upcomingGames).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {filterGames([...liveGames, ...upcomingGames]).length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">{activeSport !== 'All' ? sportEmoji(activeSport) : '🎯'}</p>
          <p>No {activeSport !== 'All' ? activeSport : ''} games today</p>
        </div>
      )}
    </div>
  )
}
