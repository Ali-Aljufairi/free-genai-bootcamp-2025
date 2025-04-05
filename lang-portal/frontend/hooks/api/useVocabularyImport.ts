import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Word } from "@/types/api";

interface UseVocabularyImportReturn {
  importVocabularyByTopic: (topic: string) => Promise<any>;
  isLoading: boolean;
  error: Error | null;
}

export function useVocabularyImport(): UseVocabularyImportReturn {
  const queryClient = useQueryClient();
  
  const vocabularyMutation = useMutation({
    mutationFn: async (topic: string): Promise<any> => {
      try {
        // Step 1: Fetch vocabulary suggestions from the vocabulary API
        const vocabResponse = await fetch("/api/vocab-importer/vocabulary" , {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json"
          },
          body: JSON.stringify({ topic }),
        });
        
        if (!vocabResponse.ok) {
          throw new Error(`Failed to get vocabulary: ${vocabResponse.status}`);
        }
        
        const vocabData = await vocabResponse.json();
        const words = vocabData.vocabulary?.words || [];
        
        if (words.length === 0) {
          return { totalSuggestions: 0, successfulImports: 0, topic };
        }

        // Step 2: Send words directly to the words API
        const wordResponse = await fetch(`/api/langportal/words`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(words),
        });
        
        if (!wordResponse.ok) {
          throw new Error(`Failed to add words: ${wordResponse.status}`);
        }
        
        return {
          totalSuggestions: words.length,
          successfulImports: words.length,
          topic
        };
        
      } catch (error) {
        console.error('Error in vocabulary import:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["words"] });
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      toast.success("Vocabulary imported successfully");
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    }
  });

  const importVocabularyByTopic = async (topic: string): Promise<any> => {
    return await vocabularyMutation.mutateAsync(topic);
  };

  return {
    importVocabularyByTopic,
    isLoading: vocabularyMutation.isPending,
    error: vocabularyMutation.error,
  };
}