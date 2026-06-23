export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`
}

export function calcPayout(stake: number, odds: number): number {
  if (odds > 0) {
    return stake + (stake * odds) / 100
  } else {
    return stake + (stake * 100) / Math.abs(odds)
  }
}

export function calcProfit(stake: number, odds: number): number {
  return calcPayout(stake, odds) - stake
}

export function impliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100)
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100)
  }
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function sportEmoji(sport: string): string {
  const map: Record<string, string> = {
    NBA: '🏀',
    MLB: '⚾',
    NFL: '🏈',
    NHL: '🏒',
    MMA: '🥊',
    NCAAB: '🏀',
    NCAAF: '🏈',
  }
  return map[sport] ?? '🎯'
}
