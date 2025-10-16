import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIModelConfig, MatchAnalysisRequest, MatchAnalysis } from '@/types'
import { buildMatchupContext } from './matchup-context'
import { validateMatchAnalysis } from './schemas'
import sampleFrameData from '@/data/sample-frame-data.json'
import punishData from '@/data/tekken-punish-data.json'

class AIProvider {
  private openai?: OpenAI
  private claude?: Anthropic
  private gemini?: GoogleGenerativeAI

  constructor(private config: AIModelConfig) {
    this.initializeProvider()
  }

  private initializeProvider() {
    switch (this.config.provider) {
      case 'openai':
        this.openai = new OpenAI({
          apiKey: this.config.apiKey,
        })
        break
      case 'claude':
        this.claude = new Anthropic({
          apiKey: this.config.apiKey,
        })
        break
      case 'gemini':
        this.gemini = new GoogleGenerativeAI(this.config.apiKey!)
        break
      case 'ollama':
        // Will handle Ollama through HTTP requests
        break
    }
  }

  async analyzeMatch(request: MatchAnalysisRequest): Promise<MatchAnalysis> {
    const prompt = await this.buildTekkenPrompt(request)

    switch (this.config.provider) {
      case 'openai':
        return this.analyzeWithOpenAI(prompt)
      case 'claude':
        return this.analyzeWithClaude(prompt)
      case 'gemini':
        return this.analyzeWithGemini(prompt)
      case 'ollama':
        return this.analyzeWithOllama(prompt, request)
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`)
    }
  }

  private async buildTekkenPrompt(request: MatchAnalysisRequest): Promise<string> {
    // Fetch matchup context with real frame data
    let context
    try {
      context = await buildMatchupContext(
        request.playerCharacter,
        request.opponentCharacter
      )
      console.log('[AI] Successfully fetched context for', request.playerCharacter, 'vs', request.opponentCharacter)
    } catch (error) {
      console.error('[AI] Failed to fetch frame data from tekkendocs.com:', error)
      // Fallback to basic prompt without frame data
      return this.buildBasicPrompt(request)
    }

    return `
You are an expert Tekken 8 competitive analyst with access to accurate frame data.

## Matchup
- Player Character: ${context.playerCharacter}
- Opponent Character: ${context.opponentCharacter}

## Opponent's Punishable Moves (What You Can Punish)
${context.opponentPunishableMoves.slice(0, 20).map(m => {
  const blockFrame = parseInt(m.block.replace(/[+]/g, ''))
  const punishWindow = isNaN(blockFrame) ? 'UNKNOWN' : Math.abs(blockFrame)
  const punishType = isNaN(blockFrame) ? 'UNKNOWN' : (typeof punishWindow === 'number' && punishWindow >= 15) ? 'LAUNCH' : (typeof punishWindow === 'number' && punishWindow >= 10) ? 'FAST' : 'SLOW'
  return `- ${m.command}: ${m.hitLevel}, ${m.damage} damage, ${m.startup}f startup, ${m.block} on block, ${punishType} punish window${m.notes ? ` (${m.notes})` : ''}`
}).join('\n')}

## Your Punish Moves (Available Counters)
${context.playerKeyMoves.slice(0, 25).map(m => {
  const startup = parseInt(m.startup)
  const punishSpeed = isNaN(startup) ? 'UNKNOWN' : startup <= 12 ? 'VERY_FAST' : startup <= 15 ? 'FAST' : startup <= 18 ? 'MEDIUM' : 'SLOW'
  return `- ${m.command}: ${m.hitLevel}, ${m.damage} damage, ${m.startup}f startup, ${m.block} on block, ${punishSpeed}${m.notes ? ` (${m.notes})` : ''}`
}).join('\n')}

## Task
Provide strategic matchup analysis in JSON format. Focus on:
1. Best punish options for opponent's punishable moves (use actual move notations)
2. Frame-specific punish recommendations (10f, 12f, 15f+ launch punish)
3. Optimal counter strategies for this matchup

## JSON Schema (MUST follow exactly)
{
  "punishOptions": [
    {
      "opponentMove": "Opponent move command from punishable moves above",
      "punishMove": "Your punish move command from your moves above",
      "punishWindow": "10f|12f|15f+|UNKNOWN",
      "frameAdvantage": "How many frames you have (calculate: opponent block frames - your startup)",
      "description": "Why this punish works (30-60 words)"
    }
  ],
  "optimalPunishes": [
    {
      "window": "10f|12f|15f+",
      "recommendedMoves": ["Your move notations that work in this window"],
      "situations": ["When to use these punishes"]
    }
  ],
  "strategies": [
    {
      "name": "Punish Strategy Name",
      "description": "How to punish effectively (80-120 words)",
      "conditions": ["When opponent does punishable moves"],
      "moves": ["Specific moves to use"]
    }
  ],
  "tips": [
    "Punish tip 1 (be specific about frames and moves)",
    "Punish tip 2 (be specific about frames and moves)",
    "Punish tip 3 (be specific about frames and moves)"
  ]
}

IMPORTANT:
- Calculate frame advantage: opponent block frames (ignore + sign) + your startup frames
- Use ONLY moves from the lists above
- Focus on punish opportunities and frame-specific counters
- Respond with VALID JSON only, no markdown, no explanation
- Include at least 8 punish options, 3 optimal punishes, 3 strategies, and 3 tips
`
  }

  private buildBasicPrompt(request: MatchAnalysisRequest): string {
    return `
You are an expert Tekken 8 competitive analyst. Analyze this matchup and provide strategic insights.

Matchup: ${request.playerCharacter} vs ${request.opponentCharacter}

Provide analysis in JSON format with the following structure:
{
  "keyMoves": [
    {
      "name": "Move name",
      "notation": "Input notation",
      "description": "When and why to use this move",
      "priority": "high|medium|low"
    }
  ],
  "strategies": [
    {
      "name": "Strategy name",
      "description": "How to execute this strategy",
      "conditions": ["Required conditions for this strategy"]
    }
  ],
  "counters": [
    {
      "move": "Opponent move name",
      "counter": "Your counter move",
      "frameAdvantage": 5
    }
  ],
  "tips": ["Quick tactical tips"]
}

Focus on frame data, punishes, wall game, and matchup-specific strategies. Be concise but thorough.
`
  }

  private async analyzeWithOpenAI(prompt: string): Promise<MatchAnalysis> {
    const completion = await this.openai!.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      stream: false,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No response from OpenAI')

    const parsed = JSON.parse(content)
    
    // Validate with Zod
    try {
      return validateMatchAnalysis(parsed)
    } catch (error) {
      console.error('[AI] Validation failed:', error)
      console.error('[AI] Raw response:', parsed)
      // Return parsed data anyway but log the issue
      return parsed as MatchAnalysis
    }
  }

  private async analyzeWithClaude(prompt: string): Promise<MatchAnalysis> {
    const message = await this.claude!.messages.create({
      model: this.config.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]?.type === 'text' ? message.content[0].text : ''
    if (!content) throw new Error('No response from Claude')

    return JSON.parse(content)
  }

  private async analyzeWithGemini(prompt: string): Promise<MatchAnalysis> {
    const model = this.gemini!.getGenerativeModel({ model: this.config.model })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return JSON.parse(text)
  }

  private async analyzeWithOllama(prompt: string, request?: MatchAnalysisRequest): Promise<MatchAnalysis> {
    try {
      console.log('[Ollama] Sending request to:', `${this.config.endpoint}/api/generate`)
      console.log('[Ollama] Model:', this.config.model)
      console.log('[Ollama] Prompt length:', prompt.length)

      const response = await fetch(`${this.config.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          format: 'json',
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Ollama] HTTP Error:', response.status, response.statusText, errorText)
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}. Response: ${errorText}`)
      }

      const result = await response.json()
      console.log('[Ollama] Full API response:', result)

      if (!result.response) {
        throw new Error('No response field in Ollama API result')
      }

      // Clean the response - remove any markdown or extra text
      let cleanedResponse = result.response.trim()

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Remove any leading/trailing whitespace and newlines
      cleanedResponse = cleanedResponse.trim()

      console.log('[Ollama] Final cleaned response:', cleanedResponse)

      const parsed = JSON.parse(cleanedResponse)

      // Validate with Zod
      try {
        const validated = validateMatchAnalysis(parsed)
        console.log('[Ollama] Validation successful. Response contains:', {
          punishOptions: validated.punishOptions?.length || 0,
          optimalPunishes: validated.optimalPunishes?.length || 0,
          strategies: validated.strategies?.length || 0,
          tips: validated.tips?.length || 0
        })
        return validated
      } catch (error) {
        console.error('[Ollama] Validation failed:', error)
        console.error('[Ollama] Expected schema:', {
          punishOptions: 'array of punish options',
          optimalPunishes: 'array of optimal punish recommendations',
          strategies: 'array of strategies',
          tips: 'array of tips'
        })
        console.error('[Ollama] Raw response keys:', Object.keys(parsed))
        console.error('[Ollama] Raw response:', parsed)

        // Create character-specific fallback response
        const toCharacterId = (displayName: string): string => {
          // Handle special cases first
          const specialMappings: { [key: string]: string } = {
            'Devil Jin': 'devil-jin',
            'Kazuya Mishima': 'kazuya',
            'Marshall Law': 'marshall-law'
          }

          if (specialMappings[displayName]) {
            return specialMappings[displayName]
          }

          return displayName
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^a-z0-9-]/g, '')
        }

        const playerCharId = request ? toCharacterId(request.playerCharacter) : 'devil-jin'
        const opponentCharId = request ? toCharacterId(request.opponentCharacter) : 'kazuya'

        // Use the comprehensive punish data
        console.log('Available character IDs in punish data:', Object.keys(punishData))
        console.log('Looking for player:', playerCharId, 'opponent:', opponentCharId)
        console.log('Player display name:', request?.playerCharacter)
        console.log('Opponent display name:', request?.opponentCharacter)

        const playerPunishData = punishData[playerCharId as keyof typeof punishData]
        const opponentPunishData = punishData[opponentCharId as keyof typeof punishData]

        const punishableMoves = opponentPunishData?.punishableMoves || []
        const punishMoves = playerPunishData?.punishMoves || []

        console.log('Punishable moves found:', punishableMoves.length, punishableMoves.map(m => m.Command))
        console.log('Punish moves found:', punishMoves.length, punishMoves.map(m => ({command: m.Command, startup: m['Start up frame']})))

        // Create comprehensive punish windows: 10f, 12f, 13f, 14f, 15f+
        const punishWindows = [
          { window: "10f", maxFrame: 10, minFrame: 9 },
          { window: "12f", maxFrame: 12, minFrame: 11 },
          { window: "13f", maxFrame: 13, minFrame: 13 },
          { window: "14f", maxFrame: 14, minFrame: 14 },
          { window: "15f+", maxFrame: 99, minFrame: 15 }
        ]

        const optimalPunishes = punishWindows.map(windowConfig => {
          // Find punish moves that work in this window
          const applicablePunishMoves = punishMoves.filter((move: any) => {
            const startupStr = move['Start up frame']?.split(' ')[0] || '99'
            // Handle ranges like "i13~14" by taking the first number
            const startup = parseInt(startupStr.replace('i', '').split('~')[0] || '99')
            console.log(`Checking move ${move.Command}: startup='${move['Start up frame']}' parsed=${startup} (range: ${windowConfig.minFrame}-${windowConfig.maxFrame})`)
            return startup >= windowConfig.minFrame && startup <= windowConfig.maxFrame
          })

          console.log(`Window ${windowConfig.window}: Found ${applicablePunishMoves.length} moves with startup ${windowConfig.minFrame}-${windowConfig.maxFrame}`)

          return {
            window: windowConfig.window,
            recommendedMoves: applicablePunishMoves.slice(0, 3).map((m: any) => m.Command).filter(Boolean),
            situations: [
              `After opponent moves punishable in ${windowConfig.window}`,
              `When you have ${windowConfig.window} to punish`,
              windowConfig.window === "15f+" ? "Launch punishable moves" : `Fast punishes in ${windowConfig.window}`
            ]
          }
        }).filter(p => p.recommendedMoves.length > 0) // Only show windows with moves

        console.log('Final optimal punishes:', optimalPunishes.map(p => `${p.window}: ${p.recommendedMoves.join(', ')}`))

        const fallback: MatchAnalysis = {
          punishOptions: punishableMoves.map((oppMove: any, index: number) => {
            const punishMove = punishMoves[index % punishMoves.length] || { Command: "1,1,2" }
            const oppBlockFrame = Math.abs(parseInt(oppMove['Block frame']?.replace(/[+]/g, '') || '10'))
            const punishStartup = parseInt(punishMove['Start up frame']?.split(' ')[0] || '10')
            const frameAdvantage = oppBlockFrame - punishStartup

            return {
              opponentMove: oppMove.Command || "Unknown move",
              punishMove: punishMove.Command || "1,1,2",
              punishWindow: oppBlockFrame >= 15 ? "15f+" : oppBlockFrame >= 14 ? "14f" : oppBlockFrame >= 13 ? "13f" : oppBlockFrame >= 12 ? "12f" : "10f",
              frameAdvantage: `${frameAdvantage} frames`,
              description: `Punish ${oppMove.Command} (${oppMove['Block frame']} on block) with ${punishMove.Command} for ${frameAdvantage} frame advantage.`
            }
          }),
          optimalPunishes,
          strategies: [
            {
              name: "Frame-Specific Punishing",
              description: "Use the correct punish window based on opponent's move. Faster moves for smaller windows, launch punishers for -15 and worse.",
              conditions: punishableMoves.slice(0, 3).map((m: any) => `When opponent uses ${m.Command} (${m['Block frame']} on block)`),
              moves: punishMoves.slice(0, 5).map((m: any) => m.Command).filter(Boolean)
            }
          ],
          tips: [
            `Found ${punishableMoves.length} punishable moves in this matchup`,
            "Use 10f punishers for -10 moves, 12f-14f for medium, 15f+ launchers for severe punishable moves",
            "Count frames after blocking to ensure safe punishment",
            "Practice punish timing with the fastest available moves for each window"
          ]
        }

        console.log('[Ollama] Using fallback response due to validation failure')
        return fallback
      }
    } catch (error) {
      console.error('[Ollama] Error:', error)
      if (error instanceof SyntaxError) {
        console.error('[Ollama] JSON parse error. Check the response format above.')
      }
      throw error
    }
  }
}

export class AIService {
  async analyzeMatch(
    request: MatchAnalysisRequest,
    config: AIModelConfig
  ): Promise<{ analysis: MatchAnalysis; tokensUsed: number; creditsUsed: number }> {
    const provider = new AIProvider(config)
    const analysis = await provider.analyzeMatch(request)

    // Calculate token usage (simplified estimation)
    const tokenEstimate = JSON.stringify(request).length + JSON.stringify(analysis).length
    const creditsUsed = Math.ceil(tokenEstimate / 1000) // 1 credit per 1000 tokens

    return {
      analysis,
      tokensUsed: tokenEstimate,
      creditsUsed,
    }
  }

  async *analyzeMatchStreaming(
    request: MatchAnalysisRequest,
    config: AIModelConfig
  ): AsyncIterableIterator<{ analysis: Partial<MatchAnalysis>; tokensUsed: number; creditsUsed: number }> {
    // Implement streaming version
    // For now, return full analysis
    const result = await this.analyzeMatch(request, config)
    yield result
  }
}

export const aiService = new AIService()