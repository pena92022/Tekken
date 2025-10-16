import { tekkenDocsClient } from './tekkendocs-client'
import { TekkenDocsMove, MatchupContext } from '@/types/tekkendocs'
import sampleFrameData from '@/data/sample-frame-data.json'

export async function buildMatchupContext(
  playerCharacter: string,
  opponentCharacter: string
): Promise<MatchupContext> {
  // Convert display names to character IDs (lowercase, hyphenated)
  const playerCharId = toCharacterId(playerCharacter)
  const opponentCharId = toCharacterId(opponentCharacter)

  // Try to fetch from local sample data first (reliable)
  let playerData: any = null
  let opponentData: any = null

  if (sampleFrameData[playerCharId as keyof typeof sampleFrameData]) {
    playerData = {
      characterName: playerCharId,
      editUrl: 'https://tekkendocs.com',
      game: 'T8' as const,
      framesNormal: sampleFrameData[playerCharId as keyof typeof sampleFrameData],
      stances: []
    }
    console.log(`[MatchupContext] Using local data for ${playerCharId}: ${sampleFrameData[playerCharId as keyof typeof sampleFrameData].length} moves`)
  }

  if (sampleFrameData[opponentCharId as keyof typeof sampleFrameData]) {
    opponentData = {
      characterName: opponentCharId,
      editUrl: 'https://tekkendocs.com',
      game: 'T8' as const,
      framesNormal: sampleFrameData[opponentCharId as keyof typeof sampleFrameData],
      stances: []
    }
    console.log(`[MatchupContext] Using local data for ${opponentCharId}: ${sampleFrameData[opponentCharId as keyof typeof sampleFrameData].length} moves`)
  }

  // If no local data, try external API as fallback
  if (!playerData || !opponentData) {
    console.log('[MatchupContext] Local data not found, trying external API...')
    try {
      const [fetchedPlayerData, fetchedOpponentData] = await Promise.all([
        playerData ? Promise.resolve(playerData) : tekkenDocsClient.fetchCharacterFrameData(playerCharId),
        opponentData ? Promise.resolve(opponentData) : tekkenDocsClient.fetchCharacterFrameData(opponentCharId)
      ])
      playerData = fetchedPlayerData
      opponentData = fetchedOpponentData
      console.log('[MatchupContext] Successfully fetched external frame data')
    } catch (error) {
      console.error('[MatchupContext] Failed to fetch external frame data:', error)
      // Create minimal fallback data
      const fallbackData = {
        characterName: playerCharId,
        editUrl: 'https://tekkendocs.com',
        game: 'T8' as const,
        framesNormal: [] as TekkenDocsMove[],
        stances: []
      }
      playerData = playerData || fallbackData
      opponentData = opponentData || fallbackData
    }
  }

  // Identify key moves (launchers, good pokes, etc.)
  const playerKeyMoves = playerData.framesNormal.length > 0
    ? identifyKeyMoves(playerData.framesNormal)
    : [] // Fallback to empty array if no data

  // Identify punishable moves (unsafe on block)
  const opponentPunishableMoves = opponentData.framesNormal.length > 0
    ? identifyPunishableMoves(opponentData.framesNormal)
    : [] // Fallback to empty array if no data

  return {
    playerCharacter,
    opponentCharacter,
    playerMoves: playerData.framesNormal,
    opponentMoves: opponentData.framesNormal,
    playerKeyMoves,
    opponentPunishableMoves
  }
}

function toCharacterId(displayName: string): string {
  // Special cases for character ID mapping
  const specialCases: Record<string, string> = {
    'Devil Jin': 'devil-jin',
    'Sergei Dragunov': 'dragunov',
    'Jun Kazama': 'jun',
    'Jin Kazama': 'jin',
    'Steve Fox': 'steve',
    'Ling Xiaoyu': 'xiaoyu',
    'Marshall Law': 'law',
    'Nina Williams': 'nina',
    'Anna Williams': 'anna',
    'Armor King': 'armor-king',
    'Azucena Milagros Ortiz Castillo': 'azucena',
    'Lee Chaolan': 'lee',
    'Clive Rosfield': 'clive',
    'Eddy Gordo': 'eddy',
    'Heihachi Mishima': 'heihachi',
    'Lidia Sobieska': 'lidia',
  }

  if (specialCases[displayName]) {
    return specialCases[displayName]
  }

  // Default: lowercase and hyphenate
  return displayName
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function identifyKeyMoves(moves: TekkenDocsMove[]): TekkenDocsMove[] {
  const keyMoves = moves.filter(move => {
    // Launchers (hit/CH launch)
    if (move.hit.toLowerCase().includes('launch') || move.counterHit.toLowerCase().includes('launch')) {
      return true
    }
    
    // Fast pokes (startup <= 12 frames)
    const startup = parseInt(move.startup)
    if (!isNaN(startup) && startup <= 12) {
      return true
    }
    
    // Plus frame moves (advantage on block)
    const block = parseInt(move.block.replace(/[+]/g, ''))
    if (!isNaN(block) && block > 0) {
      return true
    }
    
    // Special properties (Homing, Heat Engager, Power Crush)
    const specialProperties = ['homing', 'heat', 'power crush', 'tornado', 'balcony']
    if (specialProperties.some(prop => move.notes.toLowerCase().includes(prop))) {
      return true
    }
    
    return false
  })

  // Sort by importance: launchers first, then plus frames, then fast pokes
  keyMoves.sort((a, b) => {
    const aLauncher = a.hit.toLowerCase().includes('launch') || a.counterHit.toLowerCase().includes('launch')
    const bLauncher = b.hit.toLowerCase().includes('launch') || b.counterHit.toLowerCase().includes('launch')
    
    if (aLauncher && !bLauncher) return -1
    if (!aLauncher && bLauncher) return 1
    
    const aBlock = parseInt(a.block.replace(/[+]/g, ''))
    const bBlock = parseInt(b.block.replace(/[+]/g, ''))
    
    if (!isNaN(aBlock) && !isNaN(bBlock)) {
      return bBlock - aBlock // Higher plus frames first
    }
    
    return 0
  })

  return keyMoves.slice(0, 20) // Limit to top 20 moves
}

function identifyPunishableMoves(moves: TekkenDocsMove[]): TekkenDocsMove[] {
  const punishable = moves.filter(move => {
    const block = parseInt(move.block.replace(/[+]/g, ''))
    // Moves that are -10 or worse on block
    return !isNaN(block) && block <= -10
  })

  // Sort by how unsafe they are (most unsafe first)
  punishable.sort((a, b) => {
    const aBlock = parseInt(a.block.replace(/[+]/g, ''))
    const bBlock = parseInt(b.block.replace(/[+]/g, ''))
    return aBlock - bBlock
  })

  return punishable.slice(0, 15) // Top 15 most punishable
}

export function parseFrameData(value: string): number | string {
  // Try to parse as number
  const num = parseInt(value.replace(/[+]/g, ''))
  if (!isNaN(num)) return num
  
  // Return special value as-is (e.g., "Launch", "KND", etc.)
  return value
}

export function isSafe(blockFrame: string): boolean {
  const num = parseFrameData(blockFrame)
  return typeof num === 'number' && num >= -9
}
