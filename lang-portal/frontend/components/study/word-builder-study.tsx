"use client"

// Core drag and drop components
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
// Drag and drop types
import type {
    DropResult,
    DroppableProvided,
    DraggableProvided,
    DroppableStateSnapshot,
    DraggableStateSnapshot
} from '@hello-pangea/dnd'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface WordBuilderStudyProps {
    sessionId?: string;
    onComplete?: () => void;
}

interface Compound {
    word: string;
    reading: string;
    meaning: string;
    targetPosition: number;
    otherKanji: Array<{
        kanji: string;
        position: number;
    }>;
}

export function WordBuilderStudy({ sessionId, onComplete }: WordBuilderStudyProps) {
    const [level, setLevel] = useState("N5")
    const [isLoading, setIsLoading] = useState(false)
    const [targetKanji, setTargetKanji] = useState<string>("")
    const [compounds, setCompounds] = useState<Compound[]>([])
    const [validKanji, setValidKanji] = useState<string[]>([])
    const [currentWord, setCurrentWord] = useState<string[]>([])
    const [discoveredWords, setDiscoveredWords] = useState<Set<string>>(new Set())
    const [availablePositions, setAvailablePositions] = useState<number[]>([])

    const fetchRandomKanji = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/langportal/jlpt/${level}/random-kanji`)
            if (!response.ok) throw new Error("Failed to fetch kanji")

            const data = await response.json()
            setTargetKanji(data.kanji)
            setCompounds(data.compounds)
            setValidKanji(data.validKanji)
            setCurrentWord(new Array(2).fill("")) // Reset current word
            setDiscoveredWords(new Set())

            // Find all possible positions for the target kanji
            const positions = data.compounds.map((c: Compound) => c.targetPosition)
            setAvailablePositions(Array.from(new Set(positions)).map(p => Number(p)))

            // Place target kanji in first position initially
            const newWord = new Array(2).fill("")
            newWord[0] = data.kanji
            setCurrentWord(newWord)

        } catch (error) {
            toast.error("Failed to fetch kanji", {
                description: error instanceof Error ? error.message : "Please try again"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRandomKanji()
    }, [level])

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return

        const { source, destination } = result
        const newWord = [...currentWord]

        if (source.droppableId === "kanji-list") {
            // Dragging from kanji list to word builder
            const sourceIndex = source.index
            const destIndex = parseInt(destination.droppableId.split("-")[1])
            newWord[destIndex] = validKanji[sourceIndex]
        } else if (source.droppableId.startsWith("position-")) {
            // Moving within word builder
            const sourceIndex = parseInt(source.droppableId.split("-")[1])
            const destIndex = parseInt(destination.droppableId.split("-")[1])
            newWord[destIndex] = currentWord[sourceIndex]
            newWord[sourceIndex] = ""
        }

        setCurrentWord(newWord)

        // Check if we formed a valid word
        const wordToCheck = newWord.join("")
        const isValid = compounds.some(c => c.word === wordToCheck)

        if (isValid && !discoveredWords.has(wordToCheck)) {
            const newDiscovered = new Set(discoveredWords)
            newDiscovered.add(wordToCheck)
            setDiscoveredWords(newDiscovered)

            const compound = compounds.find(c => c.word === wordToCheck)
            toast.success("Found a new compound!", {
                description: `${wordToCheck} (${compound?.reading}) - ${compound?.meaning}`
            })
        }
    }

    const clearPosition = (index: number) => {
        const newWord = [...currentWord]
        newWord[index] = ""
        setCurrentWord(newWord)
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-8rem)]">
            <Card className="flex-1 glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center px-8">
                        <CardTitle className="text-lg font-medium">Kanji Word Builder</CardTitle>
                        <div className="flex items-center gap-4">
                            <Select value={level} onValueChange={setLevel}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="N5">JLPT N5</SelectItem>
                                    <SelectItem value="N4">JLPT N4</SelectItem>
                                    <SelectItem value="N3">JLPT N3</SelectItem>
                                    <SelectItem value="N2">JLPT N2</SelectItem>
                                    <SelectItem value="N1">JLPT N1</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => fetchRandomKanji()}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">Loading kanji...</p>
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto">
                                {/* Word Building Area */}
                                <div className="flex gap-4 items-center justify-center">
                                    {currentWord.map((kanji, index) => (
                                        <Droppable key={`position-${index}`} droppableId={`position-${index}`}>
                                            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`w-24 h-24 border-2 rounded-lg flex items-center justify-center relative
                                                        ${snapshot.isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'}`}
                                                >
                                                    {kanji ? (
                                                        <Draggable draggableId={`word-${index}`} index={index}>
                                                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className="text-4xl font-bold relative"
                                                                >
                                                                    {kanji}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="absolute -top-2 -right-2 h-6 w-6"
                                                                        onClick={() => clearPosition(index)}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ) : null}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    ))}
                                </div>

                                {/* Available Kanji Options */}
                                {discoveredWords.size > 0 && (
                                    <Droppable droppableId="kanji-list" direction="horizontal">
                                        {(provided: DroppableProvided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="flex gap-4 flex-wrap justify-center"
                                            >
                                                {validKanji.map((kanji, index) => (
                                                    <Draggable
                                                        key={kanji}
                                                        draggableId={`kanji-${kanji}`}
                                                        index={index}
                                                    >
                                                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`w-16 h-16 border rounded-lg flex items-center justify-center text-2xl
                                                                    ${snapshot.isDragging ? 'bg-blue-100' : 'bg-white'}`}
                                                            >
                                                                {kanji}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                )}

                                {/* Discovered Words */}
                                <div className="w-full">
                                    <h3 className="text-lg font-medium mb-4">Discovered Compounds ({discoveredWords.size})</h3>
                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                        {Array.from(discoveredWords).map(word => {
                                            const compound = compounds.find(c => c.word === word)
                                            return compound && (
                                                <Card key={word} className="p-4">
                                                    <p className="text-xl font-bold mb-1">{word}</p>
                                                    <p className="text-sm opacity-90">{compound.reading}</p>
                                                    <p className="text-sm text-muted-foreground">{compound.meaning}</p>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </DragDropContext>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}