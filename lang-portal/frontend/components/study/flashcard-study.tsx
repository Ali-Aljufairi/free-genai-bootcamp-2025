"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Switch } from "@/components/ui/switch"

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

interface Answer {
    wordId: number
    correct: boolean
}

export function FlashcardStudy() {
    const isMobile = useIsMobile()
    const [flashcards, setFlashcards] = useState<Flashcard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [cardLimit, setCardLimit] = useState<number>(-1) // -1 represents "All Words"
    const [level, setLevel] = useState<number>(5)
    const [showRomaji, setShowRomaji] = useState(true)
    const [showIncorrectRomaji, setShowIncorrectRomaji] = useState(false)
    const [showConfig, setShowConfig] = useState(true)
    const [score, setScore] = useState(0)
    const [answers, setAnswers] = useState<Answer[]>([])

    const fetchFlashcards = async () => {
        try {
            const response = await fetch(`/api/langportal/flashcards/quiz?limit=${cardLimit}&level=${level}`)
            const data: FlashcardResponse = await response.json()
            setFlashcards(data.flashcards)
            setCurrentIndex(0)
            setSelectedOption(null)
            setIsCorrect(null)
            setScore(0)
            setAnswers([])
            setShowConfig(false)
        } catch (error) {
            console.error("Failed to fetch flashcards:", error)
        }
    }

    const submitQuizAnswers = async () => {
        try {
            const response = await fetch('/api/langportal/flashcards/submit-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answers }),
            })

            if (!response.ok) {
                throw new Error('Failed to submit quiz answers')
            }

            setShowConfig(true)
        } catch (error) {
            console.error("Failed to submit quiz answers:", error)
        }
    }

    const handleOptionSelect = (optionId: number, correct: boolean) => {
        setSelectedOption(optionId)
        setIsCorrect(correct)
        if (!correct) {
            setShowIncorrectRomaji(true)
        }

        setAnswers(prev => [...prev, {
            wordId: flashcards[currentIndex].word.id,
            correct
        }])

        if (correct) {
            setScore(prev => prev + 1)
            setTimeout(() => {
                if (currentIndex < flashcards.length - 1) {
                    setCurrentIndex(currentIndex + 1)
                    setSelectedOption(null)
                    setIsCorrect(null)
                    setShowIncorrectRomaji(false)
                } else {
                    submitQuizAnswers()
                }
            }, 300)
        }
    }

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setSelectedOption(null)
            setIsCorrect(null)
            setShowIncorrectRomaji(false)
        } else {
            submitQuizAnswers()
        }
    }

    // Show configuration screen
    if (showConfig) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-8rem)]">
                <Card className="flex-1 glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <CardContent className={`${isMobile ? "p-4" : "p-8"} w-full max-w-lg`}>
                        <div className="flex flex-col items-center justify-center space-y-8">
                            <div className="text-center mb-6">
                                <h2 className={isMobile ? "text-2xl font-bold mb-3" : "text-4xl font-bold mb-4"}>
                                    {score > 0 ? "Great job! Want to continue?" : "Configure Your Flashcards"}
                                </h2>
                                {score > 0 && (
                                    <div>
                                        <p className={isMobile ? "text-xl font-semibold mb-1" : "text-3xl font-semibold mb-2"}>
                                            Your Score: {score}/{flashcards.length}
                                        </p>
                                        <p className={isMobile ? "text-lg" : "text-2xl"} style={{ color: "var(--muted-foreground)" }}>
                                            {Math.round((score / flashcards.length) * 100)}% Correct
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="w-full space-y-6">
                                <div className="space-y-2">
                                    <p className={`text-center ${isMobile ? "text-base" : "text-lg"}`} style={{ color: "var(--muted-foreground)" }}>
                                        Select difficulty level:
                                    </p>
                                    <Select
                                        value={level.toString()}
                                        onValueChange={(value) => setLevel(parseInt(value))}
                                    >
                                        <SelectTrigger className={`w-full ${isMobile ? "text-base p-4" : "text-lg p-6"}`}>
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">Level 5 (Beginner)</SelectItem>
                                            <SelectItem value="4">Level 4</SelectItem>
                                            <SelectItem value="3">Level 3</SelectItem>
                                            <SelectItem value="2">Level 2</SelectItem>
                                            <SelectItem value="1">Level 1 (Advanced)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <p className={`text-center ${isMobile ? "text-base" : "text-lg"}`} style={{ color: "var(--muted-foreground)" }}>
                                        Number of cards:
                                    </p>
                                    <Select
                                        value={cardLimit.toString()}
                                        onValueChange={(value) => setCardLimit(parseInt(value))}
                                    >
                                        <SelectTrigger className={`w-full ${isMobile ? "text-base p-4" : "text-lg p-6"}`}>
                                            <SelectValue placeholder="Number of cards" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="-1">All Words</SelectItem>
                                            <SelectItem value="3">3 cards</SelectItem>
                                            <SelectItem value="5">5 cards</SelectItem>
                                            <SelectItem value="10">10 cards</SelectItem>
                                            <SelectItem value="15">15 cards</SelectItem>
                                            <SelectItem value="20">20 cards</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className={`${isMobile ? "text-base" : "text-lg"}`} style={{ color: "var(--muted-foreground)" }}>
                                        Show romaji:
                                    </p>
                                    <Switch
                                        checked={showRomaji}
                                        onCheckedChange={setShowRomaji}
                                    />
                                </div>

                                <Button
                                    onClick={fetchFlashcards}
                                    className={`w-full bg-blue-600 hover:bg-blue-700 ${isMobile ? "text-lg h-12" : "text-xl h-14"}`}
                                >
                                    Start Quiz
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (flashcards.length === 0) {
        fetchFlashcards()
        return <div>Loading...</div>
    }

    const currentFlashcard = flashcards[currentIndex]

    // Mobile layout
    if (isMobile) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-8rem)]">
                <Card className="flex-1 glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                    <CardHeader className="border-b py-3 px-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                Question {currentIndex + 1} of {flashcards.length}
                            </p>
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                Score: {score}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-6">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-center mb-2"
                        >
                            <h2 className="text-3xl font-bold mb-2">{currentFlashcard.word.japanese}</h2>
                            {(showRomaji || showIncorrectRomaji) && (
                                <p className="text-xl" style={{ color: "var(--muted-foreground)" }}>{currentFlashcard.word.romaji}</p>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 gap-9">
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

                        <AnimatePresence>
                            {selectedOption !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="mt-2"
                                >
                                    <Button
                                        onClick={handleNext}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                                    >
                                        {currentIndex < flashcards.length - 1 ? "Next Question" : "Complete Quiz"}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                            {(showRomaji || showIncorrectRomaji) && (
                                <p className="text-3xl" style={{ color: "var(--muted-foreground)" }}>
                                    {currentFlashcard.word.romaji}
                                </p>
                            )}
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