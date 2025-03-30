import { UIMessage } from "ai";
import { Skeleton } from "@/components/ui/skeleton";
import { useLayoutEffect, useRef } from "react";

interface ChatMessageProps {
    messages: UIMessage[];
    isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessageProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Using useLayoutEffect instead of useEffect for DOM manipulation
    // This runs synchronously after DOM mutations but before browser paint
    useLayoutEffect(() => {
        // Scroll to bottom whenever messages or loading state changes
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    return (
        <div className="space-y-4 py-4">
            {messages.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">
                        Start chatting to practice your language skills. The AI will respond in the language you're learning.
                    </p>
                </div>
            )}

            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className={`
              max-w-[80%] rounded-lg px-4 py-2
              ${message.role === "user"
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted text-foreground"
                            }
            `}
                    >
                        <div className="text-xs text-muted-foreground mb-1">
                            {message.role === "user" ? "You" : "Language Tutor"}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                        </div>
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                        <Skeleton className="h-4 w-[200px] mb-2" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
        </div>
    );
}