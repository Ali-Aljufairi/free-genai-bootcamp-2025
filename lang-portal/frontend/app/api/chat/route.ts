import { model, modelID } from "@/ai/providers";
import { systemPrompts, SystemPromptID, defaultPrompt } from "@/ai/prompts";
import { streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    selectedModel = "llama-3.3-70b-versatile", // Default model if none provided
    selectedPrompt = defaultPrompt, // Default prompt if none provided
  }: { 
    messages: UIMessage[]; 
    selectedModel?: modelID;
    selectedPrompt?: SystemPromptID;
  } = await req.json();

  // Get the system prompt text based on the selected prompt ID
  const systemPromptText = systemPrompts[selectedPrompt];

  const result = streamText({
    model: model.languageModel(selectedModel),
    system: systemPromptText,
    messages,
    experimental_telemetry: {
      isEnabled: true,
    },
  });

  return result.toDataStreamResponse({ sendReasoning: true });
}