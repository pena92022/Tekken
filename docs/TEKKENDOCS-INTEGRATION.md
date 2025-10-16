# TekkenDocs API Integration Guide

## Overview

This document outlines how to integrate with the [tekkendocs.com](https://tekkendocs.com) API to fetch accurate frame data and metadata for Tekken 8 characters.

**Source**: [pbruvoll/tekkendocs](https://github.com/pbruvoll/tekkendocs) - Remix app with Google Sheets backend

---

## API Endpoints

### 1. Frame Data Endpoint

**URL**: `https://tekkendocs.com/api/t8/{characterId}/framedata`

**Example**: `https://tekkendocs.com/api/t8/devil-jin/framedata`

**Response Structure**:

```typescript
{
  "characterName": "devil-jin",
  "editUrl": "https://docs.google.com/spreadsheets/...",
  "game": "T8",
  "framesNormal": [
    {
      "moveNumber": 1,
      "command": "1",
      "hitLevel": "h",
      "damage": "9",
      "startup": "10",
      "block": "+1",
      "hit": "+8",
      "counterHit": "+8",
      "notes": ""
    },
    {
      "moveNumber": 2,
      "command": "d/f+2",
      "hitLevel": "m",
      "damage": "13",
      "startup": "15",
      "block": "-12",
      "hit": "Launch",
      "counterHit": "Launch",
      "notes": "Homing"
    }
    // ... more moves
  ],
  "stances": ["MCR", "FLY", "MNT"] // Available stances for this character
}
```

**Move Properties**:
- `command`: String - Input notation (e.g., "1", "d/f+2", "f,f+3")
- `hitLevel`: String - Hit level (h=high, m=mid, l=low, sm=special mid, etc.)
- `damage`: String - Damage value
- `startup`: String - Startup frames
- `block`: String - Frame advantage on block (+/- number or special values)
- `hit`: String - Frame advantage on hit (or "Launch", "KND", etc.)
- `counterHit`: String - Frame advantage on counter hit
- `notes`: String - Special properties (Homing, Heat Engager, Power Crush, etc.)

### 2. Character Metadata Endpoint

**URL**: `https://tekkendocs.com/api/t8/{characterId}/meta` (if exists)

**Note**: This endpoint may not be documented, but the website shows cheat sheets at:
- `https://tekkendocs.com/t8/{characterId}/meta`

The data is stored in Google Sheets and includes:
- Key moves
- Punishers (standing, crouching, whiff)
- Combos (beginner, advanced, wall)
- Frame traps
- Panic moves
- Character strengths/weaknesses

---

## Character ID Format

Characters use lowercase, hyphenated IDs:

| Display Name | API ID |
|--------------|--------|
| Devil Jin | `devil-jin` |
| Sergei Dragunov | `dragunov` |
| Jun Kazama | `jun` |
| Jin Kazama | `jin` |
| Steve Fox | `steve` |
| Azucena Milagros Ortiz Castillo | `azucena` |
| Ling Xiaoyu | `xiaoyu` |

**Conversion Logic**:
```typescript
function toCharacterId(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
```

---

## Implementation Plan

### Step 1: Create Type Definitions

```typescript
// src/types/tekkendocs.ts

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

export interface TekkenDocsMetadata {
  characterName: string
  keyMoves?: string[]
  standingPunishers?: { [key: string]: string }
  crouchingPunishers?: { [key: string]: string }
  whiffPunishers?: string[]
  combos?: string[]
  // ... more fields as discovered
}
```

### Step 2: Create TekkenDocs Client

```typescript
// src/lib/tekkendocs-client.ts

import { TekkenDocsFrameDataResponse, TekkenDocsMove } from '@/types/tekkendocs'

class TekkenDocsClient {
  private baseUrl = 'https://tekkendocs.com'
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTTL = 24 * 60 * 60 * 1000 // 24 hours

  async fetchCharacterFrameData(characterId: string): Promise<TekkenDocsFrameDataResponse> {
    const cacheKey = `framedata:t8:${characterId}`
    
    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    // Fetch from API
    const url = `${this.baseUrl}/api/t8/${characterId}/framedata`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch frame data for ${characterId}: ${response.statusText}`)
    }

    const data: TekkenDocsFrameDataResponse = await response.json()
    
    // Cache result
    this.cache.set(cacheKey, { data, timestamp: Date.now() })
    
    return data
  }

  async fetchMultipleCharacters(characterIds: string[]): Promise<TekkenDocsFrameDataResponse[]> {
    return Promise.all(characterIds.map(id => this.fetchCharacterFrameData(id)))
  }

  clearCache(characterId?: string) {
    if (characterId) {
      this.cache.delete(`framedata:t8:${characterId}`)
    } else {
      this.cache.clear()
    }
  }
}

