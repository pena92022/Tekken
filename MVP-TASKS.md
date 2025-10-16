# MVP Tasks: Tekken Match Analysis Platform

**Date**: October 15, 2025  
**Branch**: master  
**Project Type**: Next.js 15 + Supabase + AI Integration

## Executive Summary

This MVP focuses on delivering a streamlined match analysis tool that provides **accurate, data-driven** Tekken 8 matchup analysis. Based on UI feedback and data accuracy issues with Ollama/gemma3:1b, this update prioritizes:

1. **UI Simplification**: Remove Stage & Game Mode inputs, remove Match Analysis Summary
2. **Data Accuracy**: Integrate with tekkendocs.com data via pbruvoll/tekkendocs project
3. **Structured AI**: Implement reliable structured input/output with validated Tekken data
4. **Two Approaches**: Support both local data instantiation and direct tekkendocs integration

---

## Phase 1: Setup & Infrastructure ✅ (Complete)

**Status**: Already initialized with Next.js 15, TypeScript, Tailwind, Supabase

- [x] T001 Next.js 15 project with App Router
- [x] T002 TypeScript strict configuration
- [x] T003 Tailwind CSS + shadcn/ui components
- [x] T004 Supabase client setup
- [x] T005 Database schema initialized

---

## Phase 2: UI Simplification (Priority: P1) 🎯 MVP

**Goal**: Streamline the match analysis interface per user feedback

### Implementation

- [ ] **T006** [P] [US1] Remove `stage` field from MatchAnalysis component UI
  - File: `src/components/MatchAnalysis.tsx`
  - Remove Stage select dropdown (lines ~137-156)
  - Remove stage from state management

- [ ] **T007** [P] [US1] Remove `gameMode` field from MatchAnalysis component UI
  - File: `src/components/MatchAnalysis.tsx`
  - Remove Game Mode select dropdown (lines ~158-176)
  - Remove gameMode from state management

- [ ] **T008** [US1] Remove Match Analysis Summary card from results
  - File: `src/components/MatchAnalysis.tsx`
  - Remove summary Card component (lines ~212-220)
  - Adjust layout to go directly to Key Moves and Counter Moves sections

- [ ] **T009** [US1] Update MatchAnalysisRequest type
  - File: `src/types/index.ts`
  - Make `stage?` and `gameMode?` fully optional in type definition
  - Update JSDoc comments to reflect optional nature

- [ ] **T010** [US1] Update AI prompt to exclude removed fields
  - File: `src/lib/ai.ts`
  - Remove stage and gameMode from `buildTekkenPrompt` method
  - Adjust prompt to focus on character matchup only

**Checkpoint**: UI is simplified to character selection only, results show actionable data without summary

---

## Phase 3: TekkenDocs Data Integration (Priority: P1) 🎯 MVP

**Goal**: Integrate accurate frame data from tekkendocs.com using pbruvoll/tekkendocs structure

### Research & Planning

- [ ] **T011** [P] [US2] Research tekkendocs API structure
  - Endpoint: `https://tekkendocs.com/api/t8/{character}/framedata`
  - Document JSON structure for moves, properties, frame data
  - Identify required fields: command, hitLevel, damage, block, hit, startup, etc.
  - Create interface: `TekkenDocsMove`, `TekkenDocsResponse`
  - File: `src/types/tekkendocs.ts`

- [ ] **T012** [P] [US2] Research tekkendocs metadata endpoints
  - Endpoint: `https://tekkendocs.com/api/t8/{character}/meta`
  - Document cheat sheet, punishers, key moves, combos structure
  - Create interfaces for structured metadata
  - File: `src/types/tekkendocs.ts`

### Data Service Layer

- [ ] **T013** [US2] Create TekkenDocs service client
  - File: `src/lib/tekkendocs-client.ts`
  - Implement `fetchCharacterFrameData(character: string)` method
  - Implement `fetchCharacterMetadata(character: string)` method
  - Add caching layer (cache responses for 24 hours)
  - Add error handling with retry logic
  - Add TypeScript strict types for all responses

