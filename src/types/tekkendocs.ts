export interface TekkenDocsMove {
  moveNumber: number
  command: string
  hitLevel: string
  damage: string
  startup: string
  block: string
  hit: string
  counterHit: string
  notes: string
}

export interface TekkenDocsFrameDataResponse {
  characterName: string
  editUrl: string
  game: 'T7' | 'T8'
  framesNormal: TekkenDocsMove[]
  stances: string[]
}

export interface MatchupContext {
  playerCharacter: string
  opponentCharacter: string
  playerMoves: TekkenDocsMove[]
  opponentMoves: TekkenDocsMove[]
  playerKeyMoves: TekkenDocsMove[]
  opponentPunishableMoves: TekkenDocsMove[]
}
