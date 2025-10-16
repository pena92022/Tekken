import { TekkenDocsFrameDataResponse } from '@/types/tekkendocs'

class TekkenDocsClient {
  private baseUrl = process.env.NEXT_PUBLIC_TEKKENDOCS_API_URL || 'https://tekkendocs.com'
  private cache = new Map<string, { data: TekkenDocsFrameDataResponse; timestamp: number }>()
  private cacheTTL = 24 * 60 * 60 * 1000 // 24 hours

  async fetchCharacterFrameData(characterId: string): Promise<TekkenDocsFrameDataResponse> {
    const cacheKey = `framedata:t8:${characterId}`
    
    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`[TekkenDocs] Cache hit for ${characterId}`)
      return cached.data
    }

    // Fetch from API
    console.log(`[TekkenDocs] Fetching data for ${characterId}`)
    const url = `${this.baseUrl}/api/t8/${characterId}/framedata`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: TekkenDocsFrameDataResponse = await response.json()
      
      // Validate response
      if (!data.framesNormal || !Array.isArray(data.framesNormal)) {
        throw new Error('Invalid response structure')
      }
      
      // Cache result
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      console.log(`[TekkenDocs] Cached ${data.framesNormal.length} moves for ${characterId}`)
      
      return data
    } catch (error) {
      console.error(`[TekkenDocs] Error fetching ${characterId}:`, error)
      throw new Error(`Failed to fetch frame data for ${characterId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async fetchMultipleCharacters(characterIds: string[]): Promise<TekkenDocsFrameDataResponse[]> {
    return Promise.all(characterIds.map(id => this.fetchCharacterFrameData(id)))
  }

  clearCache(characterId?: string) {
    if (characterId) {
      this.cache.delete(`framedata:t8:${characterId}`)
      console.log(`[TekkenDocs] Cleared cache for ${characterId}`)
    } else {
      this.cache.clear()
      console.log(`[TekkenDocs] Cleared all cache`)
    }
  }
}

export const tekkenDocsClient = new TekkenDocsClient()
