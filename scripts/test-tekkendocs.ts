/**
 * Test script for TekkenDocs API integration
 * Run with: npx tsx scripts/test-tekkendocs.ts
 */

import { tekkenDocsClient } from '../src/lib/tekkendocs-client'
import { buildMatchupContext } from '../src/lib/matchup-context'

async function testTekkenDocsClient() {
  console.log('🧪 Testing TekkenDocs API Integration\n')
  console.log('=' .repeat(50))

  const testCharacters = ['devil-jin', 'dragunov', 'jin']

  for (const char of testCharacters) {
    try {
      console.log(`\n📥 Fetching ${char}...`)
      const data = await tekkenDocsClient.fetchCharacterFrameData(char)
      
      console.log(`✅ Success!`)
      console.log(`   Character: ${data.characterName}`)
      console.log(`   Total moves: ${data.framesNormal.length}`)
      console.log(`   Stances: ${data.stances.join(', ') || 'None'}`)
      console.log(`   Sample moves:`)
      
      // Show first 3 moves
      data.framesNormal.slice(0, 3).forEach((move, idx) => {
        console.log(`     ${idx + 1}. ${move.command} - ${move.hitLevel}, ${move.damage} dmg, ${move.startup}f startup, ${move.block} on block`)
      })
    } catch (error) {
      console.error(`❌ Failed: ${error instanceof Error ? error.message : error}`)
    }
  }
}

async function testMatchupContext() {
  console.log('\n\n' + '=' .repeat(50))
  console.log('🎮 Testing Matchup Context Builder\n')

  try {
    console.log('Building context for Devil Jin vs Dragunov...')
    const context = await buildMatchupContext('Devil Jin', 'Sergei Dragunov')
    
    console.log(`\n✅ Context built successfully!`)
    console.log(`   Player: ${context.playerCharacter}`)
    console.log(`   Opponent: ${context.opponentCharacter}`)
    console.log(`   Player moves: ${context.playerMoves.length}`)
    console.log(`   Opponent moves: ${context.opponentMoves.length}`)
    console.log(`   Player key moves: ${context.playerKeyMoves.length}`)
    console.log(`   Opponent punishable moves: ${context.opponentPunishableMoves.length}`)
    
    console.log(`\n🔑 Player's Top 5 Key Moves:`)
    context.playerKeyMoves.slice(0, 5).forEach((move, idx) => {
      console.log(`   ${idx + 1}. ${move.command} - ${move.hitLevel}, ${move.startup}f, ${move.block} on block ${move.notes ? `(${move.notes})` : ''}`)
    })
    
    console.log(`\n⚠️  Opponent's Top 5 Punishable Moves:`)
    context.opponentPunishableMoves.slice(0, 5).forEach((move, idx) => {
      console.log(`   ${idx + 1}. ${move.command} - ${move.block} on block (PUNISH!)`)
    })
  } catch (error) {
    console.error(`❌ Failed: ${error instanceof Error ? error.message : error}`)
  }
}

async function testCaching() {
  console.log('\n\n' + '=' .repeat(50))
  console.log('⚡ Testing Cache Performance\n')

  const char = 'devil-jin'
  
  console.log('First fetch (should hit API)...')
  const start1 = Date.now()
  await tekkenDocsClient.fetchCharacterFrameData(char)
  const time1 = Date.now() - start1
  console.log(`✓ Took ${time1}ms`)
  
  console.log('\nSecond fetch (should hit cache)...')
  const start2 = Date.now()
  await tekkenDocsClient.fetchCharacterFrameData(char)
  const time2 = Date.now() - start2
  console.log(`✓ Took ${time2}ms`)
  
  console.log(`\n📊 Cache speedup: ${Math.round(time1 / time2)}x faster`)
}

async function main() {
  try {
    await testTekkenDocsClient()
    await testMatchupContext()
    await testCaching()
    
    console.log('\n\n' + '=' .repeat(50))
    console.log('✅ All tests completed!\n')
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  }
}

main()
