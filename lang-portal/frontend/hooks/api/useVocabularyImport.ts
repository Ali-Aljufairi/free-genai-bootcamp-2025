import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Word } from "@/types/api";

interface VocabularyTopic {
  topic: string;
}

interface UseVocabularyImportReturn {
  importVocabularyByTopic: (topic: string) => Promise<any>;
  isLoading: boolean;
  error: Error | null;
}

export function useVocabularyImport(): UseVocabularyImportReturn {
  const queryClient = useQueryClient();
  
  const vocabularyMutation = useMutation({
    mutationFn: async (topicData: VocabularyTopic): Promise<any> => {
      // Step 1: Get vocabulary suggestions from the vocabulary endpoint
      const response = await fetch("http://localhost:8000/api/v1/vocabulary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify(topicData),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to get vocabulary: ${response.status}`);
      }
      
      const suggestions = await response.json();
      
      // Step 2: Add each word to the words endpoint
      if (suggestions && Array.isArray(suggestions.words)) {
        const wordPromises = suggestions.words.map(async (word: any) => {
          try {
            // Format the word to match your API structure
            const wordData: Partial<Word> = {
              japanese: word.japanese || word.term,
              romaji: word.romaji || word.pronunciation || "",
              english: word.english || word.definition || "",
              parts: {
                type: word.type || "noun",
                category: topicData.topic,
                formality: word.formality || ""
              }
            };
            
            // Post to words endpoint
            const wordResponse = await fetch("http://127.0.0.1:8080/api/v1/words", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(wordData),
            });
            
            if (!wordResponse.ok) {
              const errorData = await wordResponse.json().catch(() => ({}));
              console.error("Error adding word:", errorData);
              return null;
            }
            
            return wordResponse.json();
          } catch (error) {
            console.error("Error processing word:", error);
            return null;
          }
        });
        
        // Wait for all word additions to complete
        const results = await Promise.all(wordPromises);
        const successfulImports = results.filter(Boolean).length;
        
        return {
          totalSuggestions: suggestions.words.length,
          successfulImports,
          topic: topicData.topic
        };
      }
      
      return suggestions;
    },
    onSuccess: () => {
      // Invalidate queries that might be affected by this import
      queryClient.invalidateQueries({ queryKey: ["words"] });
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    }
  });

  // Function to import vocabulary by topic
  const importVocabularyByTopic = async (topic: string): Promise<any> => {
    try {
      const result = await vocabularyMutation.mutateAsync({ topic });
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    importVocabularyByTopic,
    isLoading: vocabularyMutation.isPending,
    error: vocabularyMutation.error,
  };
}