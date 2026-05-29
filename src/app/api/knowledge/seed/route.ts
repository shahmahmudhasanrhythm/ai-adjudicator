import { NextResponse } from "next/server";
import { embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { supabase } from "@/lib/supabase";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// --- CORE PIPELINE CONFIGURATION ---
const CHUNK_SIZE = 1000;      // Target character length per knowledge node
const CHUNK_OVERLAP = 200;    // Contextual sliding window overlap size
const GEMINI_BATCH_SIZE = 5;  // Maximum concurrent embedding requests allowed

/**
 * High-Fidelity Recursive Text Splitter
 * Preserves paragraphs, sentences, and structural boundaries.
 */
function splitTextRecursively(text: string, maxLength: number, overlap: number): string[] {
  const chunks: string[] = [];
  let currentIndex = 0;

  // Clean raw line breaks and normalization
  const normalizedText = text.replace(/\r\n/g, "\n").trim();

  while (currentIndex < normalizedText.length) {
    let endIndex = currentIndex + maxLength;
    
    if (endIndex >= normalizedText.length) {
      chunks.push(normalizedText.substring(currentIndex));
      break;
    }

    // Attempt to find a natural clean break point within the window
    const lookbackZone = normalizedText.substring(currentIndex, endIndex);
    let splitPoint = lookbackZone.lastIndexOf("\n\n"); // Paragraph Break

    if (splitPoint === -1 || splitPoint < maxLength * 0.5) {
      splitPoint = lookbackZone.lastIndexOf("\n"); // Line Break
    }
    if (splitPoint === -1 || splitPoint < maxLength * 0.5) {
      splitPoint = lookbackZone.lastIndexOf(". "); // Sentence End
    }
    if (splitPoint === -1 || splitPoint < maxLength * 0.5) {
      splitPoint = lookbackZone.lastIndexOf(" "); // Word Break
    }

    // Absolute fallback if no clean structural split point is discovered
    const finalSplit = (splitPoint !== -1 && splitPoint > 0) ? currentIndex + splitPoint : endIndex;

    chunks.push(normalizedText.substring(currentIndex, finalSplit).trim());
    
    // Shift index backward by the overlap target to retain logical context
    currentIndex = finalSplit - overlap;
    
    // Safety guard to guarantee forward progression
    if (currentIndex <= finalSplit - maxLength) {
      currentIndex = finalSplit;
    }
  }

  return chunks.filter(chunk => chunk.length > 10);
}

export async function POST(req: Request) {
  try {
    const { title, rawText, category } = await req.json();

    if (!rawText || !title) {
      return NextResponse.json({ error: "Missing required document payloads (title, rawText)." }, { status: 400 });
    }

    console.log(`[INGESTION START] Processing document: "${title}"`);

    // 1. Execute Recursive Chunking
    const textChunks = splitTextRecursively(rawText, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`[INGESTION] Document successfully tokenized into ${textChunks.length} distinct context blocks.`);

    const recordsToInsert = [];

    // 2. Controlled Batch Embedding Generation (Concurrency Protection)
    for (let i = 0; i < textChunks.length; i += GEMINI_BATCH_SIZE) {
      const currentBatch = textChunks.slice(i, i + GEMINI_BATCH_SIZE);
      
      // Execute embedding calls in parallel sets
      const embeddingPromises = currentBatch.map(async (chunkText, index) => {
        try {
          const { embedding } = await embed({
            model: google.textEmbeddingModel("gemini-embedding-2"), // <-- FIX applied here
            value: chunkText,
          });
          
          // Construct explicit context metadata string inside the database row
          const enrichedContent = `[DOCUMENT: ${title}] \n[SECTION: ${category || "General Logic"}] \n[NODE REF: ${i + index + 1}/${textChunks.length}]\n\n${chunkText}`;
          
          return {
            content: enrichedContent,
            embedding: embedding
          };
        } catch (embedError) {
          console.error(`Error calculating embedding for chunk ${i + index}:`, embedError);
          return null;
        }
      });

      const batchResults = await Promise.all(embeddingPromises);
      
      // Filter out any transient API failures
      for (const res of batchResults) {
        if (res) recordsToInsert.push(res);
      }

      console.log(`[PROGRESS] Generated embeddings for node array: ${recordsToInsert.length}/${textChunks.length}`);
    }

    if (recordsToInsert.length === 0) {
      throw new Error("Failed to compile any valid vector representations.");
    }

    // 3. High-Speed Bulk Database Ingestion
    console.log("[DATABASE] Uploading vector payload to Supabase knowledge_graph...");
    const { error: dbError } = await supabase
      .from("knowledge_graph")
      .insert(recordsToInsert);

    if (dbError) {
      throw dbError;
    }

    console.log(`[SUCCESS] Ingestion pipeline complete. ${recordsToInsert.length} nodes added to Knowledge Graph.`);

    return NextResponse.json({
      success: true,
      message: `Successfully structured and ingested ${recordsToInsert.length} knowledge graph nodes.`,
    });

  } catch (error: any) {
    console.error("[CRITICAL PIPELINE FAILURE]:", error);
    return NextResponse.json({ 
      error: "Ingestion Pipeline Failed", 
      details: error.message || error 
    }, { status: 500 });
  }
}