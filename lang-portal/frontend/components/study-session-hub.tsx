"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Edit, ScrollText, BookOpen, Search, MessageSquare, Mic, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCreateStudySession } from "@/hooks/api/useStudySession"
import { useGroups } from "@/hooks/api/useGroup"
import { toast } from "sonner"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { useSidebar } from "@/hooks/use-sidebar"

// Image dimensions constants
const CARD_IMAGE_DIMENSIONS = {
  small: { width: 80, height: 80 },
  medium: { width: 112, height: 112 },
  large: { width: 128, height: 128 }
};

// Preload image paths to improve performance
const studyImages = {
  flashcards: "/Study-session/images.png",
  quiz: "/Study-session/pen.png",
  chat: "/Study-session/sen.png",
  drawing: "/Study-session/drawing.png",
  agent: "/Study-session/agent.png",
  speech: "/Study-session/mic.png",
  companion: "/Study-session/agent.png"
} as const;

const studyOptions = [
  {
    title: "Flashcards",
    description: "Practice vocabulary with flashcards",
    icon: <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />,
    image: studyImages.flashcards,
    type: "flashcards"
  },
  {
    title: "Grammar Quiz",
    description: "Test your knowledge with JLPT grammar quizzes",
    icon: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />,
    image: studyImages.quiz,
    type: "quiz"
  },
  {
    title: "Sentence Constructor",
    description: "Practice language through conversation",
    icon: <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />,
    image: studyImages.chat,
    type: "chat"
  },
  {
    title: "Writing Practice",
    description: "Practice writing characters",
    icon: <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />,
    image: studyImages.drawing,
    type: "drawing"
  },
  {
    title: "Learning Resources",
    description: "Find resources to learn Japanese",
    icon: <Search className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />,
    image: studyImages.agent,
    type: "agent"
  },
  {
    title: "Speech to Image",
    description: "Turn your spoken words into images",
    icon: <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />,
    image: studyImages.speech,
    type: "speech"
  },
  {
    title: "Companion",
    description: "Talk with an AI agent by voice (call mode)",
    icon: <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />,
    image: studyImages.companion,
    type: "companion-study"
  }
] as const;

export function StudySessionHub() {
  const router = useRouter()
  const { createSession, isLoading } = useCreateStudySession()
  const { data: groups } = useGroups()
  const isMobile = useIsMobile()
  const { isExpanded, setIsExpanded } = useSidebar()

  // Move prefetching to useEffect to ensure it only runs on client
  useEffect(() => {
    studyOptions.forEach(option => {
      router.prefetch(`/study/${option.type}`)
    })
  }, [router])

  // Preload study images using the window.Image constructor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Object.values(studyImages).forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    }
  }, []);

  // Memoize the startSession callback
  const startSession = useCallback(async (type: string) => {
    try {
      // Always minimize sidebar when clicking a card
      setIsExpanded(false)

      const session = await createSession({
        type,
        groupId: groups?.[0]?.id,
        name: `${type} Session`,
        description: `New ${type} study session`,
      })

      // Special route for companion-study
      if (type === "companion-study") {
        router.push(`/study/companion-study/${session.id}`)
      } else {
        router.push(`/study/${type}/${session.id}`)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }, [createSession, groups, router, setIsExpanded])

  // Memoize StudyCard component
  const StudyCard = useMemo(() => ({
    title,
    description,
    icon,
    image,
    type
  }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    image: string;
    type: string;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      <Card
        className="glass-card relative overflow-hidden flex flex-col h-full cursor-pointer"
        onClick={() => startSession(type)}
      >
        <CardHeader className="z-10 pb-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            {icon}
            {title}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm line-clamp-2">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex justify-center items-center py-2 sm:py-4 z-10">
          <motion.div
            className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95, rotate: -5 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17
            }}
          >
            <Image
              src={image}
              alt={`${title} background`}
              width={CARD_IMAGE_DIMENSIONS.large.width}
              height={CARD_IMAGE_DIMENSIONS.large.height}
              className="object-contain"
              sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 128px"
              priority={true}
              loading="eager"
              placeholder="blur"
              blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
            />
          </motion.div>
        </CardContent>
        <CardFooter className="z-10 pt-0 pb-4">
          <motion.div
            className="w-full"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              className="w-full text-sm sm:text-base"
              disabled={isLoading}
            >
              {isMobile ? `Start ${title.split(' ')[0]}` : `Start ${title}`}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  ), [isLoading, isMobile, startSession]);

  return (
    <motion.div
      className="space-y-4 sm:space-y-8 px-2 sm:px-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <AnimatePresence>
          {studyOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
            >
              <StudyCard
                title={option.title}
                description={option.description}
                icon={option.icon}
                image={option.image}
                type={option.type}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

