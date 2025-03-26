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
      try {
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
          toast.error("Failed to get vocabulary", {
            description: error.message || `Status: ${response.status}`,
            className: "bg-destructive text-destructive-foreground",
          });
          throw new Error(error.message || `Failed to get vocabulary: ${response.status}`);
        }
        
        const suggestions = await response.json();
        const words = suggestions.vocabulary?.words || [];
        
        if (words.length === 0) {
          toast.warning("No words found", {
            description: `No vocabulary found for topic: ${topicData.topic}`,
            className: "bg-warning text-warning-foreground",
          });
          return { totalSuggestions: 0, successfulImports: 0, topic: topicData.topic };
        }

        // Send all words at once to the words endpoint
        const wordResponse = await fetch("http://localhost:8080/api/v1/words", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(words),
        });
        
        if (!wordResponse.ok) {
          const errorData = await wordResponse.json().catch(() => ({}));
          toast.error("Failed to add words", {
            description: errorData.message || `Status: ${wordResponse.status}`,
            className: "bg-destructive text-destructive-foreground",
          });
          throw new Error(errorData.message || `Failed to add words: ${wordResponse.status}`);
        }
        
        toast.success("Words imported successfully", {
          description: `Added ${words.length} words for topic: ${topicData.topic}`,
          className: "bg-primary text-primary-foreground",
        });

        return {
          totalSuggestions: words.length,
          successfulImports: words.length,
          topic: topicData.topic
        };
        
      } catch (error) {
        console.error('Error in vocabulary import:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["words"] });
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    }
  });

  const importVocabularyByTopic = async (topic: string): Promise<any> => {
    return await vocabularyMutation.mutateAsync({ topic });
  };

  return {
    importVocabularyByTopic,
    isLoading: vocabularyMutation.isPending,
    error: vocabularyMutation.error,
  };
}