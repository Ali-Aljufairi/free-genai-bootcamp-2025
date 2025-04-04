import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Word } from "@/types/api";
import { toast } from "sonner";

interface UseWordImportReturn {
  addWord: (wordData: Partial<Word>) => Promise<Word>;
  addMultipleWords: (words: Partial<Word>[]) => Promise<number>;
  isLoading: boolean;
  error: Error | null;
}
const API_URL = "api/langportal"
export function useWordImport(): UseWordImportReturn {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (wordData: Partial<Word>): Promise<Word> => {
      const response = await fetch(`${API_URL}/words`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(wordData),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to add word: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the words query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["words"] });
    }
  });

  // Function to add a single word
  const addWord = async (wordData: Partial<Word>): Promise<Word> => {
    try {
      const result = await mutation.mutateAsync(wordData);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Function to add multiple words
  const addMultipleWords = async (words: Partial<Word>[]): Promise<number> => {
    let successCount = 0;
    
    for (const word of words) {
      try {
        await addWord(word);
        successCount++;
      } catch (error) {
        console.error("Error adding word:", word, error);
        // Continue with the next word even if one fails
      }
    }
    
    return successCount;
  };

  return {
    addWord,
    addMultipleWords,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}