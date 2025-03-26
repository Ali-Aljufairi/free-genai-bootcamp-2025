"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useGroups } from "@/hooks/api/useGroup"
import { useWords } from "@/hooks/api/useWord"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useVocabularyImport } from "@/hooks/api/useVocabularyImport"

export function VocabularyBrowser() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [topic, setTopic] = useState("")
  const { importVocabularyByTopic, isLoading: importLoading } = useVocabularyImport()
  const { data: groups, isLoading: groupsLoading } = useGroups()
  const { 
    data, 
    isLoading: wordsLoading, 
    loadMore, 
    hasMore 
  } = useWords()
  
  const words = data?.items || []
  const loader = useRef(null)

  const filteredWords = words.filter(word =>
    word.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.romaji.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.english.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Implement infinite scroll using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !wordsLoading) {
          loadMore(data?.page ? data.page + 1 : 1)
        }
      },
      { threshold: 1.0 }
    )

    const currentLoader = loader.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [loadMore, hasMore, data?.page, wordsLoading])

  const handleStudyWord = async (wordId: number) => {
    try {
      // Here you could implement logic to add the word to a study session
      toast.success("Word added to study session")
    } catch (error) {
      toast.error("Failed to add word to study session")
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      toast.error("Please enter a topic")
      return
    }
    
    try {
      await importVocabularyByTopic(topic.trim())
      toast.success("Vocabulary imported successfully!", {
        description: `Words for topic "${topic}" have been added to your vocabulary list`
      })
      setTopic("")
    } catch (error) {
      toast.error("Failed to import vocabulary", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  if (wordsLoading && !words.length) {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <Input
          type="search"
          placeholder="Search vocabulary..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowImport(!showImport)}
        >
          {showImport ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Hide Import
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Import Words
            </>
          )}
        </Button>
      </div>

      {showImport && (
        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle>Import Vocabulary by Topic</CardTitle>
            <CardDescription>
              Instantly add words related to a specific topic to your study list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  name="topic"
                  placeholder="e.g. Sea animals, Kitchen utensils, Travel phrases"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter a specific topic to automatically generate related vocabulary words
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={importLoading || !topic.trim()}
              >
                {importLoading ? "Importing..." : "Import Vocabulary"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4 text-xs text-muted-foreground">
            <p>Words will be added to your vocabulary for study sessions.</p>
          </CardFooter>
        </Card>
      )}

      {filteredWords.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No words found matching your search." : "No vocabulary words available."}
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWords.map((word) => (
              <Card key={word.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex flex-col gap-1">
                    <span className="text-xl">{word.japanese}</span>
                    <span className="text-sm text-muted-foreground font-normal">{word.romaji}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base mb-2">{word.english}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{word.parts.type}</Badge>
                    {word.parts.category && (
                      <Badge variant="outline">{word.parts.category}</Badge>
                    )}
                    {word.parts.formality && (
                      <Badge>{word.parts.formality}</Badge>
                    )}
                  </div>
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
                    onClick={() => window.open(`https://jisho.org/search/${encodeURIComponent(word.japanese)}`, '_blank')}
                  >
                    Look up
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {hasMore && (
            <div ref={loader} className="flex justify-center py-4">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

