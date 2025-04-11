import { model } from "@/ai/providers";
import { systemPrompts } from "@/ai/prompts";
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { transcript }: { transcript: string } = await req.json();

  console.log('Received transcript:', transcript);

  const systemPromptText = systemPrompts["speech-analysis-japanese"].replace("{transcript}", transcript);
  console.log('Using system prompt:', systemPromptText);

  const result = generateText({
    model: model.languageModel("llama-3.3-70b-versatile"),
    system: systemPromptText,
    messages: [{ role: "user", content: transcript }],
    experimental_telemetry: {
      isEnabled: true,
    },
  });

  const analysisText = await result;
  
  return NextResponse.json({ 
    analysis: analysisText.text,
    success: true 
  });
}