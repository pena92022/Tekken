# Analysis Summary: Tekken Match Analysis Platform

**Date**: October 15, 2025  
**Analyzed By**: GitHub Copilot  
**Context**: User feedback on UI and data accuracy issues

---

## Current State

### What's Working ✅
- Next.js 15 project structure with TypeScript
- Basic UI with character selection
- Supabase integration for database
- AI service with multiple provider support (OpenAI, Claude, Gemini, Ollama)
- shadcn/ui components for consistent design
- Match analysis flow (select characters → analyze → show results)

### What's Broken/Suboptimal ❌
1. **UI Clutter**: Stage and Game Mode inputs don't significantly impact analysis
2. **Data Accuracy**: Ollama/gemma3:1b model producing inaccurate frame data
3. **No Real Data**: Currently using placeholder/mock data sources
4. **Match Summary**: Redundant summary section in results
5. **AI Output**: Unstructured output leads to inconsistent results

---

## Problem Analysis

### Issue #1: UI Complexity
**Problem**: User interface has unnecessary inputs that don't add value  
**Evidence**: User screenshot shows Stage & Game Mode inputs  
**Impact**: Confusing UX, makes simple task feel complex  
**Solution**: Remove Stage and Game Mode from inputs, focus on character matchup only

### Issue #2: Data Accuracy
**Problem**: Using Ollama with gemma3:1b producing hallucinated/inaccurate frame data  
**Root Cause**: Small local model lacks Tekken-specific knowledge  
**Evidence**: User mentioned "major problem with data accuracy"  
**Impact**: Users can't trust the analysis for competitive play  
**Solution**: Integrate with tekkendocs.com for frame-perfect accuracy

### Issue #3: No Structured Data Pipeline
**Problem**: AI generating free-form text without validation  
**Evidence**: No Zod schemas or validation in current ai.ts  
**Impact**: Inconsistent output format, potential errors  
**Solution**: Implement structured input/output with Zod validation

---

## Proposed Solution

### Architecture: Hybrid Data + Structured AI

```
┌─────────────────┐
│   User Selects  │
│   Characters    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  TekkenDocs API                 │
│  ├─ Fetch frame data            │
│  ├─ Cache in database (7 days)  │
│  └─ Extract key moves            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Matchup Context Builder        │
│  ├─ Player's key moves          │
│  ├─ Opponent's punishable moves │
│  └─ Character metadata          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AI Service (OpenAI/Claude)     │
│  ├─ Structured prompt           │
│  ├─ JSON output mode            │
│  └─ Zod validation              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Match Analysis UI              │
│  ├─ Key Moves                   │
│  ├─ Counter Strategies          │
│  ├─ Strategic Tips              │
│  └─ (No summary, no stage)      │
└─────────────────────────────────┘
```

### Data Flow

1. **User Input**: Select player character + opponent character
2. **Data Fetch**: Fetch both characters' frame data from tekkendocs.com
3. **Context Build**: Identify key moves, punishable moves, matchup dynamics
4. **AI Analysis**: Send structured prompt with real frame data to AI
5. **Validation**: Validate AI response against Zod schema
6. **Display**: Show validated, accurate analysis to user

---

## Implementation Plan Summary

### Phase 1: UI Simplification (2 hours)
- Remove Stage input
- Remove Game Mode input
- Remove Match Analysis Summary
- Update types

### Phase 2: TekkenDocs Integration (4 hours)
- Research API structure
- Create type definitions
- Build client service
- Implement caching

### Phase 3: Structured AI (6 hours)
- Create Zod schemas
- Build context builder
- Update AI prompts
- Add validation pipeline

### Phase 4: Polish (4 hours)
- Error handling
- Loading states
- Performance optimization
- Testing

**Total MVP Time**: ~16 hours (2-3 days)

---

## Technical Decisions

### Decision Matrix

| Decision | Option A | Option B | Choice | Rationale |
|----------|----------|----------|--------|-----------|
| **Data Source** | Scrape websites | Use tekkendocs.com API | **API** | Maintained, accurate, RESTful |
| **AI Provider** | Keep Ollama local | Use OpenAI/Claude | **OpenAI** | Structured output, accuracy |
| **Caching** | Memory only | Database + Memory | **Both** | Performance + reliability |
| **Validation** | Trust AI output | Zod schemas | **Zod** | Type safety, consistency |
| **UI** | Keep all inputs | Simplify to essentials | **Simplify** | Better UX, less confusion |

### Key Tradeoffs

**Tekkendocs.com Dependency**
- ✅ Pro: Accurate, maintained community data
- ✅ Pro: No maintenance overhead
- ❌ Con: External dependency
- ✅ Mitigation: Database caching for reliability

**OpenAI API Costs**
- ✅ Pro: High quality, structured output
- ❌ Con: Costs money (~$0.001 per analysis)
- ✅ Pro: Affordable at scale (1000 analyses = $1)
- ✅ Mitigation: Use GPT-4o-mini, cache analyses

**Development Time**
- Option A (Local data): 30+ hours to build + maintain
- Option B (API integration): 16 hours for MVP
- ✅ **Choice**: API integration (faster to market)

---

## Risk Assessment

### High Risk 🔴
1. **TekkenDocs API Availability**
   - Mitigation: Database caching (7-day TTL)
   - Fallback: Graceful degradation with cached data
   - Monitoring: Health checks, alerts

