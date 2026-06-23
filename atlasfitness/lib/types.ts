export type Sport = 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'MMA' | 'NCAAB'

export interface Team {
  name: string
  abbreviation: string
  record: string
}

export interface OddsLine {
  moneyline: number
  spread: number
  spreadOdds: number
  total: number
  totalOddsOver: number
  totalOddsUnder: number
}

export interface Game {
  id: string
  sport: Sport
  homeTeam: Team
  awayTeam: Team
  startTime: string
  homeOdds: OddsLine
  awayOdds: OddsLine
  status: 'upcoming' | 'live' | 'final'
  homeScore?: number
  awayScore?: number
  liveQuarter?: string
}

export type BetType = 'moneyline' | 'spread' | 'over' | 'under'

export interface BetSelection {
  gameId: string
  sport: Sport
  teamName: string
  betType: BetType
  odds: number
  spread?: number
  total?: number
  displayLabel: string
}

export interface BetSlipItem extends BetSelection {
  id: string
  stake?: number
}

export interface PlacedBet {
  id: string
  gameId: string
  sport: Sport
  teamName: string
  betType: BetType
  odds: number
  spread?: number
  total?: number
  displayLabel: string
  stake: number
  placedAt: string
  result: 'win' | 'loss' | 'push' | 'pending'
  payout?: number
}

export type PickConfidence = 'high' | 'medium' | 'low'

export interface Pick {
  id: string
  gameId: string
  betType: BetType
  teamName: string
  odds: number
  spread?: number
  total?: number
  displayLabel: string
  confidence: PickConfidence
  rationale: string
  units: number
  sport: Sport
}
