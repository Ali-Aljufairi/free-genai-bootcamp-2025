import { modelID } from "@/ai/providers";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
    input: string;
    handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    selectedModel: modelID;
    setSelectedModel: (model: modelID) => void;
}

export function ChatInput({
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    selectedModel,
    setSelectedModel,
}: ChatInputProps) {
    const [showModelPicker, setShowModelPicker] = useState(false);

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full pt-4">
                <ShadcnTextarea
                    className="resize-none bg-secondary w-full rounded-2xl pr-12 pt-4 pb-12 border focus-visible:ring-1 focus-visible:ring-primary"
                    value={input}
                    autoFocus
                    placeholder="Type your message..."
                    // @ts-expect-error err
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim() && !isLoading) {
                                // @ts-expect-error err
                                const form = e.target.closest("form");
                                if (form) form.requestSubmit();
                            }
                        }
                    }}
                    onClick={() => setShowModelPicker(false)}
                />

                <div className="absolute left-2 bottom-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowModelPicker(!showModelPicker);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                    >
                        {selectedModel.split('-')[0].charAt(0).toUpperCase() + selectedModel.split('-')[0].slice(1)} ▾
                    </button>

                    {showModelPicker && (
                        <div className="absolute bottom-10 left-0 bg-background border border-border rounded-md p-2 z-10 w-[200px] shadow-md">
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedModel("llama-3.3-70b-versatile");
                                        setShowModelPicker(false);
                                    }}
                                    className={`w-full text-left text-xs px-2 py-1 rounded-md ${selectedModel === "llama-3.3-70b-versatile" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
                                >
                                    Llama 3.3 70B (Best Quality)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedModel("llama-3.1-8b-instant");
                                        setShowModelPicker(false);
                                    }}
                                    className={`w-full text-left text-xs px-2 py-1 rounded-md ${selectedModel === "llama-3.1-8b-instant" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
                                >
                                    Llama 3.1 8B (Faster)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedModel("deepseek-r1-distill-llama-70b");
                                        setShowModelPicker(false);
                                    }}
                                    className={`w-full text-left text-xs px-2 py-1 rounded-md ${selectedModel === "deepseek-r1-distill-llama-70b" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
                                >
                                    DeepSeek R1 70B
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 bottom-2 rounded-full p-2 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <div className="animate-spin h-4 w-4">
                            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        </div>
                    ) : (
                        <ArrowUp className="h-4 w-4 text-white" />
                    )}
                </button>
            </div>
        </form>
    );
}