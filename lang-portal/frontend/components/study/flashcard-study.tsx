"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStudySessionWords } from "@/hooks/api/useStudySession"
import { Word } from "@/types/api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface FlashcardStudyProps {
    sessionId: string;
    onComplete: () => void;
}

export function FlashcardStudy({ sessionId, onComplete }: FlashcardStudyProps) {
    const { data: words, isLoading } = useStudySessionWords(sessionId)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [studiedWords, setStudiedWords] = useState<Set<string>>(new Set())

    const currentWord: Word | undefined = words?.[currentIndex]
    const isComplete = words && currentIndex >= words.length

    const handleNext = () => {
        if (currentWord) {
            setStudiedWords(prev => new Set(prev.add(currentWord.id)))
            setIsFlipped(false)
            setCurrentIndex(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            setIsFlipped(false)
        }
    }

    const handleComplete = () => {
        toast.success("Study session completed!")
        onComplete()
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[300px] w-full" />
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        )
    }

    if (!words || words.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No words available for study.</p>
            </div>
        )
    }

    if (isComplete) {
        return (
            <div className="text-center py-8 space-y-4">
                <h3 className="text-xl font-bold">Session Complete!</h3>
                <p className="text-muted-foreground">
                    You've studied {studiedWords.size} words in this session.
                </p>
                <Button onClick={handleComplete}>Finish Session</Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Card className="min-h-[300px] glass-card">
                <CardContent className="flex items-center justify-center min-h-[300px] cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}>
                    <div className="text-center p-4">
                        <p className="text-2xl font-bold mb-2">
                            {isFlipped ? currentWord.definition : currentWord.term}
                        </p>
                        {isFlipped && currentWord.examples && currentWord.examples.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-4 italic">
                                {currentWord.examples[0]}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                    >
                        Previous
                    </Button>
                    <Button onClick={handleNext}>
                        Next
                    </Button>
                </CardFooter>
            </Card>
            <div className="text-center text-sm text-muted-foreground">
                Card {currentIndex + 1} of {words.length}
            </div>
        </div>
    )
}