import { Brain, Edit, ScrollText, BookOpen, Search, MessageSquare, Mic, CheckCircle } from "lucide-react"

// Image dimensions constants
export const CARD_IMAGE_DIMENSIONS = {
    small: { width: 80, height: 80 },
    medium: { width: 112, height: 112 },
    large: { width: 128, height: 128 }
} as const;

// Preload image paths to improve performance
export const studyImages = {
    flashcards: "/Study-session/images.png",
    quiz: "/Study-session/pen.png",
    chat: "/Study-session/sen.png",
    drawing: "/Study-session/drawing.png",
    agent: "/Study-session/agent.png",
    speech: "/Study-session/mic.png",
    companion: "/Study-session/comp.png"
} as const;

export const studyOptions = [
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