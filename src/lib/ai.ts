import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIModelConfig, MatchAnalysisRequest, MatchAnalysis } from '@/types'
import { buildMatchupContext } from './matchup-context'
import { validateMatchAnalysis } from './schemas'

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
        return this.analyzeWithOllama(prompt)
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
    } catch (error) {
      console.warn('[AI] Failed to fetch frame data, using basic prompt:', error)
      // Fallback to basic prompt without frame data
      return this.buildBasicPrompt(request)
    }

    return `
You are an expert Tekken 8 competitive analyst with access to accurate frame data.

## Matchup
- Player Character: ${context.playerCharacter}
- Opponent Character: ${context.opponentCharacter}

## Player's Key Moves (Your Arsenal)
${context.playerKeyMoves.slice(0, 15).map(m => 
  `- ${m.command}: ${m.hitLevel}, ${m.damage} damage, ${m.startup}f startup, ${m.block} on block${m.notes ? ` (${m.notes})` : ''}`
).join('\n')}

## Opponent's Punishable Moves (Exploit These)
${context.opponentPunishableMoves.slice(0, 10).map(m =>
  `- ${m.command}: ${m.hitLevel}, ${m.damage} damage, ${m.block} on block (PUNISHABLE)${m.notes ? ` - ${m.notes}` : ''}`
).join('\n')}

## Task
Provide strategic matchup analysis in JSON format. Focus on:
1. Which of your key moves work best in this matchup (use actual move notations from above)
2. How to punish opponent's unsafe moves (use actual punishable moves from above)
3. Specific strategies tailored to this matchup

## JSON Schema (MUST follow exactly)
{
  "keyMoves": [
    {
      "name": "Move name from player's arsenal",
      "notation": "Exact command notation from the list above",
      "description": "Why this move is strong in this matchup (50-100 words)",
      "priority": "high" | "medium" | "low"
    }
  ],
  "counters": [
    {
      "move": "Opponent move command from punishable moves above",
      "counter": "Your punish move command from key moves above",
      "frameAdvantage": 10
    }
  ],
  "strategies": [
    {
      "name": "Strategy name (e.g., 'Pressure with Plus Frames')",
      "description": "How to execute this strategy (100-150 words)",
      "conditions": ["When to use this strategy"]
    }
  ],
  "tips": [
    "Quick tactical tip 1",
    "Quick tactical tip 2",
    "Quick tactical tip 3"
  ]
}

IMPORTANT: 
- Use ONLY moves from the lists above
- Respond with VALID JSON only, no markdown, no explanation
- Include at least 5 key moves, 3 counters, 3 strategies, and 3 tips
- Frame advantage numbers must be accurate based on the block frames shown
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

  private async analyzeWithOllama(prompt: string): Promise<MatchAnalysis> {
    // Ollama integration would go here
    // For now, return mock data
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

    if (!response.ok) throw new Error('Ollama request failed')

    const result = await response.json()
    return JSON.parse(result.response)
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