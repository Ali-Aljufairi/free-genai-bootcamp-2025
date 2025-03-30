import { groq } from "@ai-sdk/groq";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

// custom provider with different model settings:
export const model = customProvider({
  languageModels: {
    "llama-3.1-8b-instant": groq("llama-3.1-8b-instant"),
    "deepseek-r1-distill-llama-70b": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: groq("deepseek-r1-distill-llama-70b"),
    }),
    "llama-3.3-70b-versatile": groq("llama-3.3-70b-versatile"),
  },
});

export type modelID = Parameters<(typeof model)["languageModel"]>["0"];