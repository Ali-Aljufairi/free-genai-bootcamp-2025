"use client"

import { useState } from "react"
import { BookOpen, Check, ChevronDown, Filter, Search, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Sample vocabulary data
const vocabularyItems = [
  {
    id: 1,
    word: "こんにちは",
    reading: "Konnichiwa",
    meaning: "Hello",
    example: "こんにちは、元気ですか？",
    exampleTranslation: "Hello, how are you?",
    group: "Greetings",
    tags: ["basic", "common"],
    mastered: true,
  },
  {
    id: 2,
    word: "ありがとう",
    reading: "Arigatou",
    meaning: "Thank you",
    example: "ありがとう、助かりました。",
    exampleTranslation: "Thank you, that helped me.",
    group: "Greetings",
    tags: ["basic", "common"],
    mastered: true,
  },
  {
    id: 3,
    word: "りんご",
    reading: "Ringo",
    meaning: "Apple",
    example: "このりんごは赤いです。",
    exampleTranslation: "This apple is red.",
    group: "Food",
    tags: ["noun", "common"],
    mastered: false,
  },
  {
    id: 4,
    word: "たべる",
    reading: "Taberu",
    meaning: "To eat",
    example: "私はりんごをたべます。",
    exampleTranslation: "I eat an apple.",
    group: "Verbs",
    tags: ["verb", "common"],
    mastered: false,
  },
  {
    id: 5,
    word: "のむ",
    reading: "Nomu",
    meaning: "To drink",
    example: "水をのみます。",
    exampleTranslation: "I drink water.",
    group: "Verbs",
    tags: ["verb", "common"],
    mastered: false,
  },
  {
    id: 6,
    word: "いく",
    reading: "Iku",
    meaning: "To go",
    example: "学校にいきます。",
    exampleTranslation: "I go to school.",
    group: "Verbs",
    tags: ["verb", "common"],
    mastered: false,
  },
]

// Get unique groups
const groups = Array.from(new Set(vocabularyItems.map((item) => item.group)))

export function VocabularyBrowser() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>(groups)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  // Filter vocabulary items based on search term and selected groups
  const filteredItems = vocabularyItems.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGroup = selectedGroups.includes(item.group)

    return matchesSearch && matchesGroup
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vocabulary..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <Filter className="h-4 w-4" />
              Filter Groups
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {groups.map((group) => (
              <DropdownMenuCheckboxItem
                key={group}
                checked={selectedGroups.includes(group)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedGroups([...selectedGroups, group])
                  } else {
                    setSelectedGroups(selectedGroups.filter((g) => g !== group))
                  }
                }}
              >
                {group}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={`glass-card cursor-pointer transform transition-all duration-300 ${
              selectedCard === item.id ? "scale-[1.02]" : ""
            }`}
            onClick={() => setSelectedCard(item.id === selectedCard ? null : item.id)}
          >
            <CardHeader className="pb-2 flex flex-row justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{item.word}</h3>
                <p className="text-sm text-muted-foreground">{item.reading}</p>
              </div>
              {item.mastered && (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mastered
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <p className="font-medium">{item.meaning}</p>

              {selectedCard === item.id && (
                <div className="mt-4 space-y-2 animate-in fade-in-50 duration-300">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <p className="text-sm">{item.example}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.exampleTranslation}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <div className="flex justify-between w-full">
                <Badge variant="outline">{item.group}</Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Star className={`h-4 w-4 ${item.mastered ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  <span className="sr-only">Favorite</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
          <h3 className="mt-4 text-lg font-medium">No vocabulary items found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