### Medium Risk 🟡
2. **AI API Costs Exceeding Budget**
   - Mitigation: Token optimization, cheaper models
   - Monitoring: Track costs per user, set alerts
   - Fallback: Rate limiting per user

3. **Data Becoming Stale**
   - Mitigation: 7-day cache refresh
   - Monitoring: Compare with upstream periodically
   - Manual: Admin cache invalidation

### Low Risk 🟢
4. **Character ID Mapping Errors**
   - Mitigation: Validate IDs against known roster
   - Testing: Test all 38+ characters
   - Simple: Direct string matching

---

## Success Metrics

### Launch Criteria (MVP)
- [ ] User can analyze any T8 character matchup
- [ ] Analysis includes 5+ accurate key moves
- [ ] Frame data matches tekkendocs.com (99%+ accuracy)
- [ ] Response time < 5 seconds
- [ ] Mobile responsive
- [ ] No critical errors

### Post-Launch KPIs
- **Accuracy**: Frame data validation (target: 99%+)
- **Performance**: Response time (target: < 5s)
- **Reliability**: Error rate (target: < 5%)
- **Cost**: AI cost per analysis (target: < $0.002)
- **Usage**: Daily active users
- **Engagement**: Analyses per user

---

## Files Created/Updated

### New Files
1. ✅ `MVP-TASKS.md` - 46 detailed tasks organized by phase
2. ✅ `docs/TEKKENDOCS-INTEGRATION.md` - API integration guide
3. ✅ `NEXT-STEPS.md` - Immediate action items
4. ✅ `ANALYSIS-SUMMARY.md` - This file

### Files to Modify (Next)
1. `src/components/MatchAnalysis.tsx` - Remove inputs, update UI
2. `src/types/index.ts` - Update interfaces
3. `src/lib/ai.ts` - Update prompts, add validation
4. `src/types/tekkendocs.ts` - New file for types
5. `src/lib/tekkendocs-client.ts` - New file for API client
6. `src/lib/matchup-context.ts` - New file for context builder
7. `src/lib/schemas.ts` - New file for Zod schemas

---

## Resource Links

### External Resources
- **TekkenDocs Website**: https://tekkendocs.com
- **TekkenDocs GitHub**: https://github.com/pbruvoll/tekkendocs
- **API Example**: https://tekkendocs.com/api/t8/devil-jin/framedata
- **Character List**: https://tekkendocs.com/t8

### Project Resources
- **MVP Tasks**: [MVP-TASKS.md](./MVP-TASKS.md)
- **Integration Guide**: [docs/TEKKENDOCS-INTEGRATION.md](./docs/TEKKENDOCS-INTEGRATION.md)
- **Next Steps**: [NEXT-STEPS.md](./NEXT-STEPS.md)
- **Constitution**: [speckit.constitution.md](./speckit.constitution.md)

### Development Tools
- **Next.js Docs**: https://nextjs.org/docs
- **Zod**: https://zod.dev
- **OpenAI API**: https://platform.openai.com/docs
- **Supabase**: https://supabase.com/docs

---

## Recommendations

### Immediate (Start Today)
1. ✅ **Remove UI clutter** (Tasks T006-T010) - 1-2 hours
2. ✅ **Set up environment** - Add OpenAI API key - 15 minutes
3. ✅ **Create type definitions** (Task T011) - 15 minutes
4. ✅ **Build tekkendocs client** (Task T013) - 30 minutes
5. ✅ **Test with real data** - 15 minutes

### This Week (MVP Core)
1. Build matchup context builder (Task T023)
2. Update AI service with structured prompts (Task T019-T022)
3. Add Zod validation (Task T017-T018)
4. Test 10+ character matchups
5. Deploy to staging

### Next Week (Polish & Launch)
1. Add error handling
2. Optimize performance
3. Write tests
4. Documentation
5. Production deployment

---

## Questions for User

1. **Priority**: Should we focus on MVP speed or feature completeness?
   - Recommendation: **Speed** - Get working MVP in 3 days, iterate based on feedback

2. **AI Provider**: Prefer OpenAI, Claude, or keep it configurable?
   - Recommendation: **OpenAI GPT-4o-mini** for balance of cost/quality

3. **Caching Strategy**: Database caching now or memory cache for MVP?
   - Recommendation: **Memory cache for MVP**, add database in Week 2

4. **Testing**: Manual QA or automated tests first?
   - Recommendation: **Manual QA for MVP**, add automated tests gradually

---

## Conclusion

The Tekken Match Analysis Platform has a solid foundation but needs:

1. **Simplified UI** - Remove unnecessary inputs ✅ Easy, high impact
2. **Accurate Data** - Integrate tekkendocs.com ✅ Critical for trust
3. **Structured AI** - Validate with Zod schemas ✅ Ensures consistency

With the proposed hybrid architecture (tekkendocs API + structured AI), we can deliver a reliable, accurate MVP in ~16 hours over 2-3 days.

The task list in `MVP-TASKS.md` provides a clear roadmap with 46 actionable tasks organized into 8 phases. Start with the immediate next steps in `NEXT-STEPS.md`.

**Recommendation**: Begin with UI simplification today (2 hours), then tackle data integration tomorrow (4 hours). By end of week, you'll have a working MVP with accurate frame data.

---

**Next Action**: Review `NEXT-STEPS.md` and start with Task T006 (Remove Stage input)

**Questions?**: All implementation details are in the docs folder.

**Ready to ship!** 🚀