- [ ] **T014** [US2] Update existing `tekken-api.ts` to use TekkenDocs client
  - File: `src/lib/tekken-api.ts`
  - Replace placeholder `scrapeCharacterData` with `tekkendocsClient.fetchCharacterFrameData`
  - Update `TekkenMoveData` interface to match TekkenDocs structure
  - Remove unused TEKKEN_DATA_SOURCES array

### Database Caching Strategy

- [ ] **T015** [US2] Create frame_data table migration
  - File: `supabase/migrations/002_frame_data_cache.sql`
  - Table: `frame_data` (id, character_id, move_data jsonb, updated_at)
  - Table: `character_metadata` (id, character_id, metadata jsonb, updated_at)
  - Add indexes on character_id and updated_at
  - Add RLS policies

- [ ] **T016** [US2] Implement database caching in TekkenDocs service
  - File: `src/lib/tekkendocs-client.ts`
  - Check database cache before API call
  - Store API responses in database with timestamp
  - Invalidate cache after 7 days
  - Add Supabase client integration

**Checkpoint**: Can fetch and cache accurate frame data from tekkendocs.com

---

## Phase 4: Structured AI with Validated Data (Priority: P1) 🎯 MVP

**Goal**: Replace unreliable Ollama/gemma3:1b with structured AI that uses validated Tekken data

### Zod Schema Validation

- [ ] **T017** [P] [US3] Create Zod schemas for AI responses
  - File: `src/lib/schemas.ts`
  - Schema: `KeyMoveSchema` (name, notation, description, priority)
  - Schema: `CounterMoveSchema` (move, counter, frameAdvantage)
  - Schema: `StrategySchema` (name, description, conditions)
  - Schema: `MatchAnalysisSchema` (keyMoves, counters, strategies, tips)
  - Export validation function: `validateMatchAnalysis(data: unknown)`

- [ ] **T018** [P] [US3] Create Zod schemas for TekkenDocs data
  - File: `src/lib/schemas.ts`
  - Schema: `TekkenDocsMoveSchema`
  - Schema: `TekkenDocsMetadataSchema`
  - Validation functions for API responses

### Enhanced AI Service

- [ ] **T019** [US3] Implement structured prompt with frame data context
  - File: `src/lib/ai.ts`
  - Update `buildTekkenPrompt` to include actual frame data from tekkendocs
  - Add move list context for both characters
  - Add key punishers and counter moves from metadata
  - Format prompt with clear instructions for structured output
  - Include examples of valid JSON responses

- [ ] **T020** [US3] Add JSON schema to OpenAI/Claude API calls
  - File: `src/lib/ai.ts`
  - OpenAI: Use `response_format: { type: "json_object" }` with schema in prompt
  - Claude: Use JSON mode with explicit schema validation
  - Add post-processing with Zod validation
  - Add fallback handling for malformed responses

- [ ] **T021** [US3] Replace Ollama endpoint with OpenAI/Claude as primary
  - File: `src/lib/ai.ts`
  - Update development config to use OpenAI with API key from env
  - Add `OPENAI_API_KEY` to environment variables
  - Remove Ollama as default, make it optional advanced option
  - Update `MatchAnalysis.tsx` to use new config

- [ ] **T022** [US3] Implement response validation pipeline
  - File: `src/lib/ai.ts`
  - Parse AI response with `JSON.parse()`
  - Validate with `validateMatchAnalysis()` Zod schema
  - If validation fails, retry with corrected prompt
  - Max 2 retries, then return graceful error
  - Log validation errors for debugging

### Data Contextualization

- [ ] **T023** [US3] Create matchup analysis context builder
  - File: `src/lib/matchup-context.ts`
  - Function: `buildMatchupContext(player, opponent)` 
  - Fetch both character's frame data
  - Fetch both character's metadata (punishers, key moves)
  - Identify player's fastest moves, launchers, key tools
  - Identify opponent's punishable moves, weaknesses
  - Return structured context object for AI prompt

