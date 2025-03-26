"use client"

import { useRouter } from "next/navigation"
import { FlashcardStudy } from "@/components/study/flashcard-study"
import { QuizStudy } from "@/components/study/quiz-study"
import { DrawingStudy } from "@/components/study/drawing-study"
import React from "react"

export default function StudySessionPage({
    params
}: {
    params: { type: string; id: string }
}) {
    // Use React.use to unwrap the params promise
    const { type, id } = React.use(params)

    const router = useRouter()

    const handleComplete = () => {
        router.push("/dashboard")
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Study Session</h1>
            </div>

            {type === "flashcards" && (
                <FlashcardStudy sessionId={id} onComplete={handleComplete} />
            )}

            {type === "quiz" && (
                <QuizStudy sessionId={id} onComplete={handleComplete} />
            )}

            {type === "drawing" && (
                <DrawingStudy />
            )}
        </div>
    )
}