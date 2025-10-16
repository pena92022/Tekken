'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Swords, Target, Shield, Lightbulb } from 'lucide-react'
import type { MatchAnalysisRequest, MatchAnalysis, AIModelConfig } from '@/types'
import { aiService } from '@/lib/ai'

const TEKKEN8_CHARACTERS = [
  // Base roster
  'Alisa Bosconovitch', 'Asuka Kazama', 'Azucena Milagros Ortiz Castillo', 'Bryan Fury',
  'Claudio Serafino', 'Devil Jin', 'Sergei Dragunov', 'Feng Wei', 'Hwoarang', 'Jack-8',
  'Jin Kazama', 'Jun Kazama', 'Kazuya Mishima', 'King', 'Kuma', 'Lars Alexandersson',
  'Lee Chaolan', 'Leo Kliesen', 'Leroy Smith', 'Lili', 'Ling Xiaoyu', 'Marshall Law',
  'Nina Williams', 'Panda', 'Paul Phoenix', 'Raven', 'Reina', 'Shaheen', 'Steve Fox',
  'Victor Chevalier', 'Yoshimitsu', 'Zafina',
  // DLC characters
  'Clive Rosfield', 'Eddy Gordo', 'Heihachi Mishima', 'Lidia Sobieska', 'Anna Williams',
  'Fahkumram', 'Armor King'
]

const STAGES_T8 = [
  'Arena', 'Arena (Underground)', 'Urban Square (Evening)', 'Urban Square', 'Yakushima',
  'Coliseum of Fate', 'Rebel Hangar', 'Fallen Destiny', 'Descent into Subconsciousness',
  'Sanctum', 'Into the Stratosphere', 'Ortiz Farm', 'Celebration on the Seine',
  'Secluded Training Ground', 'Elegant Palace', 'Midnight Siege', 'Seaside Resort',
  'Genmaji Temple', 'Phoenix Gate', 'Pac Pixels'
]

export function MatchAnalysis() {
  const [request, setRequest] = useState<MatchAnalysisRequest>({
    playerCharacter: '',
    opponentCharacter: '',
  })

  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!request.playerCharacter || !request.opponentCharacter) {
      setError('Please select both characters')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Use Ollama with gemma3:1b by default
      const config: AIModelConfig = {
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'gemma3:1b',
        endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
      }

      const result = await aiService.analyzeMatch(request, config)
      setAnalysis(result.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="w-6 h-6" />
            Match Analysis Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Character</label>
              <Select
                value={request.playerCharacter}
                onValueChange={(value: string) => setRequest(prev => ({ ...prev, playerCharacter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your character" />
                </SelectTrigger>
                <SelectContent>
                  {TEKKEN8_CHARACTERS.map(char => (
                    <SelectItem key={char} value={char}>{char}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Opponent Character</label>
              <Select
                value={request.opponentCharacter}
                onValueChange={(value: string) => setRequest(prev => ({ ...prev, opponentCharacter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select opponent character" />
                </SelectTrigger>
                <SelectContent>
                  {TEKKEN8_CHARACTERS.map(char => (
                    <SelectItem key={char} value={char}>{char}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full md:w-auto"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Matchup...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Analyze Matchup
              </>
            )}
          </Button>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {request.playerCharacter} - Optimal Punishes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis?.optimalPunishes?.map((optimal, index) => (
                  <div key={index} className="border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{optimal.window} Window</span>
                      <Badge variant="secondary">
                        {optimal.recommendedMoves.length} moves
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-slate-400">Punish with:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {optimal.recommendedMoves.map((move, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {move}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">When:</span>
                        <ul className="text-xs text-slate-300 mt-1">
                          {optimal.situations.map((situation, idx) => (
                            <li key={idx}>• {situation}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
                {(!analysis?.optimalPunishes || analysis.optimalPunishes.length === 0) && (
                  <div className="text-center text-slate-400 py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No optimal punishes available</p>
                    <p className="text-xs">Check console for AI response details</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {request.opponentCharacter} - Punishable Moves
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis?.punishOptions?.slice(0, 10).map((punish, index) => (
                  <div key={index} className="border border-slate-700 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{punish.opponentMove}</h4>
                        <span className="text-xs text-slate-400">{punish.punishWindow} punishable</span>
                      </div>
                      <Badge variant="destructive">
                        {punish.frameAdvantage}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300">{punish.description}</p>
                  </div>
                ))}
                {(!analysis?.punishOptions || analysis.punishOptions.length === 0) && (
                  <div className="text-center text-slate-400 py-8">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No punishable moves available</p>
                    <p className="text-xs">Check console for AI response details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Strategic Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis?.strategies?.map((strategy, index) => (
                <div key={index} className="border border-slate-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2">{strategy.name}</h4>
                  <p className="text-sm text-slate-300 mb-2">{strategy.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {strategy.conditions.map((condition, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-slate-300">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
