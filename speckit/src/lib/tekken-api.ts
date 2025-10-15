import { supabase } from './supabase'

// Tekken data sources (in order of preference)
const TEKKEN_DATA_SOURCES = [
  'https://api.tekken.com/v1', // Official API (if exists)
  'https://wavu.wiki/t/Tekken_8', // Community wiki
  'https://www.tekkenzaibatsu.com/wiki/Tekken_8', // Tekken Zaibatsu
  'https://dustloop.com/wiki/index.php?title=Tekken_8', // Dustloop
]

export interface TekkenMoveData {
  name: string
  notation: string
  damage: number
  startup: number
  active: number
  recovery: number
  onBlock: number
  onHit: number
  properties?: string[]
}

export interface TekkenCharacterData {
  name: string
  moves: TekkenMoveData[]
}

class TekkenAPI {
  private cache = new Map<string, TekkenCharacterData>()

  async fetchCharacterData(characterName: string): Promise<TekkenCharacterData | null> {
    // Check cache first
    if (this.cache.has(characterName)) {
      return this.cache.get(characterName)!
    }

    try {
      // Try official API first
      const officialData = await this.fetchFromOfficialAPI(characterName)
      if (officialData) {
        this.cache.set(characterName, officialData)
        return officialData
      }

      // Fallback to scraping reliable sources
      const scrapedData = await this.scrapeCharacterData(characterName)
      if (scrapedData) {
        this.cache.set(characterName, scrapedData)
        await this.saveToDatabase(characterName, scrapedData)
        return scrapedData
      }

      return null
    } catch (error) {
      console.error(`Failed to fetch data for ${characterName}:`, error)
      return null
    }
  }

  private async fetchFromOfficialAPI(characterName: string): Promise<TekkenCharacterData | null> {
    try {
      // This would be the official Tekken API endpoint if it existed
      const response = await fetch(`${TEKKEN_DATA_SOURCES[0]}/characters/${encodeURIComponent(characterName)}/moves`)

      if (!response.ok) return null

      const data = await response.json()

      return {
        name: characterName,
        moves: data.moves.map((move: any) => ({
          name: move.name,
          notation: move.notation,
          damage: move.damage,
          startup: move.startup,
          active: move.active,
          recovery: move.recovery,
          onBlock: move.onBlock,
          onHit: move.onHit,
          properties: move.properties || []
        }))
      }
    } catch {
      return null
    }
  }

  private async scrapeCharacterData(characterName: string): Promise<TekkenCharacterData | null> {
    // This would implement scraping logic from community sources
    // For now, return null - will be implemented based on the specific source chosen
    console.log(`Would scrape data for ${characterName} from community sources`)
    return null
  }

  private async saveToDatabase(characterName: string, data: TekkenCharacterData): Promise<void> {
    try {
      // Get or create character
      const { data: characterData, error: charError } = await supabase
        .from('characters')
        .select('id')
        .eq('name', characterName)
        .single()

      if (charError && charError.code !== 'PGRST116') {
        throw charError
      }

      let characterId = characterData?.id

      if (!characterId) {
        const { data: newChar, error: newCharError } = await supabase
          .from('characters')
          .insert({ name: characterName })
          .select('id')
          .single()

        if (newCharError) throw newCharError
        characterId = newChar.id
      }

      // Insert frame data
      const frameDataToInsert = data.moves.map(move => ({
        character_id: characterId,
        move_name: move.name,
        notation: move.notation,
        damage: move.damage,
        startup_frames: move.startup,
        active_frames: move.active,
        recovery_frames: move.recovery,
        on_block: move.onBlock,
        on_hit: move.onHit
      }))

      const { error: frameError } = await supabase
        .from('frame_data')
        .upsert(frameDataToInsert, {
          onConflict: 'character_id,move_name',
          ignoreDuplicates: false
        })

      if (frameError) throw frameError

    } catch (error) {
      console.error('Failed to save Tekken data to database:', error)
      throw error
    }
  }

  async getCharacterMoves(characterName: string): Promise<TekkenMoveData[]> {
    // Try database first
    const { data: dbMoves, error } = await supabase
      .from('frame_data')
      .select('*')
      .eq('character_id', (
        await supabase
          .from('characters')
          .select('id')
          .eq('name', characterName)
          .single()
      ).data?.id)

    if (!error && dbMoves && dbMoves.length > 0) {
      return dbMoves.map(move => ({
        name: move.move_name,
        notation: move.notation,
        damage: move.damage,
        startup: move.startup_frames,
        active: move.active_frames,
        recovery: move.recovery_frames,
        onBlock: move.on_block,
        onHit: move.on_hit
      }))
    }

    // Fallback to API
    const apiData = await this.fetchCharacterData(characterName)
    return apiData?.moves || []
  }

  async searchMoves(characterName: string, query: string): Promise<TekkenMoveData[]> {
    const allMoves = await this.getCharacterMoves(characterName)
    const lowerQuery = query.toLowerCase()

    return allMoves.filter(move =>
      move.name.toLowerCase().includes(lowerQuery) ||
      move.notation.toLowerCase().includes(lowerQuery)
    )
  }

  async getPunishers(characterName: string, startupFrames: number): Promise<TekkenMoveData[]> {
    const moves = await this.getCharacterMoves(characterName)

    return moves.filter(move =>
      move.startup <= startupFrames &&
      move.onBlock >= 0 // Safe or plus on block
    ).sort((a, b) => a.startup - b.startup)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const tekkenAPI = new TekkenAPI()