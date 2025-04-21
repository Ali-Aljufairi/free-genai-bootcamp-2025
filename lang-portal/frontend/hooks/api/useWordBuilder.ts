"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { toast } from "sonner";

export function useWordBuilder(level: string) {
  const queryClient = useQueryClient();

  const {
    data: kanjiData,
    isLoading: isLoadingKanji,
    error: kanjiError,
    refetch: refetchKanji
  } = useQuery({
    queryKey: ['kanji', level],
    queryFn: () => api.jlpt.getRandomKanji(level),
    enabled: !!level,
  });

  const {
    mutate: fetchCompounds,
    isPending: isLoadingCompounds,
    data: compoundData,
    error: compoundError
  } = useMutation({
    mutationFn: (kanji: string) => api.jlpt.getKanjiCompounds(kanji),
    onError: (error) => {
      toast.error("Failed to fetch compounds", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    }
  });

  const handleNewKanji = async () => {
    try {
      await refetchKanji();
    } catch (error) {
      toast.error("Failed to fetch new kanji", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    }
  };

  return {
    kanjiData,
    compoundData,
    isLoadingKanji,
    isLoadingCompounds,
    kanjiError,
    compoundError,
    fetchCompounds,
    handleNewKanji
  };
}