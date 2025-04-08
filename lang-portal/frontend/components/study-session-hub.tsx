"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Edit, ScrollText, BookOpen, Search, MessageSquare, Mic, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCreateStudySession } from "@/hooks/api/useStudySession"
import { useGroups } from "@/hooks/api/useGroup"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

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
        <Card className="glass-card relative overflow-hidden flex flex-col">
          <CardHeader className="z-10 pb-0">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Flashcards
            </CardTitle>
            <CardDescription>Practice vocabulary with flashcard</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex justify-center items-center py-4 z-10">
            <div className="relative w-32 h-32">
              <Image
                src="/Study-session/images.png"
                alt="Flashcards background"
                width={128}
                height={128}
                className="object-contain"
                priority
              />
            </div>
          </CardContent>
          <CardFooter className="z-10">
            <Button
              className="w-full"
              onClick={() => startSession("flashcards")}
              disabled={isLoading}
            >
              Start Flashcards
            </Button>
          </CardFooter>
        </Card>

        <Card className="glass-card relative overflow-hidden flex flex-col">
          <CardHeader className="z-10 pb-0">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Grammar Quiz
            </CardTitle>
            <CardDescription>Test your knowledge with JLPT grammar quizzes</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex justify-center items-center py-4 z-10">
            <div className="relative w-32 h-32">
              <Image
                src="/Study-session/pen.png"
                alt="Grammar Quiz background"
                width={128}
                height={128}
                className="object-contain"
                priority
              />
            </div>
          </CardContent>
          <CardFooter className="z-10">
            <Button
              className="w-full"
              onClick={() => startSession("quiz")}
              disabled={isLoading}
            >
              Start Quiz
            </Button>
          </CardFooter>
        </Card>

        <Card className="glass-card relative overflow-hidden flex flex-col">
          <CardHeader className="z-10 pb-0">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Sentence Constructor
            </CardTitle>
            <CardDescription>Practice language through conversation</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex justify-center items-center py-4 z-10">
            <div className="relative w-32 h-32">
              <Image
                src="/Study-session/images.png"
                alt="Sentence Constructor background"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
          </CardContent>
          <CardFooter className="z-10">
            <Button
              className="w-full"
              onClick={() => startSession("chat")}
              disabled={isLoading}
            >
              Start Chat
            </Button>
          </CardFooter>
        </Card>

        <Card className="glass-card relative overflow-hidden flex flex-col">
          <CardHeader className="z-10 pb-0">
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Writing Practice
            </CardTitle>
            <CardDescription>Practice writing characters</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex justify-center items-center py-4 z-10">
            <div className="relative w-32 h-32">
              <Image
                src="/Study-session/drawing.png"
                alt="Writing Practice background"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
          </CardContent>
          <CardFooter className="z-10">
            <Button
              className="w-full"
              onClick={() => startSession("drawing")}
              disabled={isLoading}
            >
              Start Drawing
            </Button>
          </CardFooter>
        </Card>

        <Card className="glass-card relative overflow-hidden flex flex-col">
          <CardHeader className="z-10 pb-0">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Learning Resources
            </CardTitle>
            <CardDescription>Find resources to learn Japanese</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex justify-center items-center py-4 z-10">
            <div className="relative w-32 h-32">
              <Image
                src="/Study-session/images.png"
                alt="Learning Resources background"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
          </CardContent>
          <CardFooter className="z-10">
            <Button
              className="w-full"
              onClick={() => startSession("agent")}
              disabled={isLoading}
            >
              Find Resources
            </Button>
          </CardFooter>
        </Card>

        <Card className="glass-card relative overflow-hidden flex flex-col">
          <CardHeader className="z-10 pb-0">
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Speech to Image
            </CardTitle>
            <CardDescription>Turn your spoken words into images</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex justify-center items-center py-4 z-10">
            <div className="relative w-32 h-32">
              <Image
                src="/Study-session/images.png"
                alt="Speech to Image background"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
          </CardContent>
          <CardFooter className="z-10">
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

