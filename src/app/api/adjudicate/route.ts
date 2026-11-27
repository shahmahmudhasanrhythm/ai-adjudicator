import { NextResponse } from "next/server";
import { embed, generateText, generateObject, tool, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { evaluate } from "@/lib/safe-math";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY, 
});

// Initialize the Groq hardware pipeline
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model names live in env vars so a model retirement never needs a code change.
// (gemini-1.5-pro, the old Pro tier, has been shut down by Google.)
const GEMINI_FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash";
const GEMINI_PRO_MODEL = process.env.GEMINI_PRO_MODEL || "gemini-2.5-pro";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// The Magistrate's output format. Shared by the full debate and the
// single-model baseline so the benchmark compares like with like.
const verdictSchema = z.object({
  verdict: z.string().describe("A definitive 2-4 word final legal/technical ruling in all caps."),
  score: z.string().describe("A numeric score from 0 to 100 measuring final systemic viability (e.g., '85')."),
  chiefJusticeRuling: z.string().describe("A professional, multi-sentence executive summary explaining if the system can safely scale."),
  simulationParams: z.object({
    gravityMultiplier: z.number().describe("Float between 0.5 and 3.0 based on structural weight stress."),
    restitution: z.number().describe("Float between 0.1 and 1.0. Higher is more volatile/bouncy."),
    payloadDensity: z.number().describe("Float between 0.1 (light) and 2.0 (heavy armor).")
  }).describe("Physical stress testing parameters mapping structural mechanics onto the interactive frontend simulation node."),
  citations: z.array(z.object({
    sourceName: z.string().describe("The exact [DOCUMENT: Title] or [SECTION: Category] used as precedent."),
    relevance: z.string().describe("A highly specific 1-sentence technical quote or rationale extracted from the document."),
    confidence: z.number().describe("A logic confidence score (0-100) determining how strictly this source enforces the verdict."),
    // LLMs will happily invent plausible-looking links. Asking for an empty
    // string when unsure keeps the ledger honest; the UI already hides empty URLs.
    url: z.string().describe("An https:// URL that appeared in the knowledge base or search results for this source. If you are not certain the exact URL exists, return an empty string. Never guess a URL.")
  })).describe("The ledger of references used to justify the ruling.")
});

// Helper function to intercept API quota errors dynamically mid-pipeline
function handleGoogleError(error: any) {
  const errorString = error?.message || "";
  if (errorString.includes("429") || errorString.toLowerCase().includes("quota")) {
    return NextResponse.json({ 
      error: "System safety limit reached. Please retry in 30s" 
    }, { status: 429 });
  }
  return null;
}

