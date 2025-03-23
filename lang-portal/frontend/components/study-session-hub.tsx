"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, BookOpen, ScrollText } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCreateStudySession } from "@/hooks/api/useStudySession"
import { useGroups } from "@/hooks/api/useGroup"

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

      toast.success("Study session created", {
        description: "Redirecting to session...",
      })

      // Redirect to the appropriate study interface based on type
      router.push(`/study/${type}/${session.id}`)
    } catch (error) {
      toast.error("Failed to create session", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Flashcards
          </CardTitle>
          <CardDescription>Practice vocabulary with flashcards</CardDescription>
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
            <ScrollText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Quiz
          </CardTitle>
          <CardDescription>Test your knowledge</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Take a quiz to test your understanding of vocabulary and track your progress.
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
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Free Study
          </CardTitle>
          <CardDescription>Create your own study session</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Choose your own words and study method. Perfect for customized learning.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => startSession("free")}
            disabled={isLoading}
          >
            Start Free Study
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

