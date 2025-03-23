"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useGroups } from "@/hooks/api/useGroup"
import { useWords } from "@/hooks/api/useWord"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function VocabularyBrowser() {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: groups, isLoading: groupsLoading } = useGroups()
  const { data: words, isLoading: wordsLoading, refetch } = useWords()

  const filteredWords = words?.filter(word =>
    word.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.definition.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleStudyWord = async (wordId: string) => {
    try {
      // Here you could implement logic to add the word to a study session
      toast.success("Word added to study session")
    } catch (error) {
      toast.error("Failed to add word to study session")
    }
  }

  if (wordsLoading || groupsLoading) {
    return (
      <div className="space-y-4">
        <Input
          type="search"
          placeholder="Search vocabulary..."
          className="max-w-sm"
          disabled
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass-card">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search vocabulary..."
        className="max-w-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredWords.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No words found matching your search." : "No vocabulary words available."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWords.map((word) => (
            <Card key={word.id} className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium">{word.term}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {word.definition}
                </p>
                {word.examples?.map((example, i) => (
                  <p key={i} className="text-sm italic mt-2">
                    {example}
                  </p>
                ))}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleStudyWord(word.id)}
                >
                  Study
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => window.open(`https://jisho.org/search/${encodeURIComponent(word.term)}`, '_blank')}
                >
                  Look up
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

