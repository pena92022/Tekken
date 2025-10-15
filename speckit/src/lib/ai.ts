import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIModelConfig, MatchAnalysisRequest, MatchAnalysis } from '@/types'

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
    const prompt = this.buildTekkenPrompt(request)

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

  private buildTekkenPrompt(request: MatchAnalysisRequest): string {
    return `
You are an expert Tekken 8 competitive analyst. Analyze this matchup and provide strategic insights.

Matchup: ${request.playerCharacter} vs ${request.opponentCharacter}
${request.stage ? `Stage: ${request.stage}` : ''}
${request.gameMode ? `Game Mode: ${request.gameMode}` : ''}

Provide analysis in JSON format with the following structure:
{
  "summary": "Brief overview of the matchup",
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

    return JSON.parse(content)
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