"use client"

import { useEffect, useRef } from 'react';
import { Swapy, createSwapy, type SwapEvent } from 'swapy'; // Import Swapy

import { useWordBuilder } from "@/hooks/api/useWordBuilder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import { RefreshCw, Loader2, X, SkipForward } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface CompoundWord {
    word: string;
    reading: string;
    meaning: string;
    length: number;
    position: number;
    otherKanji: Array<{
        kanji: string;
        position: number;
    }>;
}

interface WordBuilderStudyProps {
    sessionId?: string;
    onComplete?: () => void;
}

// Custom motion div component that doesn't conflict with DnD
const MotionDiv = motion.div as any;

export function WordBuilderStudy({ sessionId, onComplete }: WordBuilderStudyProps) {
    const {
        gameData,
        isLoading,
        currentWord,
        discoveredWords,
        currentTargetPosition,
        activeCompoundLength,
        handleSwap,
        clearPosition,
        handleNewKanji,
        skipCurrentCompound,
        totalCompoundsFound,
        remainingCompounds
    } = useWordBuilder("N5");

    const swapyRef = useRef<Swapy | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            swapyRef.current = createSwapy(containerRef.current, {
                animation: 'none', // Disable animation to prevent box movement
                swapMode: 'drop',
                enabled: true,
                dragOnHold: false,
                autoScrollOnDrag: false,
                dragAxis: 'both'
            });

            swapyRef.current.onSwapStart((event) => {
                console.log('Starting drag:', event.draggingItem);
            });

            swapyRef.current.onBeforeSwap((event) => {
                const { toSlot, draggingItem } = event;
                
                // Don't allow swaps between choice slots
                if (toSlot.startsWith('choice-')) {
                    return false;
                }

                const targetIndex = parseInt(toSlot.split('-')[1]);
                if (targetIndex >= activeCompoundLength || targetIndex === currentTargetPosition) {
                    toast.error("Can't place kanji here!");
                    return false;
                }

                return true;
            });

            swapyRef.current.onSwap((event) => {
                handleSwap(event);
            });

            swapyRef.current.onSwapEnd((event) => {
                // Always update to ensure kanji return to their positions
                swapyRef.current?.update();
            });
        }

        return () => {
            swapyRef.current?.destroy();
        };
    }, [activeCompoundLength, currentTargetPosition, handleSwap, gameData, discoveredWords]);

    // Calculate progress
    const progress = gameData
        ? (discoveredWords.size / gameData.compounds.length) * 100
        : 0;

    const currentCompound = gameData?.compounds.find(c => !discoveredWords.has(c.word));

    return (
        <div className="flex flex-col min-h-[calc(100vh-8rem)] gap-6">
            <Card className="glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center px-8">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <CardTitle className="text-lg font-medium">Kanji Word Builder</CardTitle>
                                <span className="text-sm text-muted-foreground">
                                    {remainingCompounds} compounds remaining
                                </span>
                            </div>
                            <Progress value={progress} className="w-[200px]" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Select defaultValue="N5" onValueChange={(value) => handleNewKanji()}>
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
                                onClick={handleNewKanji}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card className="flex-1 glass-card border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                <CardContent className="p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">Loading kanji...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto" ref={containerRef}>
                            {/* Target Kanji Display */}
                            {gameData && (
                                <div className="text-center space-y-4">
                                    <h3 className="text-lg font-medium">Target Kanji</h3>
                                    <div className="text-6xl font-bold p-4 bg-primary/10 rounded-lg">
                                        {gameData.kanji}
                                    </div>
                                    {currentCompound && (
                                        <p className="text-sm text-muted-foreground">
                                            Find a {currentCompound.length}-character compound ({totalCompoundsFound}/10 found)
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Main game container with Swapy */}
                            <div className="flex flex-col gap-8 w-full">
                                {/* Word Building Area */}
                                <div className="flex gap-4 items-center justify-center">
                                    {currentWord.map((kanji, index) => (
                                        <div
                                            key={`slot-${index}`}
                                            data-swapy-slot={`position-${index}`}
                                            className={`w-24 h-24 border-2 rounded-lg flex items-center justify-center relative transition-colors duration-200
                                                ${index >= activeCompoundLength ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
                                                ${index === currentTargetPosition ? 'border-solid border-primary bg-primary/5' : ''}`}
                                        >
                                            {kanji && (
                                                <div
                                                    data-swapy-item={`kanji-${index}-${kanji}`}
                                                    className={`text-4xl font-bold relative group select-none
                                                        ${index === currentTargetPosition ? 'text-primary cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                                                >
                                                    {kanji}
                                                    {index !== currentTargetPosition && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => clearPosition(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Available Kanji Choices */}
                                <div className="flex gap-4 flex-wrap justify-center p-4 border border-dashed rounded-lg mt-4 min-h-[120px] bg-gray-800/10 dark:bg-gray-800/30">
                                    {gameData?.choices.map((choice, index) => (
                                        <div
                                            key={`choice-${index}`}
                                            data-swapy-slot={`choice-${index}`}
                                            className="w-20 h-20 border-2 rounded-lg flex items-center justify-center relative"
                                        >
                                            <div
                                                data-swapy-item={`kanji-choice-${index}-${choice.kanji}`}
                                                className={`text-3xl font-bold select-none
                                                    ${choice.isValid ? 'cursor-grab active:cursor-grabbing' : 'opacity-80 cursor-not-allowed'}
                                                    ${choice.isTarget ? 'text-primary' : ''}`}
                                            >
                                                {choice.kanji}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Skip Button */}
                            <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={skipCurrentCompound}
                            >
                                <SkipForward className="h-4 w-4 mr-2" />
                                Skip this compound
                            </Button>

                            {/* Discovered Words - Only show in one place */}
                            {discoveredWords.size > 0 && (
                                <div className="w-full mt-8">
                                    <h3 className="text-lg font-medium mb-4">
                                        Discovered Compounds ({discoveredWords.size}/10)
                                    </h3>
                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                        <AnimatePresence>
                                            {Array.from(discoveredWords).map(word => {
                                                const compound = gameData?.compounds.find(c => c.word === word);
                                                return compound && (
                                                    <MotionDiv
                                                        key={word}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                    >
                                                        <Card className="p-4 hover:shadow-md transition-shadow">
                                                            <p className="text-xl font-bold mb-1">{word}</p>
                                                            <p className="text-sm opacity-90">{compound.reading}</p>
                                                            <p className="text-sm text-muted-foreground">{compound.meaning}</p>
                                                        </Card>
                                                    </MotionDiv>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}