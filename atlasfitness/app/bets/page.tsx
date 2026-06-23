'use client'

import { useBetting } from '@/context/BettingContext'
import { formatOdds, formatDate, formatTime, sportEmoji } from '@/lib/utils'
import { PlacedBet } from '@/lib/types'

function ResultBadge({ result }: { result: PlacedBet['result'] }) {
  const map = {
    win: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    loss: 'bg-red-500/20 text-red-400 border-red-500/30',
    push: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    pending: 'bg-slate-500/20 text-slate-400 border-slate-600',
  }
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${map[result]}`}>
      {result}
    </span>
  )
}

export default function BetsPage() {
  const { state } = useBetting()
  const bets = state.placedBets

  const pending = bets.filter((b) => b.result === 'pending')
  const settled = bets.filter((b) => b.result !== 'pending')

  const totalWagered = settled.reduce((s, b) => s + b.stake, 0)
  const totalReturned = settled.reduce((s, b) => s + (b.payout ?? 0), 0)
  const netPnl = totalReturned - totalWagered
  const wins = settled.filter((b) => b.result === 'win').length
  const winRate = settled.length ? (wins / settled.length) * 100 : 0

  const renderBet = (bet: PlacedBet) => {
    const profit = bet.result === 'win' && bet.payout ? bet.payout - bet.stake : null
    return (
      <div key={bet.id} className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="text-lg">{sportEmoji(bet.sport)}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{bet.displayLabel}</p>
          <p className="text-xs text-slate-500">
            {formatDate(bet.placedAt)} · {formatTime(bet.placedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500">Stake</p>
            <p className="text-sm font-semibold text-white">${bet.stake}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Odds</p>
            <p className={`text-sm font-semibold ${bet.odds > 0 ? 'text-emerald-400' : 'text-white'}`}>
              {formatOdds(bet.odds)}
            </p>
          </div>
          {profit !== null && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Profit</p>
              <p className="text-sm font-bold text-emerald-400">+${profit.toFixed(2)}</p>
            </div>
          )}
          <ResultBadge result={bet.result} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">My Bets</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Net P&L', value: `${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`, color: netPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, color: 'text-white' },
          { label: 'Total Bets', value: String(settled.length), color: 'text-white' },
          { label: 'Pending', value: String(pending.length), color: 'text-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-yellow-400 mb-3">Pending</h2>
          <div className="space-y-2">{pending.map(renderBet)}</div>
        </section>
      )}

      {/* Settled */}
      {settled.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Settled</h2>
          <div className="space-y-2">{settled.map(renderBet)}</div>
        </section>
      )}

      {bets.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-400">No bets placed yet. Head to the odds board to get started.</p>
        </div>
      )}
    </div>
  )
}
