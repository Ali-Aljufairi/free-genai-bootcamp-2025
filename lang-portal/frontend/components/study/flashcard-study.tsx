"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/components/ui/use-mobile"

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
    const isMobile = useIsMobile()
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
            // Automatically advance to next question after a brief delay when correct
            setTimeout(() => {
                if (currentIndex < flashcards.length - 1) {
                    setCurrentIndex(currentIndex + 1)
                    setSelectedOption(null)
                    setIsCorrect(null)
                } else {
                    setShowLimitSelector(true)
                }
            }, 300) // short delay to show feedback
        }
        // When incorrect, do nothing - let user manually proceed
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
            <div className="flex flex-col min-h-[calc(100vh-8rem)]">
                <Card className="flex-1 glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                    <CardContent className={isMobile ? "p-4" : "p-8"}>
                        <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-center mb-6"
                            >
                                <h2 className={isMobile ? "text-2xl font-bold mb-3" : "text-4xl font-bold mb-4"}>
                                    Great job! Want to continue?
                                </h2>
                                <p className={isMobile ? "text-xl font-semibold mb-1" : "text-3xl font-semibold mb-2"}>
                                    Your Score: {score}/{flashcards.length}
                                </p>
                                <p className={isMobile ? "text-lg" : "text-2xl"} style={{ color: "var(--muted-foreground)" }}>
                                    {scorePercentage}% Correct
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="w-full space-y-3"
                            >
                                <p className={`text-center ${isMobile ? "text-base" : "text-lg"}`} style={{ color: "var(--muted-foreground)" }}>
                                    Choose cards for next round:
                                </p>
                                <Select
                                    value={cardLimit.toString()}
                                    onValueChange={(value) => setCardLimit(parseInt(value))}
                                >
                                    <SelectTrigger className={`w-full ${isMobile ? "text-base p-4" : "text-lg p-6"}`}>
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
                                    className={`w-full bg-blue-600 hover:bg-blue-700 ${isMobile ? "text-lg h-12" : "text-xl h-14"
                                        }`}
                                >
                                    Start New Quiz
                                </Button>
                            </motion.div>
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

    // Different layouts for mobile and desktop
    if (isMobile) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-8rem)]">
                <Card className="flex-1 glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                    <CardHeader className="border-b py-2 px-3">
                        <div className="flex justify-between items-center">
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                Question {currentIndex + 1} of {flashcards.length}
                            </p>
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                Score: {score}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-center mb-4"
                        >
                            <h2 className="text-3xl font-bold mb-1">{currentFlashcard.word.japanese}</h2>
                            <p className="text-xl" style={{ color: "var(--muted-foreground)" }}>{currentFlashcard.word.romaji}</p>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-2">
                            {currentFlashcard.options.map((option, index) => (
                                <motion.div
                                    key={option.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Button
                                        className={`w-full p-4 h-auto text-lg text-center justify-center transition-all duration-200 active:scale-98 touch-manipulation ${selectedOption !== null
                                            ? option.correct
                                                ? "bg-green-500 hover:bg-green-600 text-white"
                                                : selectedOption === option.id
                                                    ? "bg-red-400 hover:bg-red-400 text-white"
                                                    : "opacity-70"
                                            : "hover:bg-accent"
                                            }`}
                                        variant="outline"
                                        onClick={() => handleOptionSelect(option.id, option.correct)}
                                        disabled={selectedOption !== null}
                                    >
                                        {option.english}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Desktop layout
    return (
        <div className="flex flex-col min-h-[calc(100vh-8rem)]">
            <Card className="flex-1 glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardHeader className="border-b py-4 px-8">
                    <div className="flex justify-between items-center">
                        <p className="text-lg" style={{ color: "var(--muted-foreground)" }}>
                            Question {currentIndex + 1} of {flashcards.length}
                        </p>
                        <p className="text-lg" style={{ color: "var(--muted-foreground)" }}>
                            Score: {score}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-12">
                    <div className="flex flex-col h-full max-w-6xl mx-auto">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-7xl font-bold mb-4">{currentFlashcard.word.japanese}</h2>
                            <p className="text-3xl" style={{ color: "var(--muted-foreground)" }}>{currentFlashcard.word.romaji}</p>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-8">
                            {currentFlashcard.options.map((option, index) => (
                                <motion.div
                                    key={option.id}
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Button
                                        className={`w-full p-8 h-auto text-2xl text-center justify-center transition-all duration-200 ${selectedOption !== null
                                            ? option.correct
                                                ? "bg-green-500 hover:bg-green-600 text-white"
                                                : selectedOption === option.id
                                                    ? "bg-red-400 hover:bg-red-400 text-white"
                                                    : "opacity-70"
                                            : "hover:bg-accent hover:scale-102"
                                            }`}
                                        variant="outline"
                                        onClick={() => handleOptionSelect(option.id, option.correct)}
                                        disabled={selectedOption !== null}
                                    >
                                        {option.english}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>

                        <AnimatePresence>
                            {selectedOption !== null && !isMobile && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="mt-12 flex justify-center"
                                >
                                    <Button
                                        onClick={handleNext}
                                        className="bg-blue-600 hover:bg-blue-700 text-2xl font-medium px-24 h-20 min-w-[300px]"
                                    >
                                        {currentIndex < flashcards.length - 1 ? "Next Question" : "Complete Quiz"}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}