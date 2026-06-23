'use client'

import { useBetting } from '@/context/BettingContext'
import { sportEmoji, calcPayout } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#eab308', '#6b7280']

export default function DashboardPage() {
  const { state } = useBetting()
  const settled = state.placedBets.filter((b) => b.result !== 'pending')

  const wins = settled.filter((b) => b.result === 'win').length
  const losses = settled.filter((b) => b.result === 'loss').length
  const pushes = settled.filter((b) => b.result === 'push').length

  const totalStaked = settled.reduce((s, b) => s + b.stake, 0)
  const totalReturned = settled.reduce((s, b) => s + (b.payout ?? 0), 0)
  const netPnl = totalReturned - totalStaked
  const roi = totalStaked > 0 ? (netPnl / totalStaked) * 100 : 0

  // Cumulative P&L over time
  const sorted = [...settled].sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime())
  let running = 0
  const pnlData = sorted.map((b, i) => {
    const profit = b.result === 'win' ? (b.payout ?? 0) - b.stake : b.result === 'push' ? 0 : -b.stake
    running += profit
    return { name: `Bet ${i + 1}`, pnl: parseFloat(running.toFixed(2)) }
  })

  // By sport
  const sportMap: Record<string, { wagered: number; returned: number; count: number }> = {}
  settled.forEach((b) => {
    if (!sportMap[b.sport]) sportMap[b.sport] = { wagered: 0, returned: 0, count: 0 }
    sportMap[b.sport].wagered += b.stake
    sportMap[b.sport].returned += b.payout ?? 0
    sportMap[b.sport].count++
  })

  const sportData = Object.entries(sportMap).map(([sport, d]) => ({
    sport,
    pnl: parseFloat((d.returned - d.wagered).toFixed(2)),
    count: d.count,
  }))

  // By bet type
  const typeMap: Record<string, { count: number; wins: number }> = {}
  settled.forEach((b) => {
    if (!typeMap[b.betType]) typeMap[b.betType] = { count: 0, wins: 0 }
    typeMap[b.betType].count++
    if (b.result === 'win') typeMap[b.betType].wins++
  })

  const pieData = [
    { name: 'Win', value: wins },
    { name: 'Loss', value: losses },
    { name: 'Push', value: pushes },
  ].filter((d) => d.value > 0)

  const winRate = settled.length ? (wins / settled.length) * 100 : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Bankroll', value: `$${state.bankroll.toFixed(2)}`, sub: 'current balance', color: 'text-white' },
          { label: 'Net P&L', value: `${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`, sub: 'all time', color: netPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'ROI', value: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`, sub: `${totalStaked.toFixed(0)} wagered`, color: roi >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, sub: `${wins}W / ${losses}L / ${pushes}P`, color: 'text-white' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {settled.length > 0 ? (
        <>
          {/* P&L chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="font-bold text-white mb-4">Cumulative P&L</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={pnlData}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9' }}
                  formatter={(v) => [`$${v}`, 'P&L']}
                />
                <Area type="monotone" dataKey="pnl" stroke="#10b981" fill="url(#pnlGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Record pie */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="font-bold text-white mb-4">Win/Loss Record</h2>
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={pieData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-sm text-slate-300">{d.name}</span>
                      <span className="text-sm font-bold text-white ml-auto pl-4">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* By sport */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="font-bold text-white mb-4">P&L by Sport</h2>
              <div className="space-y-2">
                {sportData.map((d) => (
                  <div key={d.sport} className="flex items-center gap-2">
                    <span>{sportEmoji(d.sport)}</span>
                    <span className="text-sm text-slate-300 flex-1">{d.sport}</span>
                    <span className="text-xs text-slate-500">{d.count} bets</span>
                    <span className={`text-sm font-bold ${d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {d.pnl >= 0 ? '+' : ''}${d.pnl}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bet type breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="font-bold text-white mb-4">Win Rate by Bet Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(typeMap).map(([type, d]) => {
                const wr = d.count ? (d.wins / d.count) * 100 : 0
                return (
                  <div key={type} className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 capitalize mb-1">{type}</p>
                    <p className={`text-lg font-black ${wr >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{wr.toFixed(0)}%</p>
                    <p className="text-xs text-slate-600">{d.wins}W / {d.count - d.wins}L</p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-slate-400">Place some bets to see your analytics here.</p>
        </div>
      )}
    </div>
  )
}
