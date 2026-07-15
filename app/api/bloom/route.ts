import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

let groqInstance: Groq | null = null;

const BLOOM_SYSTEM_PROMPT = `You are an expert in Bloom's Taxonomy for educational assessment.

Your task is to classify a given question into one of six Bloom's Taxonomy cognitive levels.

Before deciding, internally reason through these steps (do not output this reasoning):
Step 1: Identify the primary verb or action the question is asking the student to perform.
Step 2: Determine the actual cognitive operation required — is the student recalling a fact, explaining a concept, applying a method, breaking down/comparing information, making a judgment, or creating something new? Base this on what the student must DO, not just the surface keyword.
Step 3: Match that cognitive operation to the correct level below.

1 - Remember: Recall facts, terms, or basic concepts with no explanation required (keywords: define, list, recall, identify, name, state)
2 - Understand: Explain, summarize, or interpret a concept in the student's own words (keywords: explain, describe, summarize, classify, interpret, discuss)
3 - Apply: Use a known method, formula, or procedure to solve a new problem (keywords: solve, apply, calculate, demonstrate, use, implement)
4 - Analyze: Break down information, find relationships, or compare/contrast multiple elements (keywords: analyze, differentiate, examine, distinguish, compare, contrast)
5 - Evaluate: Make and justify a judgment, critique, or decision based on criteria (keywords: evaluate, assess, critique, judge, justify, argue, recommend)
6 - Create: Produce new, original work by combining elements in a novel way (keywords: design, construct, develop, formulate, create, compose, propose)

Important distinctions to avoid common misclassification:
- "Compare X and Y" → Analyze (4), NOT Understand, since it requires identifying relationships, not just explaining.
- "Explain how X works" → Understand (2), NOT Apply, since no new problem is being solved.
- "Calculate/Solve using formula Z" → Apply (3), even if the question also asks to "explain" the result, since the core task is procedural execution.
- A question with multiple verbs should be classified by the HIGHEST-order cognitive demand actually required to answer it correctly.

Respond with ONLY a single digit from 1 to 6. Do not include any explanation, text, reasoning, or punctuation. Just the number.`;

export async function POST(request: NextRequest) {
  try {
    const { questionText } = await request.json();

    if (!questionText || typeof questionText !== "string" || !questionText.trim()) {
      return NextResponse.json(
        { error: "Question text is required." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    if (!groqInstance) {
      groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    const completion = await groqInstance.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: BLOOM_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Classify this question into a Bloom's Taxonomy level (respond with ONLY 1, 2, 3, 4, 5, or 6):\n\n"${questionText.trim()}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 5,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const level = parseInt(raw);

    if (isNaN(level) || level < 1 || level > 6) {
      return NextResponse.json(
        { error: `Unexpected response from AI: "${raw}". Please try again.` },
        { status: 500 }
      );
    }

    return NextResponse.json({ bloomLevel: level.toString() });
  } catch (error: unknown) {
    console.error("[Bloom API Error]", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
