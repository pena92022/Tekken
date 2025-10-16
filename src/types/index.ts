export type { Database } from './database'

export interface Character {
  id: string
  name: string
}

export interface FrameData {
  id: string
  characterId: string
  moveName: string
  notation: string
  damage: number
  startupFrames: number
  activeFrames: number
  recoveryFrames: number
  onBlock: number
  onHit: number
}

export interface Matchup {
  id: string
  playerCharacterId: string
  opponentCharacterId: string
  difficulty: number
  strategies: string[]
}

export interface UserProfile {
  id: string
  email: string
  credits: number
  tier: 'free' | 'premium'
  preferences: UserPreferences
}

export interface UserPreferences {
  modelProvider: 'shared' | 'openai' | 'claude' | 'gemini' | 'ollama'
  modelName?: string
  ollamaEndpoint?: string
  apiKey?: string
  defaultCharacter?: string
  verbosity: 'quick' | 'detailed'
}

export interface MatchAnalysisRequest {
  playerCharacter: string
  opponentCharacter: string
}

export interface MatchAnalysis {
  punishOptions: {
    opponentMove: string
    punishMove: string
    punishWindow: string
    frameAdvantage: string
    description: string
  }[]
  optimalPunishes: {
    window: string
    recommendedMoves: string[]
    situations: string[]
  }[]
  strategies: {
    name: string
    description: string
    conditions: string[]
    moves: string[]
  }[]
  tips: string[]
}

export interface AIModelConfig {
  provider: string
  model: string
  apiKey?: string
  endpoint?: string
}

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: 'purchase' | 'usage'
  description: string
  stripePaymentId?: string
  createdAt: string
}