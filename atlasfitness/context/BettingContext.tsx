'use client'

import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { BetSlipItem, PlacedBet, BetSelection } from '@/lib/types'
import { MOCK_BET_HISTORY } from '@/lib/mockData'
import { calcPayout } from '@/lib/utils'

interface BettingState {
  bankroll: number
  betSlip: BetSlipItem[]
  placedBets: PlacedBet[]
  betSlipOpen: boolean
}

type Action =
  | { type: 'ADD_TO_SLIP'; payload: BetSelection }
  | { type: 'REMOVE_FROM_SLIP'; payload: string }
  | { type: 'UPDATE_STAKE'; payload: { id: string; stake: number } }
  | { type: 'CLEAR_SLIP' }
  | { type: 'PLACE_BETS' }
  | { type: 'TOGGLE_SLIP' }
  | { type: 'SET_BANKROLL'; payload: number }

const initialState: BettingState = {
  bankroll: 1000,
  betSlip: [],
  placedBets: MOCK_BET_HISTORY,
  betSlipOpen: false,
}

function reducer(state: BettingState, action: Action): BettingState {
  switch (action.type) {
    case 'ADD_TO_SLIP': {
      const exists = state.betSlip.find(
        (b) => b.gameId === action.payload.gameId && b.betType === action.payload.betType && b.teamName === action.payload.teamName
      )
      if (exists) return state
      const newItem: BetSlipItem = {
        ...action.payload,
        id: `slip-${Date.now()}-${Math.random()}`,
        stake: undefined,
      }
      return { ...state, betSlip: [...state.betSlip, newItem], betSlipOpen: true }
    }
    case 'REMOVE_FROM_SLIP':
      return { ...state, betSlip: state.betSlip.filter((b) => b.id !== action.payload) }
    case 'UPDATE_STAKE':
      return {
        ...state,
        betSlip: state.betSlip.map((b) =>
          b.id === action.payload.id ? { ...b, stake: action.payload.stake } : b
        ),
      }
    case 'CLEAR_SLIP':
      return { ...state, betSlip: [] }
    case 'PLACE_BETS': {
      const newBets: PlacedBet[] = state.betSlip
        .filter((b) => b.stake && b.stake > 0)
        .map((b) => ({
          ...b,
          stake: b.stake!,
          placedAt: new Date().toISOString(),
          result: 'pending',
          payout: undefined,
        }))
      const totalStake = newBets.reduce((sum, b) => sum + b.stake, 0)
      return {
        ...state,
        placedBets: [...newBets, ...state.placedBets],
        betSlip: [],
        bankroll: state.bankroll - totalStake,
        betSlipOpen: false,
      }
    }
    case 'TOGGLE_SLIP':
      return { ...state, betSlipOpen: !state.betSlipOpen }
    case 'SET_BANKROLL':
      return { ...state, bankroll: action.payload }
    default:
      return state
  }
}

interface BettingContextType {
  state: BettingState
  addToSlip: (selection: BetSelection) => void
  removeFromSlip: (id: string) => void
  updateStake: (id: string, stake: number) => void
  clearSlip: () => void
  placeBets: () => void
  toggleSlip: () => void
  isInSlip: (gameId: string, betType: string, teamName: string) => boolean
  totalPotentialPayout: number
  totalStake: number
}

const BettingContext = createContext<BettingContextType | null>(null)

export function BettingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('atlas-betting-state')
        if (saved) {
          const parsed = JSON.parse(saved)
          return { ...init, bankroll: parsed.bankroll ?? init.bankroll, placedBets: parsed.placedBets ?? init.placedBets }
        }
      } catch {}
    }
    return init
  })

  useEffect(() => {
    localStorage.setItem('atlas-betting-state', JSON.stringify({ bankroll: state.bankroll, placedBets: state.placedBets }))
  }, [state.bankroll, state.placedBets])

  const totalStake = state.betSlip.reduce((sum, b) => sum + (b.stake ?? 0), 0)
  const totalPotentialPayout = state.betSlip.reduce((sum, b) => {
    if (!b.stake) return sum
    return sum + calcPayout(b.stake, b.odds)
  }, 0)

  return (
    <BettingContext.Provider
      value={{
        state,
        addToSlip: (sel) => dispatch({ type: 'ADD_TO_SLIP', payload: sel }),
        removeFromSlip: (id) => dispatch({ type: 'REMOVE_FROM_SLIP', payload: id }),
        updateStake: (id, stake) => dispatch({ type: 'UPDATE_STAKE', payload: { id, stake } }),
        clearSlip: () => dispatch({ type: 'CLEAR_SLIP' }),
        placeBets: () => dispatch({ type: 'PLACE_BETS' }),
        toggleSlip: () => dispatch({ type: 'TOGGLE_SLIP' }),
        isInSlip: (gameId, betType, teamName) =>
          state.betSlip.some((b) => b.gameId === gameId && b.betType === betType && b.teamName === teamName),
        totalPotentialPayout,
        totalStake,
      }}
    >
      {children}
    </BettingContext.Provider>
  )
}

export function useBetting() {
  const ctx = useContext(BettingContext)
  if (!ctx) throw new Error('useBetting must be used inside BettingProvider')
  return ctx
}