export const tekkenDocsClient = new TekkenDocsClient()
```

### Step 3: Database Caching Layer

```sql
-- supabase/migrations/002_frame_data_cache.sql

CREATE TABLE frame_data_cache (
  id BIGSERIAL PRIMARY KEY,
  character_id TEXT NOT NULL,
  game TEXT NOT NULL DEFAULT 'T8',
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_frame_data_character_game ON frame_data_cache(character_id, game);
CREATE INDEX idx_frame_data_updated ON frame_data_cache(updated_at);

-- RLS Policies (read-only for authenticated users)
ALTER TABLE frame_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read frame data"
  ON frame_data_cache FOR SELECT
  TO authenticated, anon
  USING (true);
```

### Step 4: Enhanced Client with Database

```typescript
// src/lib/tekkendocs-client.ts (enhanced)

import { supabase } from './supabase'

class TekkenDocsClient {
  // ... previous code ...

  async fetchCharacterFrameDataWithCache(
    characterId: string
  ): Promise<TekkenDocsFrameDataResponse> {
    // 1. Check memory cache
    const memoryCached = this.getFromMemoryCache(characterId)
    if (memoryCached) return memoryCached

    // 2. Check database cache (7 days max age)
    const dbCached = await this.getFromDatabase(characterId)
    if (dbCached) {
      this.cache.set(`framedata:t8:${characterId}`, {
        data: dbCached,
        timestamp: Date.now()
      })
      return dbCached
    }

    // 3. Fetch from API
    const data = await this.fetchCharacterFrameData(characterId)

    // 4. Save to database
    await this.saveToDatabase(characterId, data)

    return data
  }

  private async getFromDatabase(
    characterId: string
  ): Promise<TekkenDocsFrameDataResponse | null> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('frame_data_cache')
      .select('data')
      .eq('character_id', characterId)
      .eq('game', 'T8')
      .gt('updated_at', sevenDaysAgo.toISOString())
      .single()

    if (error || !data) return null

    return data.data as TekkenDocsFrameDataResponse
  }

  private async saveToDatabase(
    characterId: string,
    data: TekkenDocsFrameDataResponse
  ): Promise<void> {
    await supabase.from('frame_data_cache').upsert({
      character_id: characterId,
      game: 'T8',
      data: data,
      updated_at: new Date().toISOString()
    })
  }
}
```

### Step 5: Integration with AI Service

```typescript
// src/lib/matchup-context.ts

import { tekkenDocsClient } from './tekkendocs-client'
import { TekkenDocsMove } from '@/types/tekkendocs'

export interface MatchupContext {
  playerCharacter: string
  opponentCharacter: string
  playerMoves: TekkenDocsMove[]
  opponentMoves: TekkenDocsMove[]
  playerKeyMoves: TekkenDocsMove[]
  opponentPunishableMoves: TekkenDocsMove[]
}

