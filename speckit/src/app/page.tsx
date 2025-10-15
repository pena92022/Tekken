import { MatchAnalysis } from '@/components/MatchAnalysis'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Speckit
          </h1>
          <p className="text-xl text-slate-300">
            AI-Powered Tekken Analytics
          </p>
        </header>
        <MatchAnalysis />
      </div>
    </div>
  )
}
