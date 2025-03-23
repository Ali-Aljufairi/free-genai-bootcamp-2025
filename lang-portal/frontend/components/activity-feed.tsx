"use client"

import { CheckCircle2, Clock, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/services/api"

// Define the activity type
type Activity = {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  icon: JSX.Element;
}

// Map activity types to their respective icons
const activityIcons = {
  "quiz": <CheckCircle2 className="h-5 w-5 text-green-500" />,
  "flashcards": <Clock className="h-5 w-5 text-blue-500" />,
  "achievement": <Star className="h-5 w-5 text-yellow-500" />,
}

// Default activities to show when loading or if there's an error
const defaultActivities = [
  {
    id: 1,
    type: "quiz",
    title: "Completed Quiz",
    description: "Basic Greetings",
    time: "2 hours ago",
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  },
  {
    id: 2,
    type: "flashcards",
    title: "Studied Flashcards",
    description: "Food Vocabulary",
    time: "4 hours ago",
    icon: <Clock className="h-5 w-5 text-blue-500" />,
  },
  {
    id: 3,
    type: "achievement",
    title: "Earned Achievement",
    description: "5-Day Streak",
    time: "Yesterday",
    icon: <Star className="h-5 w-5 text-yellow-500" />,
  },
  {
    id: 4,
    type: "quiz",
    title: "Completed Quiz",
    description: "Numbers 1-100",
    time: "Yesterday",
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  },
  {
    id: 5,
    type: "flashcards",
    title: "Studied Flashcards",
    description: "Common Verbs",
    time: "2 days ago",
    icon: <Clock className="h-5 w-5 text-blue-500" />,
  },
]

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(defaultActivities)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      try {
        setIsLoading(true)
        // Fetch study sessions as activities
        const studySessions = await api.studySession.getStudySessions()

        // Transform the API response into our activity format
        const formattedActivities = studySessions.map((session: any) => {
          const activityType = session.type || "flashcards" // Default to flashcards if type is missing
          return {
            id: session.id,
            type: activityType,
            title: session.type === "quiz" ? "Completed Quiz" : "Studied Flashcards",
            description: session.description || session.name,
            time: new Date(session.created_at).toLocaleDateString(),
            icon: activityIcons[activityType as keyof typeof activityIcons] || activityIcons.flashcards,
          }
        })

        setActivities(formattedActivities.length > 0 ? formattedActivities : defaultActivities)
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to fetch activities:", err)
        setError(err as Error)
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  return (
    <div className="space-y-4 py-2">
      {isLoading ? (
        <div className="text-center py-4 text-sm text-muted-foreground">Loading activities...</div>
      ) : error ? (
        <div className="text-center py-4 text-sm text-red-500">
          Failed to load activities. Using demo data.
        </div>
      ) : (
        activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
          >
            <div className="mt-0.5">{activity.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{activity.title}</p>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

