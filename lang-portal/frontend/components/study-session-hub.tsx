"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Edit, ScrollText, BookOpen, Search, MessageSquare, Mic, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCreateStudySession } from "@/hooks/api/useStudySession"
import { useGroups } from "@/hooks/api/useGroup"
import { toast } from "@/hooks/use-toast"

export function StudySessionHub() {
  const router = useRouter()
  const { createSession, isLoading } = useCreateStudySession()
  const { data: groups } = useGroups()

  const startSession = async (type: string) => {
    try {
      const session = await createSession({
        type,
        groupId: groups?.[0]?.id, // Default to first group if available
        name: `${type} Session`,
        description: `New ${type} study session`,
      })
      toast({
        title: "Study session created",
        description: "Redirecting to session...",
      })
      // Redirect to the appropriate study interface based on type
      router.push(`/study/${type}/${session.id}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create session",
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Flashcards
            </CardTitle>
            <CardDescription>Practice vocabulary with flashcard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review words using spaced repetition. Perfect for memorizing vocabulary and their meanings.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => startSession("flashcards")}
              disabled={isLoading}
            >
              Start Flashcards
            </Button>
          </CardFooter>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Grammar Quiz
            </CardTitle>
            <CardDescription>Test your knowledge with JLPT grammar quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Challenge yourself with multiple-choice grammar questions based on JLPT levels. Great for exam preparation.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => startSession("quiz")}
              disabled={isLoading}
            >
              Start Quiz
            </Button>
          </CardFooter>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Sentence Contructor
            </CardTitle>
            <CardDescription>Practice language through conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Engage in natural conversations with an AI language tutor. Perfect for improving your conversational skills.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => startSession("chat")}
              disabled={isLoading}
            >
              Start Chat
            </Button>
          </CardFooter>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Writing Practice
            </CardTitle>
            <CardDescription>Practice writing characters</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Practice writing Japanese characters and get instant feedback on your strokes.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => startSession("drawing")}
              disabled={isLoading}
            >
              Start Drawing
            </Button>
          </CardFooter>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Learning Resources
            </CardTitle>
            <CardDescription>Find resources to learn Japanese</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-powered agent that helps you find the best books, videos, and resources for learning Japanese.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => startSession("agent")}
              disabled={isLoading}
            >
              Find Resources
            </Button>
          </CardFooter>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Speech to Image
            </CardTitle>
            <CardDescription>Turn your spoken words into images</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Describe a scene in Japanese or English and watch AI generate an image based on your speech.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => startSession("speech")}
              disabled={isLoading}
            >
              Start Speaking
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

