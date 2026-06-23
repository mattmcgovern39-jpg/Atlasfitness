'use client'

import { X, Trash2, ChevronRight } from 'lucide-react'
import { useBetting } from '@/context/BettingContext'
import { formatOdds, calcPayout } from '@/lib/utils'

export default function BetSlip() {
  const { state, removeFromSlip, updateStake, clearSlip, placeBets, toggleSlip, totalStake, totalPotentialPayout } = useBetting()

  return (
    <>
      {/* Backdrop */}
      {state.betSlipOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={toggleSlip} />
      )}

      {/* Slip panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-950 border-l border-slate-800 z-50 flex flex-col transition-transform duration-300 ${
          state.betSlipOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 mt-14">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Bet Slip</span>
            {state.betSlip.length > 0 && (
              <span className="bg-emerald-500 text-black text-xs font-bold rounded-full px-1.5">{state.betSlip.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {state.betSlip.length > 0 && (
              <button onClick={clearSlip} className="text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
            )}
            <button onClick={toggleSlip} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Slip items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.betSlip.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
              <span className="text-4xl">🎯</span>
              <p className="text-slate-400 text-sm">Your bet slip is empty.<br />Click any odds to add a bet.</p>
            </div>
          ) : (
            state.betSlip.map((item) => {
              const profit = item.stake ? calcPayout(item.stake, item.odds) - item.stake : null
              return (
                <div key={item.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white text-sm">{item.displayLabel}</p>
                      <p className="text-xs text-slate-500 capitalize">{item.betType} · {item.sport}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${item.odds > 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {formatOdds(item.odds)}
                      </span>
                      <button onClick={() => removeFromSlip(item.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        min={1}
                        placeholder="Stake"
                        value={item.stake ?? ''}
                        onChange={(e) => updateStake(item.id, Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-6 pr-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    {profit !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">Win</p>
                        <p className="text-sm font-bold text-emerald-400">+${profit.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {state.betSlip.length > 0 && (
          <div className="border-t border-slate-800 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Stake</span>
              <span className="font-semibold text-white">${totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Potential Payout</span>
              <span className="font-bold text-emerald-400">${totalPotentialPayout.toFixed(2)}</span>
            </div>
            <button
              onClick={placeBets}
              disabled={totalStake === 0 || totalStake > state.bankroll}
              className="w-full bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-emerald-400 text-black disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Place {state.betSlip.length} Bet{state.betSlip.length !== 1 ? 's' : ''}
              <ChevronRight size={16} />
            </button>
            {totalStake > state.bankroll && (
              <p className="text-xs text-red-400 text-center">Insufficient bankroll</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
