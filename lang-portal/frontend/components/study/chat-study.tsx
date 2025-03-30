"use client"

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useLayoutEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { modelID } from "@/ai/providers";
import { Textarea } from "./chat-textarea";

interface ChatStudyProps {
    sessionId: string;
    onComplete: () => void;
}

export function ChatStudy({ sessionId, onComplete }: ChatStudyProps) {
    const [selectedModel, setSelectedModel] = useState<modelID>("llama-3.3-70b-versatile");
    const [isComplete, setIsComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat",
        body: {
            selectedModel
        }
    });

    // Using useLayoutEffect instead of useEffect for DOM manipulation
    // This runs synchronously after DOM mutations but before browser paint
    useLayoutEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleCompleteSession = () => {
        toast.success("Chat study session completed!");
        onComplete();
    }

    if (isComplete) {
        return (
            <div className="text-center py-8 space-y-4">
                <h3 className="text-xl font-bold">Session Complete!</h3>
                <p className="text-muted-foreground">
                    You've completed your language chat practice session.
                </p>
                <Button onClick={handleCompleteSession}>Finish Session</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-4 pt-6 pb-0">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    Start chatting to practice your language skills. The AI will respond in the language you're learning.
                                </p>
                            </div>
                        )}

                        {messages.map(m => (
                            <div
                                key={m.id}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`
                                        max-w-[80%] rounded-lg px-4 py-2
                                        ${m.role === 'user'
                                            ? 'bg-primary/10 text-foreground'
                                            : 'bg-muted text-foreground'}
                                    `}
                                >
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {m.role === 'user' ? 'You' : 'Language Tutor'}
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap">
                                        {m.content}
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
                </CardContent>

                <CardFooter className="border-t p-4 mt-auto">
                    <Textarea
                        input={input}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                    />
                </CardFooter>
            </Card>
        </div>
    )
}