export async function buildMatchupContext(
  playerCharacter: string,
  opponentCharacter: string
): Promise<MatchupContext> {
  // Fetch both characters' frame data
  const [playerData, opponentData] = await Promise.all([
    tekkenDocsClient.fetchCharacterFrameDataWithCache(playerCharacter),
    tekkenDocsClient.fetchCharacterFrameDataWithCache(opponentCharacter)
  ])

  // Identify key moves (launchers, good pokes, etc.)
  const playerKeyMoves = identifyKeyMoves(playerData.framesNormal)
  
  // Identify punishable moves (unsafe on block)
  const opponentPunishableMoves = identifyPunishableMoves(opponentData.framesNormal)

  return {
    playerCharacter,
    opponentCharacter,
    playerMoves: playerData.framesNormal,
    opponentMoves: opponentData.framesNormal,
    playerKeyMoves,
    opponentPunishableMoves
  }
}

function identifyKeyMoves(moves: TekkenDocsMove[]): TekkenDocsMove[] {
  return moves.filter(move => {
    // Launchers (hit/CH launch)
    if (move.hit.includes('Launch') || move.counterHit.includes('Launch')) {
      return true
    }
    
    // Fast pokes (startup <= 12 frames)
    const startup = parseInt(move.startup)
    if (!isNaN(startup) && startup <= 12) {
      return true
    }
    
    // Plus frame moves (advantage on block)
    const block = parseInt(move.block)
    if (!isNaN(block) && block > 0) {
      return true
    }
    
    // Special properties (Homing, Heat Engager, Power Crush)
    const specialProperties = ['homing', 'heat', 'power crush']
    if (specialProperties.some(prop => move.notes.toLowerCase().includes(prop))) {
      return true
    }
    
    return false
  }).slice(0, 20) // Limit to top 20 moves
}

function identifyPunishableMoves(moves: TekkenDocsMove[]): TekkenDocsMove[] {
  return moves.filter(move => {
    const block = parseInt(move.block)
    // Moves that are -10 or worse on block
    return !isNaN(block) && block <= -10
  }).sort((a, b) => {
    // Sort by how unsafe they are
    return parseInt(a.block) - parseInt(b.block)
  }).slice(0, 15) // Top 15 most punishable
}
```

### Step 6: Update AI Service

```typescript
// src/lib/ai.ts (updated)

import { buildMatchupContext } from './matchup-context'

class AIProvider {
  // ... existing code ...