- [ ] **T024** [US3] Integrate context builder into AI service
  - File: `src/lib/ai.ts`
  - Call `buildMatchupContext()` before generating prompt
  - Include context in prompt with clear formatting
  - Add character-specific tips from metadata
  - Ensure AI has all data needed for accurate analysis

**Checkpoint**: AI generates accurate, validated matchup analysis using real frame data

---

## Phase 5: Data Loading & Error Handling (Priority: P2)

**Goal**: Robust data loading with proper error states and fallbacks

### Loading States

- [ ] **T025** [P] [US4] Add loading state for data fetching
  - File: `src/components/MatchAnalysis.tsx`
  - Show skeleton loader while fetching frame data
  - Add progress indicator for multi-step analysis
  - Update button states during processing

- [ ] **T026** [P] [US4] Create DataLoadingIndicator component
  - File: `src/components/DataLoadingIndicator.tsx`
  - Show status: "Fetching frame data...", "Analyzing matchup...", "Generating strategies..."
  - Use Lucide icons for each step
  - Progress bar for visual feedback

### Error Handling

- [ ] **T027** [US4] Implement comprehensive error handling
  - File: `src/lib/tekkendocs-client.ts`
  - Handle network errors (timeout, connection refused)
  - Handle API errors (404 character not found, 500 server error)
  - Handle rate limiting (429 too many requests)
  - Return typed errors with user-friendly messages

- [ ] **T028** [US4] Add error recovery strategies
  - File: `src/lib/ai.ts`
  - If tekkendocs API fails, show cached data if available
  - If AI API fails, show retry button
  - If validation fails, show partial results with warning
  - Log all errors to console/monitoring service

- [ ] **T029** [US4] Create ErrorDisplay component
  - File: `src/components/ErrorDisplay.tsx`
  - Show error message with icon
  - Provide actionable next steps (retry, check connection, etc.)
  - Link to status page if service is down

**Checkpoint**: Graceful handling of all error scenarios with clear user feedback

---

## Phase 6: Performance & Caching (Priority: P2)

**Goal**: Fast analysis with intelligent caching

### Caching Strategy

- [ ] **T030** [P] [US5] Implement Redis cache layer (optional)
  - File: `src/lib/cache.ts`
  - Cache tekkendocs API responses (24h TTL)
  - Cache AI analysis results (7d TTL, keyed by matchup)
  - Use Vercel KV or Upstash Redis
  - Add environment variables for Redis connection

- [ ] **T031** [P] [US5] Add browser cache with SWR pattern
  - File: `src/hooks/useFrameData.ts`
  - Use SWR or React Query for client-side caching
  - Fetch frame data on component mount
  - Revalidate on window focus
  - Share cache across components

### Optimization

- [ ] **T032** [US5] Implement request deduplication
  - File: `src/lib/tekkendocs-client.ts`
  - If same character is requested multiple times, dedupe requests
  - Use Map<character, Promise> to track in-flight requests
  - Prevent redundant API calls

- [ ] **T033** [US5] Optimize AI token usage
  - File: `src/lib/ai.ts`
  - Truncate frame data to most relevant moves only
  - Limit move list to top 20-30 most important moves
  - Use cheaper model for simple matchups (gpt-4o-mini)
  - Reserve expensive model (gpt-4) for complex analysis

- [ ] **T034** [US5] Add prefetching for common matchups
  - File: `src/components/MatchAnalysis.tsx`
  - Prefetch frame data when user selects first character
  - Preload opponent data for top 10 most played characters
  - Background fetch on hover (advanced)

**Checkpoint**: Fast response times with intelligent caching and optimization

---

## Phase 7: Testing & Quality Assurance (Priority: P3)

**Goal**: Ensure reliability and accuracy of analysis

### Unit Tests

