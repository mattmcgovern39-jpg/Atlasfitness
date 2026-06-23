'use client'

import { Game } from '@/lib/types'
import { formatOdds, formatTime, sportEmoji } from '@/lib/utils'
import { useBetting } from '@/context/BettingContext'

interface Props {
  game: Game
}

function OddsBtn({ gameId, sport, teamName, betType, odds, spread, total, displayLabel, sublabel }: {
  gameId: string
  sport: Game['sport']
  teamName: string
  betType: 'moneyline' | 'spread' | 'over' | 'under'
  odds: number
  spread?: number
  total?: number
  displayLabel: string
  sublabel: string
}) {
  const { addToSlip, isInSlip } = useBetting()
  const active = isInSlip(gameId, betType, teamName)

  return (
    <button
      onClick={() => addToSlip({ gameId, sport, teamName, betType, odds, spread, total, displayLabel })}
      className={`flex flex-col items-center justify-center rounded-lg border px-2 py-2 w-full transition-all ${
        active
          ? 'bg-emerald-500 border-emerald-400 text-black'
          : 'bg-slate-800/80 border-slate-700 hover:border-emerald-500 hover:bg-slate-700 text-white'
      }`}
    >
      <span className={`text-[10px] font-medium ${active ? 'text-black/70' : 'text-slate-400'}`}>{sublabel}</span>
      <span className="text-sm font-bold leading-tight">{formatOdds(odds)}</span>
    </button>
  )
}

export default function GameCard({ game }: Props) {
  const isLive = game.status === 'live'

  return (
    <div className={`rounded-xl border ${isLive ? 'border-emerald-700/50 bg-slate-900' : 'border-slate-800 bg-slate-900/60'} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xs">{sportEmoji(game.sport)}</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{game.sport}</span>
        </div>
        {isLive ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-red-400">{game.liveQuarter ?? 'LIVE'}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">{formatTime(game.startTime)}</span>
        )}
      </div>

      {/* Teams + odds grid */}
      <div className="p-4">
        {/* Column labels */}
        <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 mb-2">
          <div />
          <span className="text-[10px] text-center text-slate-500 uppercase tracking-wider">Spread</span>
          <span className="text-[10px] text-center text-slate-500 uppercase tracking-wider">Total</span>
          <span className="text-[10px] text-center text-slate-500 uppercase tracking-wider">ML</span>
        </div>

        {/* Away team row */}
        <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm text-white truncate">{game.awayTeam.name}</span>
            {isLive && (
              <span className="text-lg font-black text-white ml-auto pr-2">{game.awayScore}</span>
            )}
          </div>
          <OddsBtn
            gameId={game.id} sport={game.sport}
            teamName={game.awayTeam.name} betType="spread"
            odds={game.awayOdds.spreadOdds} spread={game.awayOdds.spread}
            displayLabel={`${game.awayTeam.abbreviation} ${game.awayOdds.spread > 0 ? '+' : ''}${game.awayOdds.spread}`}
            sublabel={`${game.awayOdds.spread > 0 ? '+' : ''}${game.awayOdds.spread}`}
          />
          <OddsBtn
            gameId={game.id} sport={game.sport}
            teamName={`Over ${game.awayOdds.total}`} betType="over"
            odds={game.awayOdds.totalOddsOver} total={game.awayOdds.total}
            displayLabel={`O${game.awayOdds.total}`}
            sublabel={`O ${game.awayOdds.total}`}
          />
          <OddsBtn
            gameId={game.id} sport={game.sport}
            teamName={game.awayTeam.name} betType="moneyline"
            odds={game.awayOdds.moneyline}
            displayLabel={`${game.awayTeam.abbreviation} ML`}
            sublabel="ML"
          />
        </div>

        {/* Home team row */}
        <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm text-white truncate">{game.homeTeam.name}</span>
            {isLive && (
              <span className="text-lg font-black text-white ml-auto pr-2">{game.homeScore}</span>
            )}
          </div>
          <OddsBtn
            gameId={game.id} sport={game.sport}
            teamName={game.homeTeam.name} betType="spread"
            odds={game.homeOdds.spreadOdds} spread={game.homeOdds.spread}
            displayLabel={`${game.homeTeam.abbreviation} ${game.homeOdds.spread > 0 ? '+' : ''}${game.homeOdds.spread}`}
            sublabel={`${game.homeOdds.spread > 0 ? '+' : ''}${game.homeOdds.spread}`}
          />
          <OddsBtn
            gameId={game.id} sport={game.sport}
            teamName={`Under ${game.homeOdds.total}`} betType="under"
            odds={game.homeOdds.totalOddsUnder} total={game.homeOdds.total}
            displayLabel={`U${game.homeOdds.total}`}
            sublabel={`U ${game.homeOdds.total}`}
          />
          <OddsBtn
            gameId={game.id} sport={game.sport}
            teamName={game.homeTeam.name} betType="moneyline"
            odds={game.homeOdds.moneyline}
            displayLabel={`${game.homeTeam.abbreviation} ML`}
            sublabel="ML"
          />
        </div>
      </div>
    </div>
  )
}
