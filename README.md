# Verdict.AI: a multi-agent adjudicator for engineering proposals

Verdict.AI takes a technical proposal (for example "run a sensor network on 5 W solar panels in the Sahara") and puts it on trial. Four LLM agents argue over it in sequence, check it against a knowledge base, and return a scored verdict with citations.

> 📸 *Add a screenshot or GIF of the dashboard here: `docs/demo.gif`*
> 🔗 *Live demo: add your Vercel URL here*

## How it works

```
Proposal ──► Embed (Gemini) ──► Retrieve rules from Supabase vector store
                                   │
   ┌───────────────────────────────┘
   ▼
1. Prosecutor   attacks the proposal using the retrieved rules
2. Logician     patches the flaws, with tools:
                  • calculator (checks the numbers)
                  • live web search (Tavily)
                  • save_to_knowledge_graph (writes new facts back to the vector store)
3. Rebuttal     the prosecutor checks whether the fixes add new flaws
4. Magistrate   returns a structured verdict: ruling, 0–100 score, citation ledger with URLs
```

## Features

- **Retrieval-augmented generation** over a Supabase vector store (`match_knowledge` RPC)
- **Self-updating knowledge base**: the agent can store facts it finds on the web
- **Three model tiers:** Lite (Llama 3.3 70B via Groq, no tools), Plus (Gemini 2.5 Flash), Pro (Gemini 2.5 Pro, up to 5 tool steps); model names are set in `.env.local`
- **Structured output** validated with Zod
- **Sliding-window rate limiter** backed by Supabase
- **Login-protected API**: only signed-in users can run the tribunal or add knowledge
- **Safe calculator tool**: a hand-written arithmetic parser, with unit tests
- **Physics visualisation** (matter.js) driven by the verdict's simulation parameters
- **Supabase authentication**

## Tech stack

Next.js 16 · React 19 · TypeScript · Vercel AI SDK · Supabase (Postgres + vector search + auth) · Google Gemini · Groq · Tavily · Tailwind CSS · shadcn/ui · matter.js

## Run it locally

```bash
git clone https://github.com/shahmahmudhasanrhythm/ai-adjudicator
cd ai-adjudicator
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

See [`.env.example`](.env.example) for every setting.


Create the database tables by running [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor, then seed the physics scenes with `node scripts/seed_simulations.mjs`.

## Tests and benchmark

```bash
npm test                                          # unit tests for the safe calculator
npm run benchmark -- --mode debate --tier plus    # 20 proposals with known answers
npm run benchmark -- --mode single --tier plus    # same 20, single-model baseline
npm run benchmark -- --summary                    # compare the runs
```

The benchmark ([`benchmark/proposals.json`](benchmark/proposals.json)) has 10 proposals with a clear physical flaw (a 20 W panel running a 50 W load all night, a 70B model in 24 GB of memory) and 10 sound ones. It reports accuracy, how often the written reasoning names the real flaw, and false alarms. It answers the question this project rests on: **does a 4-agent debate catch more flaws than a single model?**

| Run | Accuracy | Flaw recall | False alarms | Mean latency |
|---|---|---|---|---|
| debate / plus | *run it* | | | |
| single / plus | *run it* | | | |

## What I learned

*(Write 3–4 honest lines here, e.g. what broke when moving to Vercel, why you added the Groq tier, what you'd change.)*

## Roadmap

- [x] Safe arithmetic parser instead of `new Function()`
- [x] Benchmark with known answers + single-model baseline
- [x] Supabase schema committed
- [ ] Per-user rate limits (add `user_id` to `api_logs`)
- [ ] Grow the benchmark to 100 cases and try other judge models