export async function POST(req: Request) {
  try {
    // 1. EXTRACT ARGUMENT AND REQUESTED TIER
    // mode: "debate" (default, 4 agents) or "single" (one model, used as a benchmark baseline)
    const { argument, tier = 'plus', mode = 'debate' } = await req.json();

    if (!argument) {
      return NextResponse.json({ error: "No argument provided" }, { status: 400 });
    }

    // 2. CONFIGURE HARDWARE NODE & LOGIC LIMITS
    let modelConfig;
    switch(tier) {
      case 'lite':
        modelConfig = {
          model: groq(GROQ_MODEL),
          useTools: false, 
          maxSteps: 1,
        };
        break;
      case 'pro':
        modelConfig = {
          model: google(GEMINI_PRO_MODEL),
          useTools: true,
          maxSteps: 5,
        };
        break;
      case 'plus':
      default:
        modelConfig = {
          model: google(GEMINI_FLASH_MODEL),
          useTools: true,
          maxSteps: 2, 
        };
        break;
    }

    // ============================================================================
    // STEP 0: THE SUPABASE SLIDING WINDOW RATE LIMITER
    // ============================================================================
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

    const { data: logs, error: countError } = await supabase
      .from('api_logs')
      .select('created_at')
      .gte('created_at', oneMinuteAgo)
      .order('created_at', { ascending: true });

    if (countError) {
      console.error("Rate Limit DB Error:", countError);
      return NextResponse.json({ error: "Database verification failed" }, { status: 500 });
    }

    const SAFE_RUN_LIMIT = 2; 

    if (logs && logs.length >= SAFE_RUN_LIMIT) {
      const oldestRun = new Date(logs[0].created_at).getTime();
      const timeToWaitMs = (oldestRun + 60000) - Date.now();
      const secondsToWait = Math.ceil(timeToWaitMs / 1000);
      
      return NextResponse.json({ 
        error: `System safety limit reached. Please retry in ${secondsToWait}s`, 
      }, { status: 429 });
    }

    await supabase.from('api_logs').insert([{ created_at: new Date().toISOString() }]);

    // ============================================================================
    // THE KNOWLEDGE GRAPH (Active Vector Retrieval)
    // ============================================================================
    let embeddingResult;
    try {
      embeddingResult = await embed({
        model: google.textEmbeddingModel("gemini-embedding-2"), 
        value: argument,
        maxRetries: 0, 
      });
    } catch (err) {
      const quotaResponse = handleGoogleError(err);
      if (quotaResponse) return quotaResponse;
      throw err;
    }

    const { data: contextResults } = await supabase.rpc("match_knowledge", {
      query_embedding: embeddingResult.embedding,
      match_threshold: 0.6,
      match_count: 3, 
    });

    const knowledgeBase = contextResults && contextResults.length > 0 
      ? contextResults.map((r: any) => r.content).join("\n\n")
      : "No proprietary internal data found. Rely on rigorous generalized logic.";

    // ============================================================================
    // NEW: THE SIMULATION REGISTRY (Visual RAG Search)
    // ============================================================================
    const { data: simResults } = await supabase.rpc("match_simulation", {
      query_embedding: embeddingResult.embedding,
      match_threshold: 0.3, // Loose threshold to guarantee a visual match
      match_count: 1, 
    });
    
    // Extract the JSON blueprint if we found one
    const activeBlueprint = simResults && simResults.length > 0 ? simResults[0].blueprint_json : null;

    // ============================================================================
    // BASELINE MODE: one model, one call, same output format.
    // Lets the benchmark answer "does the 4-agent debate actually beat a single model?"
    // ============================================================================
    if (mode === "single") {
      let single;
      try {
        single = await generateObject({
          model: modelConfig.model,
          maxRetries: 0,
          system: `You are a senior engineering reviewer. Judge whether the proposal is physically and technically viable, using the knowledge base below where relevant.\n[KNOWLEDGE BASE]\n${knowledgeBase}`,
          prompt: `[PROPOSAL]\n${argument}`,
          schema: verdictSchema,
        });
      } catch (err) {
        const quotaResponse = handleGoogleError(err);
        if (quotaResponse) return quotaResponse;
        throw err;
      }
      return NextResponse.json({
        mode: "single",
        verdict: single.object.verdict,
        score: single.object.score,
        prosecutorCritique: "[SINGLE-MODEL BASELINE: no debate rounds were run]",
        chiefJusticeRuling: single.object.chiefJusticeRuling,
        simulationParams: single.object.simulationParams,
        blueprint: activeBlueprint,
        citations: single.object.citations,
      });
    }

    // ============================================================================
    // ROUND 1: THE PROSECUTOR 
    // ============================================================================
    let round1Prosecutor;
    try {
      round1Prosecutor = await generateText({
        model: modelConfig.model, 
        maxRetries: 0, 
        system: `You are the Lead Prosecutor for Verdict.AI. 
        Below is the absolute, unquestionable LAW (Proprietary Knowledge Base). 
        You must NOT attack the law. You must use the law as a weapon to attack the user's PROPOSAL.
        
        [THE LAW / KNOWLEDGE BASE]
        ${knowledgeBase}
        
        If the user's proposal deviates from, contradicts, or fails to meet the strict limits of The Law, expose it brutally. Limit to 1 dense paragraph.`,
        prompt: `[THE PROPOSAL TO ATTACK]\n${argument}`,
      });
    } catch (err) {
      const quotaResponse = handleGoogleError(err);
      if (quotaResponse) return quotaResponse;
      throw err;
    }

    // ============================================================================
    // ROUND 2: THE LOGICIAN 
    // ============================================================================
    let round2Logician;
    try {
      round2Logician = await generateText({
        model: modelConfig.model, 
        maxRetries: 0, 
        system: `You are the Expert Logician. Your job is to mathematically or logically patch the vulnerabilities exposed by the Prosecutor.
        You must base your fixes on THE LAW provided below:
        
        [THE LAW / KNOWLEDGE BASE]
        ${knowledgeBase}
        
        CRITICAL INSTRUCTIONS: 
        ${modelConfig.useTools 
          ? `1. You MUST use your 'engineering_calculator' tool to verify specific thermal loads, latency, or power adjustments. 
             2. If you need external specifications or context, use 'live_web_search'.
             3. If your live web search yields highly definitive technical metrics completely missing from THE LAW, you MUST use 'save_to_knowledge_graph'.`
          : `1. Use rigorous internal logic to estimate thermal loads, latency, or power adjustments since live tools are offline for this tier.`}
        4. You MUST explicitly write out the final numbers and the math behind them in your final response. Limit to 1 paragraph.`,
        prompt: `PROPOSAL: ${argument}\n\nPROSECUTOR CRITIQUE: ${round1Prosecutor.text}\n\nProvide the optimized engineering patches.`,
        
        ...(modelConfig.useTools ? {
          tools: {
            engineering_calculator: tool({
              description: "Evaluates mathematical expressions for thermal loads, latency limits, and power draw.",
              inputSchema: z.object({
                expression: z.string().describe('The math to evaluate (e.g., "15 * 0.6", "1000 / 20").'),
                reasoning: z.string().describe("Why this calculation is required."),
              }),
              execute: async ({ expression, reasoning }) => {
                console.log(`[AGENT TOOL] Computing: ${expression} | Reason: ${reasoning}`);
                try {
                  // SECURITY: evaluate() only understands arithmetic. The old
                  // `new Function(...)` ran any JavaScript the model wrote.
                  const result = evaluate(expression);
                  return `Math Result: ${result}`;
                } catch (e: any) {
                  return `Error calculating expression: ${e?.message ?? "invalid input"}`;
                }
              },
            }),
            live_web_search: tool({
              description: "Searches the live internet for real time data, hardware specs, or environmental constraints.",
              inputSchema: z.object({
                query: z.string().describe("The highly specific search query to execute."),
                rationale: z.string().describe("Why you need this live data to evaluate the proposal."),
              }),
              execute: async ({ query, rationale }) => {
                console.log(`[AGENT SEARCH] Scouring the web for: ${query} | Reason: ${rationale}`);
                try {
                  const response = await fetch(`https://api.tavily.com/search`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      api_key: process.env.TAVILY_API_KEY,
                      query: query,
                      search_depth: "advanced"
                    })
                  });
                  const data = await response.json();
                  return JSON.stringify(data.results);
                } catch (error) {
                  return "Search failed.";
                }
              },
            }),
            save_to_knowledge_graph: tool({
              description: "Permanently writes newly discovered technical facts directly into the core Supabase database.",
              inputSchema: z.object({
                title: z.string().describe("Clear, explicit title of the component or system constraint rulebook."),
                category: z.string().describe("The operational domain (e.g., Sensor Hardware, Edge Logistics)."),
                factToMemorize: z.string().describe("The dense technical fact discovered during web search that needs to be permanently memorized."),
              }),
              execute: async ({ title, category, factToMemorize }) => {
                console.log(`[SYNAPTOGENESIS] Agent is writing a new permanent memory: "${title}"`);
                try {
                  const { embedding } = await embed({
                    model: google.textEmbeddingModel("gemini-embedding-2"),
                    value: factToMemorize,
                    maxRetries: 0,
                  });
                  const formattedContent = `[DOCUMENT: ${title}] \n[SECTION: ${category}] \n[AUTONOMOUS INGESTION NODE]\n\n${factToMemorize}`;
                  await supabase.from("knowledge_graph").insert({ content: formattedContent, embedding: embedding });
                  return `Success: Fact structurally indexed to long-term memory.`;
                } catch (err: any) {
                  return `Failed to write fact to memory bank: ${err.message || err}`;
                }
              }
            }),
          },
          // AI SDK 5+ removed `maxSteps`; without `stopWhen` the loop stops after
          // ONE step, so the Logician could call a tool and never read the result.
          stopWhen: stepCountIs(modelConfig.maxSteps),
        } : {}),
      });
    } catch (err) {
      const quotaResponse = handleGoogleError(err);
      if (quotaResponse) return quotaResponse;
      throw err;
    }

    // If the Logician spent every step on tool calls, `.text` can be empty.
    const logicianText =
      round2Logician.text?.trim() ||
      "(The Logician used its full tool budget without writing a summary.)";

    // ============================================================================
    // ROUND 3: FINAL DEBATE & SYNTHESIS
    // ============================================================================
    let finalProsecution;
    try {
      finalProsecution = await generateText({
        model: modelConfig.model, 
        maxRetries: 0, 
        system: "You are the Prosecutor. Determine if the Logician's patches mitigate the risks or introduce new flaws. Limit to 1 paragraph.",
        prompt: `FIXES PROPOSED:\n${logicianText}\n\nIdentify any remaining or secondary flaws.`,
      });
    } catch (err) {
      const quotaResponse = handleGoogleError(err);
      if (quotaResponse) return quotaResponse;
      throw err;
    }

    // ============================================================================
    // ROUND 4: THE MAGISTRATE (Now with Citation Ledger & Clickable URLs)
    // ============================================================================
    let magistrate;
    try {
      magistrate = await generateObject({
        model: google(GEMINI_FLASH_MODEL),
        maxRetries: 0,
        system: `You are the Chief Magistrate for Verdict.AI. You evaluate the complete trial timeline and issue a final ruling. You MUST explicitly cite the original [DOCUMENT] sources from the KNOWLEDGE BASE provided earlier to justify your verdict.`,
        prompt: `ORIGINAL INTAKE: ${argument}\n\nPROSECUTION ATTACK: ${round1Prosecutor.text}\n\nLOGICIAN OPTIMIZATION: ${logicianText}\n\nFINAL RE-EXAMINATION: ${finalProsecution.text}`,
        schema: verdictSchema,
      });
    } catch (err) {
      const quotaResponse = handleGoogleError(err);
      if (quotaResponse) return quotaResponse;
      throw err;
    }

    return NextResponse.json({
      verdict: magistrate.object.verdict,
      score: magistrate.object.score,
      prosecutorCritique: `[PROSECUTION DISCOVERY]\n${round1Prosecutor.text}\n\n[RE-EXAMINATION DEBATE]\n${finalProsecution.text}`,
      chiefJusticeRuling: `[MAGISTRATE DIRECTIVE]\n${magistrate.object.chiefJusticeRuling}\n\n[PROPOSED REMEDIATION MATRIX]\n${logicianText}`,
      simulationParams: magistrate.object.simulationParams,
      blueprint: activeBlueprint,
      citations: magistrate.object.citations // <--- NEW: SENDING THE RECEIPTS TO THE UI
    });

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: error.message || "Tribunal Processing Failed" }, { status: 500 });
  }
}