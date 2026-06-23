'use client'

import { MOCK_PICKS, MOCK_GAMES } from '@/lib/mockData'
import { formatOdds, sportEmoji } from '@/lib/utils'
import { useBetting } from '@/context/BettingContext'
import { TrendingUp, CheckCircle } from 'lucide-react'
import { PickConfidence } from '@/lib/types'

function confidenceConfig(c: PickConfidence) {
  if (c === 'high') return { label: 'HIGH', classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  if (c === 'medium') return { label: 'MED', classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
  return { label: 'LOW', classes: 'bg-slate-500/20 text-slate-400 border-slate-600' }
}

function unitDots(units: number) {
  return Array.from({ length: 3 }, (_, i) => (
    <span key={i} className={`w-2 h-2 rounded-full ${i < units * 2 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
  ))
}

export default function PicksPage() {
  const { addToSlip, isInSlip } = useBetting()

  const highPicks = MOCK_PICKS.filter((p) => p.confidence === 'high')
  const otherPicks = MOCK_PICKS.filter((p) => p.confidence !== 'high')

  const getGame = (gameId: string) => MOCK_GAMES.find((g) => g.id === gameId)

  const renderPick = (pick: typeof MOCK_PICKS[0]) => {
    const game = getGame(pick.gameId)
    const conf = confidenceConfig(pick.confidence)
    const inSlip = isInSlip(pick.gameId, pick.betType, pick.teamName)

    return (
      <div key={pick.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm">{sportEmoji(pick.sport)}</span>
              <span className="text-xs text-slate-500">{pick.sport}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${conf.classes}`}>
                {conf.label}
              </span>
              <div className="flex items-center gap-1 ml-1">{unitDots(pick.units)}</div>
              <span className="text-[10px] text-slate-500">{pick.units}u</span>
            </div>
            <p className="font-bold text-white">{pick.displayLabel}</p>
            {game && (
              <p className="text-xs text-slate-500 mt-0.5">
                {game.awayTeam.name} @ {game.homeTeam.name}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-lg font-black ${pick.odds > 0 ? 'text-emerald-400' : 'text-white'}`}>
              {formatOdds(pick.odds)}
            </span>
            <button
              onClick={() =>
                addToSlip({
                  gameId: pick.gameId,
                  sport: pick.sport,
                  teamName: pick.teamName,
                  betType: pick.betType,
                  odds: pick.odds,
                  spread: pick.spread,
                  total: pick.total,
                  displayLabel: pick.displayLabel,
                })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inSlip
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-500 text-black hover:bg-emerald-400'
              }`}
            >
              {inSlip ? (
                <>
                  <CheckCircle size={12} /> Added
                </>
              ) : (
                'Add to Slip'
              )}
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
          {pick.rationale}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <TrendingUp size={16} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Today&apos;s Picks</h1>
          <p className="text-slate-400 text-sm">Expert analysis — click to add straight to your slip</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>High confidence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span>Medium confidence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>Low confidence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ))}
          </div>
          <span>Units (max 1.5u)</span>
        </div>
      </div>

      {/* Best bets */}
      {highPicks.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3">⭐ Best Bets</h2>
          <div className="space-y-3">
            {highPicks.map(renderPick)}
          </div>
        </section>
      )}

      {/* Other picks */}
      {otherPicks.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Other Picks</h2>
          <div className="space-y-3">
            {otherPicks.map(renderPick)}
          </div>
        </section>
      )}
    </div>
  )
}
