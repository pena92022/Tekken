# Quick Start: Next Tasks

## Immediate Priority (Start Here)

Based on the codebase analysis and MVP tasks, here are your immediate next steps:

---

## 1. UI Simplification (1-2 hours)

### Task T006-T008: Remove Stage & Game Mode

**File**: `src/components/MatchAnalysis.tsx`

**Changes**:
1. Remove lines ~137-156 (Stage select dropdown)
2. Remove lines ~158-176 (Game Mode select dropdown)
3. Update state initialization (line 47):
   ```typescript
   const [request, setRequest] = useState<MatchAnalysisRequest>({
     playerCharacter: '',
     opponentCharacter: '',
     // Remove: stage: '',
     // Remove: gameMode: 'Ranked Match'
   })
   ```

4. Remove Match Analysis Summary card (lines ~212-220):
   ```typescript
   // DELETE THIS:
   <Card>
     <CardHeader>
       <CardTitle>Match Analysis Summary</CardTitle>
     </CardHeader>
     <CardContent>
       <p className="text-slate-300">{analysis.summary}</p>
     </CardContent>
   </Card>
   ```

**File**: `src/types/index.ts`

Update the interface:
```typescript
export interface MatchAnalysisRequest {
  playerCharacter: string
  opponentCharacter: string
  // stage and gameMode are fully removed
}

export interface MatchAnalysis {
  // Remove summary field
  keyMoves: {
    name: string
    notation: string
    description: string
    priority: 'high' | 'medium' | 'low'
  }[]
  strategies: {
    name: string
    description: string
    conditions: string[]
  }[]
  counters: {
    move: string
    counter: string
    frameAdvantage: number
  }[]
  tips: string[]
}
```

**File**: `src/lib/ai.ts`

Update the prompt builder (line 54):
```typescript
private buildTekkenPrompt(request: MatchAnalysisRequest): string {
  return `
You are an expert Tekken 8 competitive analyst. Analyze this matchup and provide strategic insights.

Matchup: ${request.playerCharacter} vs ${request.opponentCharacter}

Provide analysis in JSON format with the following structure:
{
  "keyMoves": [...],
  "strategies": [...],
  "counters": [...],
  "tips": [...]
}

Focus on frame data, punishes, wall game, and matchup-specific strategies. Be concise but thorough.
`
}
```

**Test**: 
- Run `npm run dev`
- Verify UI only shows character selection
- Verify analysis still works without errors

---

## 2. Set Up Environment (15 minutes)

### Add Required Environment Variables

Create/update `.env.local`:

```bash
# Supabase (already exists)
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here

# AI Provider (ADD THIS)
OPENAI_API_KEY=sk-proj-...

# Optional: Keep Ollama for dev
OLLAMA_MODEL=gemma3:1b
OLLAMA_ENDPOINT=http://localhost:11434

# TekkenDocs API (optional override)
NEXT_PUBLIC_TEKKENDOCS_API_URL=https://tekkendocs.com
```

**Get OpenAI API Key**:
1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Copy to `.env.local`

---

## 3. Create TekkenDocs Types (15 minutes)

### Task T011: Define Types

**Create**: `src/types/tekkendocs.ts`

```typescript
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
```

---

## 4. Create TekkenDocs Client (30 minutes)

### Task T013: Basic Client

**Create**: `src/lib/tekkendocs-client.ts`

```typescript
import { TekkenDocsFrameDataResponse } from '@/types/tekkendocs'

class TekkenDocsClient {
  private baseUrl = process.env.NEXT_PUBLIC_TEKKENDOCS_API_URL || 'https://tekkendocs.com'
  private cache = new Map<string, { data: any; timestamp: number }>()
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
```

**Test**:
```typescript
// In console or test file
import { tekkenDocsClient } from './tekkendocs-client'

const data = await tekkenDocsClient.fetchCharacterFrameData('devil-jin')
console.log(`Fetched ${data.framesNormal.length} moves for ${data.characterName}`)
```

---

## 5. Test the Integration (15 minutes)

### Quick Test Script

**Create**: `scripts/test-tekkendocs.ts`

