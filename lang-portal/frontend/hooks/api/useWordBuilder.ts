"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@services/api";
import { toast } from "sonner";
import type { SwapyEvent } from 'swapy'; // Import Swapy event type

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

interface KanjiChoice {
  kanji: string;
  isTarget: boolean;
  positions: number[];
  isValid: boolean;
}

interface GameData {
  kanji: string;
  compounds: CompoundWord[];
  choices: KanjiChoice[];
  level: string;
}


export function useWordBuilder(level: string) {
  const [currentWord, setCurrentWord] = useState<string[]>(new Array(4).fill(""));
  const [discoveredWords, setDiscoveredWords] = useState<Set<string>>(new Set());
  const [currentKanji, setCurrentKanji] = useState<string>("");
  const [currentTargetPosition, setCurrentTargetPosition] = useState<number>(0);
  const [activeCompoundLength, setActiveCompoundLength] = useState<number>(2);
  const [totalCompoundsFound, setTotalCompoundsFound] = useState<number>(0);
  const [remainingCompounds, setRemainingCompounds] = useState<number>(10);

  const { data: gameData, isLoading, error, refetch } = useQuery<GameData>({
    queryKey: ['kanji-game', level],
    queryFn: async () => {
      // Get initial kanji
      const startResponse = await api.jlpt.getRandomKanji(level);
      const kanji = startResponse.kanji;
      setCurrentKanji(kanji);

      // Get compounds and choices in a single call
      const gameResponse = await api.jlpt.getGameCompounds(kanji, level);

      // Initialize game state
      const newWord = new Array(4).fill("");
      if (gameResponse.compounds.length > 0) {
        const firstCompound = gameResponse.compounds[0];
        setCurrentTargetPosition(firstCompound.position);
        setActiveCompoundLength(firstCompound.length);
        newWord[firstCompound.position] = kanji;
        setCurrentWord(newWord);
        setDiscoveredWords(new Set()); // Reset discovered words on new game
      }

      return {
        kanji,
        compounds: gameResponse.compounds,
        choices: gameResponse.choices,
        level
      };
    },
    enabled: !!level,
    staleTime: 0,
    gcTime: 0,
  });

  const handleSwap = async (event: SwapyEvent) => {
    const { fromSlot, toSlot, draggingItem } = event;
    
    // Extract the kanji from the dragging item data
    const kanjiMatch = draggingItem.match(/(?:choice|word)-\d+-(.+)/);
    if (!kanjiMatch) return;
    
    const movedKanji = kanjiMatch[1];
    const targetIndex = parseInt(toSlot.split('-')[1]);

    // Don't allow drops on target position
    if (targetIndex === currentTargetPosition) {
        return;
    }

    // Update word state
    const newWord = [...currentWord];
    newWord[targetIndex] = movedKanji;

    // Check if word is complete
    const wordToCheck = newWord.slice(0, activeCompoundLength).join("");
    console.log('Checking word:', {
        wordToCheck,
        currentKanji,
        possibleCompounds: gameData?.compounds.map(c => ({
            word: c.word,
            reading: c.reading,
            meaning: c.meaning
        }))
    });

    if (wordToCheck.length === activeCompoundLength && !wordToCheck.includes("")) {
        const validationResult = await api.jlpt.validateGameCompound({
            kanji: currentKanji,
            compound: wordToCheck,
            level,
            position: currentTargetPosition
        });

        if (validationResult.isValid && !discoveredWords.has(wordToCheck)) {
            const newDiscovered = new Set(discoveredWords);
            newDiscovered.add(wordToCheck);
            setDiscoveredWords(newDiscovered);
            setTotalCompoundsFound(prev => prev + 1);
            setCurrentWord(newWord);

            toast.success("Found a new compound!", {
                description: `${wordToCheck} (${validationResult.reading}) - ${validationResult.meaning}`
            });

            // Find next compound if available
            const nextCompound = gameData?.compounds.find(c => !newDiscovered.has(c.word));
            if (nextCompound && totalCompoundsFound < 9) {
                // Reset for next compound
                const nextWord = new Array(4).fill("");
                nextWord[nextCompound.position] = currentKanji;
                setCurrentWord(nextWord);
                setCurrentTargetPosition(nextCompound.position);
                setActiveCompoundLength(nextCompound.length);
                setRemainingCompounds(prev => prev - 1);

                // Log next compound hint
                console.log('Next compound hint:', {
                    length: nextCompound.length,
                    position: nextCompound.position,
                    meaning: nextCompound.meaning
                });

                // If user found all compounds for current kanji
                if (newDiscovered.size === gameData?.compounds.length) {
                    toast.success("Found all compounds! Getting new kanji...");
                    await handleNewKanji();
                }
            } else {
                toast.success("Moving to new kanji!");
                await handleNewKanji();
            }
        } else {
            // Invalid compound - show error and return kanji to original position
            toast.error("Incorrect compound!", {
                description: "Try a different combination"
            });
        }
    } else {
        // Update current word state for incomplete words
        setCurrentWord(newWord);
    }
  };

  const clearPosition = (index: number) => {
    // Don't allow clearing the target kanji
    if (index === currentTargetPosition) return;

    const newWord = [...currentWord];
    newWord[index] = "";
    setCurrentWord(newWord);
  };

  const handleNewKanji = async () => {
    setDiscoveredWords(new Set());
    setCurrentWord(new Array(4).fill(""));
    setTotalCompoundsFound(0);
    setRemainingCompounds(10);
    await refetch();
  };

  const skipCurrentCompound = () => {
    if (!gameData) return;

    // Find the *current* compound index to find the *next* one
    const currentCompoundWord = currentWord.slice(0, activeCompoundLength).join("");
    const currentCompoundIndex = gameData.compounds.findIndex(c =>
      c.position === currentTargetPosition && c.length === activeCompoundLength
    );

    let nextCompound: CompoundWord | undefined = undefined;
    for (let i = currentCompoundIndex + 1; i < gameData.compounds.length; i++) {
      if (!discoveredWords.has(gameData.compounds[i].word)) {
        nextCompound = gameData.compounds[i];
        break;
      }
    }

    if (nextCompound) {
      const nextWord = new Array(4).fill("");
      nextWord[nextCompound.position] = currentKanji;
      setCurrentWord(nextWord);
      setCurrentTargetPosition(nextCompound.position);
      setActiveCompoundLength(nextCompound.length);
    } else {
      toast.info("No more compounds to skip to for this Kanji.");
    }
  };

  return {
    gameData,
    isLoading,
    error,
    currentWord,
    discoveredWords,
    currentTargetPosition,
    activeCompoundLength,
    handleSwap, // Expose new handler
    clearPosition,
    handleNewKanji,
    skipCurrentCompound,
    totalCompoundsFound,
    remainingCompounds
  };
}