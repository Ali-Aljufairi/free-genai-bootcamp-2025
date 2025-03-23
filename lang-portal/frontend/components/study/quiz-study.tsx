"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStudySessionWords } from "@/hooks/api/useStudySession"
import { Word } from "@/types/api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { shuffle } from "@/lib/utils"

interface QuizStudyProps {
    sessionId: string;
    onComplete: () => void;
}

interface QuizQuestion {
    word: Word;
    options: string[];
    answered?: string;
    isCorrect?: boolean;
}

export function QuizStudy({ sessionId, onComplete }: QuizStudyProps) {
    const { data: words, isLoading } = useStudySessionWords(sessionId)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [score, setScore] = useState({ correct: 0, total: 0 })

    // Generate quiz questions when words are loaded
    useMemo(() => {
        if (!words) return;

        const quizQuestions: QuizQuestion[] = words.map(word => {
            // Get 3 random wrong answers from other words
            const otherWords = words.filter(w => w.id !== word.id)
            const wrongAnswers = shuffle(otherWords)
                .slice(0, 3)
                .map(w => w.definition)

            // Add correct answer and shuffle options
            const options = shuffle([...wrongAnswers, word.definition])

            return {
                word,
                options,
            }
        })

        setQuestions(quizQuestions)
    }, [words])

    const currentQuestion = questions[currentIndex]
    const isComplete = questions.length > 0 && currentIndex >= questions.length

    const handleAnswer = (answer: string) => {
        const isCorrect = answer === currentQuestion.word.definition

        // Update question state
        setQuestions(prev => {
            const updated = [...prev]
            updated[currentIndex] = {
                ...currentQuestion,
                answered: answer,
                isCorrect,
            }
            return updated
        })

        // Update score
        if (isCorrect) {
            setScore(prev => ({ ...prev, correct: prev.correct + 1 }))
            toast.success("Correct answer!")
        } else {
            toast.error("Incorrect answer", {
                description: `The correct answer was: ${currentQuestion.word.definition}`,
            })
        }

        // Move to next question
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1)
            setScore(prev => ({ ...prev, total: prev.total + 1 }))
        }, 1500)
    }

    const handleComplete = () => {
        toast.success("Quiz completed!", {
            description: `Your score: ${score.correct}/${score.total}`,
        })
        onComplete()
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    if (!words || words.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No words available for quiz.</p>
            </div>
        )
    }

    if (isComplete) {
        return (
            <div className="text-center py-8 space-y-4">
                <h3 className="text-xl font-bold">Quiz Complete!</h3>
                <p className="text-lg">
                    Your score: <span className="font-bold">{score.correct}/{score.total}</span>
                </p>
                <p className="text-muted-foreground">
                    {score.correct === score.total
                        ? "Perfect score! Amazing work!"
                        : "Keep practicing to improve your score!"}
                </p>
                <Button onClick={handleComplete}>Finish Quiz</Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Question {currentIndex + 1} of {questions.length}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl font-bold text-center p-4">
                        {currentQuestion.word.term}
                    </p>
                    <div className="grid gap-2">
                        {currentQuestion.options.map((option, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                className="w-full text-left h-auto py-4 px-6"
                                onClick={() => handleAnswer(option)}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground w-full text-center">
                        Score: {score.correct}/{score.total}
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}