- [ ] **T035** [P] [US6] Test TekkenDocs client
  - File: `src/lib/__tests__/tekkendocs-client.test.ts`
  - Mock API responses
  - Test successful data fetching
  - Test error scenarios (404, 500, timeout)
  - Test caching behavior

- [ ] **T036** [P] [US6] Test schema validation
  - File: `src/lib/__tests__/schemas.test.ts`
  - Test valid Tekken data passes validation
  - Test invalid data fails with clear errors
  - Test edge cases (missing fields, wrong types)

- [ ] **T037** [P] [US6] Test matchup context builder
  - File: `src/lib/__tests__/matchup-context.test.ts`
  - Test context generation for various matchups
  - Test handling of incomplete data
  - Test performance with large datasets

### Integration Tests

- [ ] **T038** [US6] Test end-to-end analysis flow
  - File: `src/components/__tests__/MatchAnalysis.test.tsx`
  - Test user selects characters → analysis runs → results display
  - Test error scenarios → error message displays
  - Test loading states → indicators show correctly
  - Use Playwright or Cypress

- [ ] **T039** [US6] Test AI service integration
  - File: `src/lib/__tests__/ai.integration.test.ts`
  - Test AI generates valid responses (with real API keys in CI)
  - Test validation pipeline catches malformed responses
  - Test retry logic works correctly
  - Test different AI providers (OpenAI, Claude, Gemini)

### Manual QA

- [ ] **T040** [US6] QA checklist for match analysis accuracy
  - Verify key moves are relevant to matchup
  - Verify frame data numbers match tekkendocs.com
  - Verify counters are actually frame-advantageous
  - Verify strategies make sense for character archetypes
  - Test 10+ different matchups manually

**Checkpoint**: All tests passing, manual QA confirms accuracy

---

## Phase 8: Documentation & Deployment (Priority: P3)

**Goal**: Ship MVP with proper documentation

### Documentation

- [ ] **T041** [P] [US7] Update README with MVP features
  - File: `README.md`
  - Document new UI (simplified inputs)
  - Document data sources (tekkendocs.com)
  - Document AI providers and setup
  - Add screenshots of analysis results

- [ ] **T042** [P] [US7] Create API documentation
  - File: `docs/API.md`
  - Document TekkenDocs client methods
  - Document AI service methods
  - Document types and schemas
  - Add usage examples

- [ ] **T043** [P] [US7] Create setup guide
  - File: `docs/SETUP.md`
  - Environment variables (.env.local template)
  - Supabase setup instructions
  - AI provider API key setup
  - Local development workflow

### Deployment

