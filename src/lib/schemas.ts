import { z } from 'zod'

// Schema for Key Moves
export const KeyMoveSchema = z.object({
  name: z.string().min(1, 'Move name is required'),
  notation: z.string().min(1, 'Notation is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['high', 'medium', 'low'])
})

// Schema for Counter Moves
export const CounterMoveSchema = z.object({
  move: z.string().min(1, 'Opponent move is required'),
  counter: z.string().min(1, 'Counter move is required'),
  frameAdvantage: z.number().int()
})

// Schema for Strategies
export const StrategySchema = z.object({
  name: z.string().min(1, 'Strategy name is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  conditions: z.array(z.string()).min(1, 'At least one condition is required'),
  moves: z.array(z.string()).min(1, 'At least one move is required')
})

// Schema for Punish Options
export const PunishOptionSchema = z.object({
  opponentMove: z.string().min(1, 'Opponent move is required'),
  punishMove: z.string().min(1, 'Punish move is required'),
  punishWindow: z.string().min(1, 'Punish window is required'),
  frameAdvantage: z.string().min(1, 'Frame advantage is required'),
  description: z.string().min(10, 'Description must be at least 10 characters')
})

// Schema for Optimal Punishes
export const OptimalPunishSchema = z.object({
  window: z.string().min(1, 'Window is required'),
  recommendedMoves: z.array(z.string()).min(1, 'At least one recommended move required'),
  situations: z.array(z.string()).min(1, 'At least one situation required')
})

// Main Match Analysis Schema
export const MatchAnalysisSchema = z.object({
  punishOptions: z.array(PunishOptionSchema).min(8, 'At least 8 punish options required'),
  optimalPunishes: z.array(OptimalPunishSchema).min(3, 'At least 3 optimal punishes required'),
  strategies: z.array(StrategySchema).min(3, 'At least 3 strategies required'),
  tips: z.array(z.string()).min(3, 'At least 3 tips required')
})

// TekkenDocs API Response Schemas
export const TekkenDocsMoveSchema = z.object({
  moveNumber: z.number(),
  command: z.string(),
  hitLevel: z.string(),
  damage: z.string(),
  startup: z.string(),
  block: z.string(),
  hit: z.string(),
  counterHit: z.string(),
  notes: z.string()
})

export const TekkenDocsResponseSchema = z.object({
  characterName: z.string(),
  editUrl: z.string(),
  game: z.enum(['T7', 'T8']),
  framesNormal: z.array(TekkenDocsMoveSchema),
  stances: z.array(z.string())
})

// Validation functions
export function validateMatchAnalysis(data: unknown) {
  return MatchAnalysisSchema.parse(data)
}

export function validateTekkenDocsResponse(data: unknown) {
  return TekkenDocsResponseSchema.parse(data)
}

// Type exports
export type KeyMove = z.infer<typeof KeyMoveSchema>
export type CounterMove = z.infer<typeof CounterMoveSchema>
export type Strategy = z.infer<typeof StrategySchema>
export type ValidatedMatchAnalysis = z.infer<typeof MatchAnalysisSchema>
export type ValidatedTekkenDocsMove = z.infer<typeof TekkenDocsMoveSchema>
export type ValidatedTekkenDocsResponse = z.infer<typeof TekkenDocsResponseSchema>
