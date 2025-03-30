"use client"

import { useChat } from '@ai-sdk/react';
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { modelID } from "@/ai/providers";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";

interface ChatProps {
    sessionId: string;
    onComplete: () => void;
}

export function Chat({ sessionId, onComplete }: ChatProps) {
    const [selectedModel, setSelectedModel] = useState<modelID>("llama-3.3-70b-versatile");
    const [isComplete, setIsComplete] = useState(false);
    
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat",
        body: {
            selectedModel
        }
    });

    const handleCompleteSession = () => {
        toast.success("Chat session completed!");
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
            <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardContent className="flex-1 overflow-y-auto p-4 pt-6 pb-0">
                    <ChatMessages messages={messages} isLoading={isLoading} />
                </CardContent>

                <CardFooter className="border-t p-4 mt-auto">
                    <ChatInput
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