- [ ] **T044** [US7] Configure environment variables for production
  - Add to Vercel/deployment platform
  - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DATABASE_URL` for caching (if using)

- [ ] **T045** [US7] Deploy to Vercel/production
  - Connect GitHub repository
  - Configure build settings
  - Run database migrations
  - Test production deployment
  - Monitor for errors

- [ ] **T046** [US7] Set up monitoring and analytics
  - Add error tracking (Sentry)
  - Add analytics (Vercel Analytics or Plausible)
  - Monitor AI API usage and costs
  - Set up alerts for errors

**Checkpoint**: MVP deployed and documented, ready for user feedback

---

## Implementation Strategy

### MVP-First Approach (Recommended)

1. **Week 1**: Phase 2 (UI Simplification) + Phase 3 (TekkenDocs Integration)
2. **Week 2**: Phase 4 (Structured AI) + Phase 5 (Error Handling)
3. **Week 3**: Phase 6 (Performance) + Phase 7 (Testing)
4. **Week 4**: Phase 8 (Deployment) + User Feedback Collection

### Critical Path

```
T006-T010 (UI) → T011-T016 (Data) → T017-T024 (AI) → T025-T029 (Errors) → T044-T046 (Deploy)
```

### Parallel Work Opportunities

- **T006-T010** (UI changes) can be done in parallel
- **T011-T012** (Research) can be done in parallel
- **T017-T018** (Schemas) can be done in parallel
- **T035-T037** (Unit tests) can be done in parallel

---

## Technical Decisions

### Data Source Strategy

**Decision**: Use TekkenDocs API as primary source with database caching

**Rationale**:
- ✅ Maintained by community (pbruvoll/tekkendocs)
- ✅ Comprehensive frame data for all T8 characters
- ✅ Includes metadata (punishers, combos, key moves)
- ✅ RESTful API available at `/api/t8/{character}/framedata`
- ✅ No need to scrape or maintain our own data
- ❌ Dependency on external service (mitigated by caching)

**Alternative Considered**: Clone tekkendocs data locally
- ❌ More maintenance overhead
- ❌ Need to sync updates manually
- ✅ Full control over data
- ✅ No external dependency

**Hybrid Approach**: Cache in database for 7 days, fallback to API
- ✅ Best of both worlds
- ✅ Fast local access
- ✅ Automatic updates from upstream
- ✅ Works offline with stale data

### AI Provider Strategy

**Decision**: OpenAI GPT-4o-mini as default, with provider flexibility

**Rationale**:
- ✅ Structured JSON output with `response_format`
- ✅ Reliable and accurate with proper prompting
- ✅ Affordable ($0.150 / 1M input tokens, $0.600 / 1M output)
- ✅ Fast response times (~2-3 seconds)
- ❌ Requires API key and costs money
- ❌ Rate limiting on free tier

**Alternative**: Keep Ollama for development only
- ✅ Free and local
- ❌ Inaccurate responses with small models (gemma3:1b)
- ❌ Requires local setup
- ✅ Good for testing without API costs

**Solution**: Make AI provider configurable, default to OpenAI for production

---

## Dependencies & Packages to Add

```json
{
  "dependencies": {
    "zod": "^4.1.12",           // Already installed ✅
    "@vercel/kv": "^1.0.0",     // Optional: Redis caching
    "swr": "^2.2.0"             // Client-side data fetching
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0",  // E2E testing
    "vitest": "^1.0.0"               // Unit testing
  }
}
```

---

## Environment Variables Template

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider (choose one or multiple)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Optional: Redis Caching
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token

# TekkenDocs API (default: https://tekkendocs.com)
TEKKENDOCS_API_URL=https://tekkendocs.com

# Development
NODE_ENV=development
```

---

## Success Metrics

### MVP Launch Criteria

- [ ] Users can select two characters and get analysis
- [ ] Analysis includes 5+ key moves with accurate frame data
- [ ] Analysis includes 3+ counter strategies with frame advantage
- [ ] Analysis includes 3+ strategic tips
- [ ] Response time < 5 seconds for analysis
- [ ] Frame data matches tekkendocs.com (spot check 10 moves)
- [ ] Error rate < 5% in production
- [ ] Mobile responsive and accessible

### Post-MVP Metrics to Track

- Average response time
- AI API costs per analysis
- User satisfaction ratings
- Most analyzed matchups
- Error rates by error type
- Cache hit rate
- Returning user rate

---

## Notes

- **Removed Fields**: Stage and Game Mode were removed per user feedback as they don't significantly impact matchup analysis
- **Data Accuracy**: Using tekkendocs.com ensures frame-perfect accuracy, critical for competitive players
- **Structured Output**: Zod schemas ensure AI responses are validated and consistent
- **Caching Strategy**: Hybrid approach balances freshness with performance
- **Cost Control**: Using GPT-4o-mini keeps costs reasonable (~$0.001 per analysis)
- **Future Enhancements**: Video analysis, replay parsing, personalized recommendations (post-MVP)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| TekkenDocs API goes down | Database cache + fallback to stale data |
| AI API rate limiting | Request queuing + user-level throttling |
| Inaccurate AI responses | Validation pipeline + manual QA |
| High AI costs | Token optimization + cheaper model for simple matchups |
| Slow response times | Caching + prefetching + parallel requests |
| Data becomes outdated | 7-day cache TTL + manual refresh option |

---

**END OF MVP TASKS**