```typescript
import { tekkenDocsClient } from '../src/lib/tekkendocs-client'

async function test() {
  console.log('Testing TekkenDocs API Integration...\n')

  const testCharacters = ['devil-jin', 'dragunov', 'jin']

  for (const char of testCharacters) {
    try {
      console.log(`Fetching ${char}...`)
      const data = await tekkenDocsClient.fetchCharacterFrameData(char)
      console.log(`✅ Success: ${data.framesNormal.length} moves`)
      console.log(`   Sample move: ${data.framesNormal[0].command} - ${data.framesNormal[0].hitLevel}`)
      console.log()
    } catch (error) {
      console.error(`❌ Failed: ${error}`)
      console.log()
    }
  }
}

test()
```

**Run**:
```bash
npx tsx scripts/test-tekkendocs.ts
```

---

## 6. Quick Win: Update One Component (30 minutes)

### Show Real Frame Data in UI

Update `MatchAnalysis.tsx` to display actual frame data:

```typescript
import { tekkenDocsClient } from '@/lib/tekkendocs-client'
import { TekkenDocsMove } from '@/types/tekkendocs'

// Add to component state
const [playerMoves, setPlayerMoves] = useState<TekkenDocsMove[]>([])
const [opponentMoves, setOpponentMoves] = useState<TekkenDocsMove[]>([])

// When user selects character, fetch data
useEffect(() => {
  if (request.playerCharacter) {
    tekkenDocsClient.fetchCharacterFrameData(request.playerCharacter)
      .then(data => setPlayerMoves(data.framesNormal))
      .catch(err => console.error('Failed to load player moves:', err))
  }
}, [request.playerCharacter])

useEffect(() => {
  if (request.opponentCharacter) {
    tekkenDocsClient.fetchCharacterFrameData(request.opponentCharacter)
      .then(data => setOpponentMoves(data.framesNormal))
      .catch(err => console.error('Failed to load opponent moves:', err))
  }
}, [request.opponentCharacter])

// Display move count in UI
{request.playerCharacter && playerMoves.length > 0 && (
  <div className="text-sm text-slate-400">
    Loaded {playerMoves.length} moves
  </div>
)}
```

---

## Progress Checklist

### Phase 1: Foundation (Do First)
- [ ] Remove Stage input from UI
- [ ] Remove Game Mode input from UI  
- [ ] Remove Match Analysis Summary from results
- [ ] Update types to remove optional fields
- [ ] Test that UI still works

### Phase 2: Data Integration (Do Next)
- [ ] Add OpenAI API key to `.env.local`
- [ ] Create `tekkendocs.ts` types file
- [ ] Create `tekkendocs-client.ts` service
- [ ] Test fetching Devil Jin frame data
- [ ] Test fetching Dragunov frame data

### Phase 3: Quick Win (Show Progress)
- [ ] Display move count when character selected
- [ ] Show loading state while fetching
- [ ] Show error if fetch fails

---

## Expected Timeline

- **Day 1 (2-3 hours)**: UI Simplification + Environment Setup + Types
- **Day 2 (2-3 hours)**: TekkenDocs Client + Testing + Quick Win
- **Day 3 (3-4 hours)**: Integrate with AI Service (Task T023-T024)
- **Day 4 (2-3 hours)**: Polish + Error Handling
- **Day 5**: Testing + Documentation

---

## Questions to Consider

1. **Character ID Mapping**: Do we need to handle display names → API IDs?
   - "Devil Jin" → "devil-jin"
   - Current character list uses display names, need conversion

2. **Caching Strategy**: Start with memory cache, add database later?
   - ✅ Memory cache: Simple, good for MVP
   - 🔄 Database cache: Better for production (Phase 6)

3. **AI Provider**: Switch from Ollama to OpenAI immediately?
   - ✅ Yes - Ollama/gemma3:1b is producing inaccurate data
   - Use OpenAI GPT-4o-mini for cost-effective structured output

4. **Error Handling**: What if tekkendocs API is down?
   - Show cached data if available
   - Show user-friendly error message
   - Implement in Phase 5

---

## Need Help?

1. **UI Changes**: See `MatchAnalysis.tsx` lines 47, 137-176, 212-220
2. **Type Definitions**: See `src/types/index.ts` and create `src/types/tekkendocs.ts`
3. **API Testing**: Use the test script or curl: `curl https://tekkendocs.com/api/t8/devil-jin/framedata`
4. **Documentation**: See `docs/TEKKENDOCS-INTEGRATION.md` for detailed guide

---

## Success Criteria for Today

✅ UI shows only character selection (no stage/gamemode)  
✅ Can fetch frame data from tekkendocs.com  
✅ Character selection shows move count  
✅ No errors in console  
✅ Ready to integrate with AI service tomorrow

**Let's build! 🚀**
