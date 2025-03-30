import { model, modelID } from "@/ai/providers";
import { streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    selectedModel = "llama-3.3-70b-versatile", // Default model if none provided
  }: { messages: UIMessage[]; selectedModel?: modelID } = await req.json();

  const result = streamText({
    model: model.languageModel(selectedModel),
    system: "You are a helpful language learning assistant. Respond in the language the user is practicing.",
    messages,
    experimental_telemetry: {
      isEnabled: true,
    },
  });

  return result.toDataStreamResponse({ sendReasoning: true });
}