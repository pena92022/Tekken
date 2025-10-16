# Tekken Match Analysis Platform

An AI-powered competitive gaming analytics platform for Tekken 8, providing frame-perfect matchup analysis, strategic insights, and data-driven recommendations.

## 🎯 Project Status

**Current Phase**: MVP Development  
**Focus**: UI Simplification + TekkenDocs Integration + Structured AI

See [MVP-TASKS.md](./MVP-TASKS.md) for detailed implementation roadmap.

## 🚀 Features (MVP)

- **Character Matchup Analysis**: Select your character and opponent for detailed analysis
- **Accurate Frame Data**: Integrated with [tekkendocs.com](https://tekkendocs.com) for frame-perfect accuracy
- **Key Moves**: Discover the most important moves for your matchup with priority ratings
- **Counter Strategies**: Learn how to counter your opponent's key moves with frame advantage data
- **Strategic Tips**: Get actionable advice for approaching the matchup
- **Validated AI Responses**: Structured output with Zod schema validation ensures consistency

## 🏗️ Recent Updates

### UI Simplification ✅
- Removed Stage input (not critical for matchup analysis)
- Removed Game Mode input (focusing on core competitive matchups)
- Removed Match Analysis Summary (redundant with detailed sections)
- Streamlined to: Character Selection → Actionable Analysis

### Data Accuracy Improvement 🚧
- **Problem**: Ollama/gemma3:1b producing inaccurate frame data
- **Solution**: Integrating with tekkendocs.com API (maintained by pbruvoll/tekkendocs)
- **Approach**: Hybrid caching strategy (database + API) for reliability and performance

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI GPT-4o-mini (structured JSON output)
- **Data Source**: TekkenDocs API + local caching
- **Validation**: Zod schemas for type safety

## 📋 Getting Started

First, install dependencies:

```bash
npm install
```

Create `.env.local` with your API keys:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider
OPENAI_API_KEY=sk-...

# Optional: Development with Ollama
OLLAMA_MODEL=gemma3:1b
OLLAMA_ENDPOINT=http://localhost:11434
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📚 Documentation

- **[MVP Tasks](./MVP-TASKS.md)**: Detailed implementation roadmap with 46 tasks
- **[Constitution](./speckit.constitution.md)**: Project architecture principles and standards
- **TekkenDocs API**: Frame data source at [tekkendocs.com](https://tekkendocs.com)
- **pbruvoll/tekkendocs**: [GitHub repository](https://github.com/pbruvoll/tekkendocs) for data structure reference

## 🎯 MVP Roadmap

### Phase 1: Setup ✅ (Complete)
- Next.js 15 with TypeScript
- Supabase integration
- UI components library

### Phase 2: UI Simplification (In Progress)
- [x] Remove Stage input
- [x] Remove Game Mode input  
- [x] Remove Match Analysis Summary
- [ ] Update types and AI prompts

### Phase 3: TekkenDocs Integration (Next)
- [ ] Research tekkendocs API structure
- [ ] Create TekkenDocs client service
- [ ] Implement database caching
- [ ] Integrate with existing components

### Phase 4: Structured AI (Priority)
- [ ] Create Zod validation schemas
- [ ] Implement structured prompts with frame data
- [ ] Add JSON response validation
- [ ] Replace Ollama with OpenAI/Claude

### Phase 5-8: Polish & Deploy
- Error handling & loading states
- Performance optimization & caching
- Testing (unit + integration)
- Documentation & deployment

## 🤝 Contributing

This project follows the SpecKit constitution for code quality and architecture. See [speckit.constitution.md](./speckit.constitution.md) for guidelines.

## 📖 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

**Built with ❤️ for the Tekken competitive community**
