"use client"

import { CheckCircle2, Clock, Star } from "lucide-react"

const activities = [
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
  return (
    <div className="space-y-4 py-2">
      {activities.map((activity) => (
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
      ))}
    </div>
  )
}