  private async buildTekkenPrompt(request: MatchAnalysisRequest): Promise<string> {
    // Fetch matchup context with real frame data
    const context = await buildMatchupContext(
      request.playerCharacter,
      request.opponentCharacter
    )

    return `
You are an expert Tekken 8 competitive analyst with access to accurate frame data.

## Matchup
- Player Character: ${context.playerCharacter}
- Opponent Character: ${context.opponentCharacter}

## Player's Key Moves (Your Arsenal)
${context.playerKeyMoves.map(m => 
  `- ${m.command}: ${m.hitLevel}, ${m.damage} damage, ${m.startup}f startup, ${m.block} on block, ${m.notes}`
).join('\n')}

## Opponent's Punishable Moves (Exploit These)
${context.opponentPunishableMoves.map(m =>
  `- ${m.command}: ${m.hitLevel}, ${m.damage} damage, ${m.block} on block (PUNISHABLE) - ${m.notes}`
).join('\n')}

## Task
Provide strategic matchup analysis in JSON format. Focus on:
1. Which of your key moves work best in this matchup
2. How to punish opponent's unsafe moves
3. Specific strategies tailored to this matchup

## JSON Schema
{
  "keyMoves": [
    {
      "name": "Move name from player's arsenal",
      "notation": "Exact command notation",
      "description": "Why this move is strong in this matchup (50-100 words)",
      "priority": "high" | "medium" | "low"
    }
  ],
  "counters": [
    {
      "move": "Opponent move command",
      "counter": "Your punish move command",
      "frameAdvantage": number (how minus opponent is on block)
    }
  ],
  "strategies": [
    {
      "name": "Strategy name",
      "description": "How to execute (100-150 words)",
      "conditions": ["When to use this strategy"]
    }
  ],
  "tips": [
    "Quick tactical tip 1",
    "Quick tactical tip 2"
  ]
}

Respond ONLY with valid JSON. No markdown, no explanation.
`
  }
}
```

---

## Data Quality Notes

### Special Values

Frame data uses special string values:

- **Block/Hit/CH frames**:
  - `"+5"`, `"-10"` = numeric advantage
  - `"Launch"` = launches opponent
  - `"KND"` = knocks down
  - `"CS"` = crumple stun
  - `"JG"` = juggle
  - `"+??"` = unknown advantage

- **Hit Levels**:
  - `"h"` = high
  - `"m"` = mid
  - `"l"` = low
  - `"sm"` = special mid
  - `"th"` = throw
  - Combinations like `"h, h, m"` for strings

- **Notes**:
  - `"Homing"` = tracks sidewalk
  - `"Heat Engager"` = activates heat
  - `"Heat Smash"` = heat-only move
  - `"Power Crush"` = armor move
  - `"Tornado"` = wall bounce
  - `"Balcony Break"` = breaks balcony

### Data Parsing

When parsing frame data, handle:

1. **Non-numeric values**: Check for special strings before `parseInt()`
2. **Empty fields**: Some moves have missing data (e.g., `""`)
3. **Ranges**: Some values like `"17-18"` indicate startup variance

```typescript
function parseFrameData(value: string): number | string {
  // Try to parse as number
  const num = parseInt(value.replace(/[+]/g, ''))
  if (!isNaN(num)) return num
  
  // Return special value as-is
  return value
}

function isSafe(blockFrame: string): boolean {
  const num = parseFrameData(blockFrame)
  return typeof num === 'number' && num >= -9
}
```

---

## Error Handling

### Common Errors

1. **Character Not Found (404)**
   - Invalid character ID
   - Character not in database yet
   - Solution: Validate character ID against known roster

2. **Rate Limiting (429)**
   - Too many requests
   - Solution: Implement request queuing and exponential backoff

3. **Server Error (500)**
   - Google Sheets API issue
   - Solution: Use cached data, retry after delay

### Retry Strategy

```typescript
async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetcher()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  throw new Error('Max retries exceeded')
}
```

---

## Testing

### Test with Known Characters

```bash
# Devil Jin (known to work)
curl https://tekkendocs.com/api/t8/devil-jin/framedata | jq

# Dragunov
curl https://tekkendocs.com/api/t8/dragunov/framedata | jq

# Jin
curl https://tekkendocs.com/api/t8/jin/framedata | jq
```

### Validation

```typescript
import { z } from 'zod'

const TekkenDocsMoveSchema = z.object({
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

const TekkenDocsResponseSchema = z.object({
  characterName: z.string(),
  editUrl: z.string(),
  game: z.enum(['T7', 'T8']),
  framesNormal: z.array(TekkenDocsMoveSchema),
  stances: z.array(z.string())
})

export function validateTekkenDocsResponse(data: unknown) {
  return TekkenDocsResponseSchema.parse(data)
}
```

---

## Credits

- **Data Source**: [tekkendocs.com](https://tekkendocs.com) by pbruvoll
- **GitHub**: [pbruvoll/tekkendocs](https://github.com/pbruvoll/tekkendocs)
- **Community Contributors**: Data maintained by Tekken community members

---

## Next Steps

1. ✅ Review this integration guide
2. ⬜ Implement `TekkenDocsClient` class
3. ⬜ Set up database caching
4. ⬜ Create `buildMatchupContext` function
5. ⬜ Update AI service to use real data
6. ⬜ Test with 10+ character matchups
7. ⬜ Validate accuracy against tekkendocs.com website

