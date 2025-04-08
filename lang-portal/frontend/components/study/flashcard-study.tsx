"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FlashcardOption {
    id: number
    english: string
    japanese: string
    romaji: string
    correct: boolean
}

interface Word {
    id: number
    english: string
    japanese: string
    romaji: string
}

interface Flashcard {
    word: Word
    options: FlashcardOption[]
}

interface FlashcardResponse {
    count: number
    flashcards: Flashcard[]
}

export function FlashcardStudy() {
    const [flashcards, setFlashcards] = useState<Flashcard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [cardLimit, setCardLimit] = useState<number>(3)
    const [showLimitSelector, setShowLimitSelector] = useState(false)
    const [score, setScore] = useState(0)

    const fetchFlashcards = async () => {
        try {
            const response = await fetch(`/api/langportal/flashcards/quiz?limit=${cardLimit}`)
            const data: FlashcardResponse = await response.json()
            setFlashcards(data.flashcards)
            setCurrentIndex(0)
            setSelectedOption(null)
            setIsCorrect(null)
            setShowLimitSelector(false)
            setScore(0)
        } catch (error) {
            console.error("Failed to fetch flashcards:", error)
        }
    }

    const handleOptionSelect = (optionId: number, correct: boolean) => {
        setSelectedOption(optionId)
        setIsCorrect(correct)
        if (correct) {
            setScore(prev => prev + 1)
        }

        // If correct, automatically move to next question
        if (correct && currentIndex < flashcards.length - 1) {
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1)
                setSelectedOption(null)
                setIsCorrect(null)
            }, 500)
        } else if (correct && currentIndex === flashcards.length - 1) {
            setTimeout(() => {
                setShowLimitSelector(true)
            }, 500)
        }
    }

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setSelectedOption(null)
            setIsCorrect(null)
        } else {
            setShowLimitSelector(true)
        }
    }

    if (showLimitSelector) {
        const scorePercentage = Math.round((score / flashcards.length) * 100)
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                    <CardContent className="flex-1 p-8">
                        <div className="flex flex-col items-center justify-center h-full space-y-8">
                            <h2 className="text-3xl font-bold">Great job! Want to continue?</h2>
                            <div className="text-center mb-6">
                                <p className="text-2xl font-semibold">Your Score: {score}/{flashcards.length}</p>
                                <p className="text-xl text-muted-foreground">{scorePercentage}% Correct</p>
                            </div>
                            <div className="space-y-4 w-full max-w-md">
                                <p className="text-center text-muted-foreground">Choose how many flashcards for the next round:</p>
                                <Select
                                    value={cardLimit.toString()}
                                    onValueChange={(value) => setCardLimit(parseInt(value))}
                                >
                                    <SelectTrigger className="w-full text-lg py-6">
                                        <SelectValue placeholder="Number of cards" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 cards</SelectItem>
                                        <SelectItem value="5">5 cards</SelectItem>
                                        <SelectItem value="10">10 cards</SelectItem>
                                        <SelectItem value="15">15 cards</SelectItem>
                                        <SelectItem value="20">20 cards</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={fetchFlashcards}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                                >
                                    Start New Quiz
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Fetch flashcards on first render
    if (flashcards.length === 0) {
        fetchFlashcards()
        return <div>Loading...</div>
    }

    const currentFlashcard = flashcards[currentIndex]

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <Card className="flex-1 glass-card flex flex-col h-full overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center px-4">
                        <p className="text-lg text-muted-foreground">
                            Question {currentIndex + 1} of {flashcards.length}
                        </p>
                        <p className="text-lg text-muted-foreground">
                            Cards: {cardLimit}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-4 sm:p-8">
                    <div className="flex flex-col h-full">
                        <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl sm:text-6xl font-bold mb-4">{currentFlashcard.word.japanese}</h2>
                                <p className="text-2xl sm:text-3xl text-muted-foreground">{currentFlashcard.word.romaji}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                {currentFlashcard.options.map((option) => (
                                    <Button
                                        key={option.id}
                                        className={`p-6 h-auto text-lg sm:text-2xl text-left justify-start transition-all duration-200 ${selectedOption !== null
                                                ? option.correct
                                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                                    : selectedOption === option.id
                                                        ? "bg-red-400 hover:bg-red-400 text-white"
                                                        : "opacity-70"
                                                : "hover:scale-102 hover:shadow-md"
                                            }`}
                                        variant="outline"
                                        onClick={() => handleOptionSelect(option.id, option.correct)}
                                        disabled={selectedOption !== null && !option.correct}
                                    >
                                        {option.english}
                                    </Button>
                                ))}
                            </div>
                            {selectedOption !== null && !isCorrect && (
                                <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                                    <h3 className="font-bold text-lg mb-2">Correct Answer:</h3>
                                    <p className="text-xl mb-6">{currentFlashcard.word.english}</p>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleNext}
                                            className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
                                        >
                                            {currentIndex < flashcards.length - 1 ? "Next Question" : "Complete Quiz"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}