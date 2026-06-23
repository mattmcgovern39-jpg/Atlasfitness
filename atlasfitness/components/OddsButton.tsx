'use client'

import { formatOdds } from '@/lib/utils'
import { BetSelection } from '@/lib/types'
import { useBetting } from '@/context/BettingContext'

interface Props {
  selection: BetSelection
  label?: string
  sublabel?: string
}

export default function OddsButton({ selection, label, sublabel }: Props) {
  const { addToSlip, isInSlip } = useBetting()
  const active = isInSlip(selection.gameId, selection.betType, selection.teamName)

  return (
    <button
      onClick={() => addToSlip(selection)}
      className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border text-center min-w-[72px] transition-all ${
        active
          ? 'bg-emerald-500 border-emerald-400 text-black'
          : 'bg-slate-800 border-slate-700 text-white hover:border-emerald-500 hover:bg-slate-700'
      }`}
    >
      {sublabel && <span className={`text-[10px] font-medium mb-0.5 ${active ? 'text-black/70' : 'text-slate-400'}`}>{sublabel}</span>}
      <span className="text-sm font-bold">{label ?? formatOdds(selection.odds)}</span>
      {!label && sublabel === undefined && (
        <span className={`text-[10px] ${active ? 'text-black/70' : 'text-slate-400'}`}>{formatOdds(selection.odds)}</span>
      )}
    </button>
  )
}
