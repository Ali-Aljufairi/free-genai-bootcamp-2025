"use client"

import { useState, useEffect, useRef } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eraser, Pencil, RotateCcw, Send, Trash2, RefreshCw } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Word {
    id: number
    japanese: string
    romaji: string
    english: string
    parts: {
        type: string
    }
}

interface Sentence {
    sentence: string
    english: string
    romaji: string
    word: string
}

export function DrawingStudy() {
    const [word, setWord] = useState<Word | null>(null)
    const [sentence, setSentence] = useState<Sentence | null>(null)
    const [feedback, setFeedback] = useState<string>('')
    const [isEraseMode, setIsEraseMode] = useState(false)
    const [studyMode, setStudyMode] = useState<'word' | 'sentence'>('word')
    const canvasRef = useRef<ReactSketchCanvasRef | null>(null)

    const fetchRandomWord = async () => {
        try {
            const response = await fetch(`/api/langportal/words/random`)
            const data = await response.json()
            setWord(data)
        } catch (error) {
            console.error('Error fetching word:', error)
        }
    }

    const fetchRandomSentence = async () => {
        try {
            const response = await fetch(`api/writing/random-sentence`)
            const data = await response.json()
            console.log(data)
            setSentence(data)
        } catch (error) {
            console.error('Error fetching sentence:', error)
        }
    }

    const handleSubmit = async () => {
        try {
            if (!canvasRef.current) return

            const canvas = canvasRef.current as any
            const base64Image = await canvas.exportImage('base64')

            const endpoint = studyMode === 'word'
                ? `/api/writing/feedback-word`
                : `/api/writing/feedback-sentence`;

            // Create appropriate request body based on study mode
            const requestBody = studyMode === 'word'
                ? {
                    image: base64Image.split(',')[1],
                    target_word: word?.japanese
                }
                : {
                    image: base64Image.split(',')[1],
                    target_sentence: sentence?.sentence
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })

            const data = await response.json()
            setFeedback(data.feedback)
        } catch (error) {
            console.error('Error submitting drawing:', error)
        }
    }

    const handleRefresh = () => {
        if (studyMode === 'word') {
            fetchRandomWord();
        } else {
            fetchRandomSentence();
        }
        canvasRef.current?.clearCanvas();
        setFeedback('');
    }

    useEffect(() => {
        fetchRandomWord()
        fetchRandomSentence()
    }, [])

    if (!word || !sentence) return <div>Loading...</div>

    return (
        <div className="space-y-6 p-4">
            <Card className="p-6">
                <Tabs value={studyMode} onValueChange={(value) => setStudyMode(value as 'word' | 'sentence')} className="mb-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="word">Word Practice</TabsTrigger>
                        <TabsTrigger value="sentence">Sentence Practice</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="text-center mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="flex gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            New {studyMode === 'word' ? 'Word' : 'Sentence'}
                        </Button>
                        <Button
                            onClick={() => {
                                canvasRef.current?.clearCanvas();
                                setFeedback('');
                            }}
                            variant="outline"
                            size="sm"
                            className="flex gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear All
                        </Button>
                    </div>
                    {studyMode === 'word' ? (
                        <>
                            <h2 className="text-3xl font-bold mb-2">{word.japanese}</h2>
                            <p className="text-gray-600 dark:text-gray-400">{word.romaji} - {word.english}</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold mb-2">{sentence.sentence}</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">{sentence.romaji}</p>
                            <p className="text-gray-600 dark:text-gray-400">{sentence.english}</p>
                            <div className="mt-2 bg-secondary px-3 py-1 rounded-full inline-block">
                                <span className="text-sm font-medium">Focus word: {sentence.word}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-full h-[400px] border border-border rounded-lg overflow-hidden bg-muted">
                    <ReactSketchCanvas
                        ref={canvasRef}
                        strokeWidth={4}
                        strokeColor="red"
                        canvasColor="transparent"
                        className="w-full h-full"
                        style={{
                            border: 'none',
                        }}
                    />
                </div>

                <div className="flex gap-2 mt-4">
                    <div className="flex gap-2">
                        <Button
                            onClick={() => canvasRef.current?.clearCanvas()}
                            variant="outline"
                            size="icon"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => canvasRef.current?.undo()}
                            variant="outline"
                            size="icon"
                        >
                            <RotateCcw className="h-4 w-4 scale-x-[-1]" />
                        </Button>
                        <Button
                            onClick={() => {
                                setIsEraseMode(!isEraseMode);
                                canvasRef.current?.eraseMode(!isEraseMode);
                            }}
                            variant={isEraseMode ? "secondary" : "outline"}
                            size="icon"
                        >
                            {isEraseMode ? (
                                <Pencil className="h-4 w-4" />
                            ) : (
                                <Eraser className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        className="ml-auto"
                        size="icon"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                {feedback && (
                    <Alert className="mt-4">
                        <AlertDescription>{feedback}</AlertDescription>
                    </Alert>
                )}
            </Card>
        </div>
    )
}