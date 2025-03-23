"use client"

import { useRouter } from "next/navigation"
import { useStudySession } from "@/hooks/api/useStudySession"
import { FlashcardStudy } from "@/components/study/flashcard-study"
import { QuizStudy } from "@/components/study/quiz-study"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudySessionPage({
    params: { type, id }
}: {
    params: { type: string; id: string }
}) {
    const router = useRouter()
    const { data: session, isLoading } = useStudySession(id)

    const handleComplete = () => {
        router.push("/dashboard")
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Session Not Found</h1>
                    <p className="text-muted-foreground">This study session doesn't exist or has been deleted.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{session.name}</h1>
                <p className="text-muted-foreground">{session.description}</p>
            </div>

            {type === "flashcards" && (
                <FlashcardStudy sessionId={id} onComplete={handleComplete} />
            )}

            {type === "quiz" && (
                <QuizStudy sessionId={id} onComplete={handleComplete} />
            )}

            {type === "free" && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Free study mode is coming soon!</p>
                </div>
            )}
        </div>
    )
}