"use client"

import { useState } from "react"
import {
  Brain,
  CheckCircle,
  Clock,
  FlaskConical,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Play,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const studyActivities = [
  {
    id: 1,
    title: "Flashcards",
    description: "Review vocabulary with interactive flashcards",
    icon: <LayoutGrid className="h-5 w-5" />,
    duration: "5-10 min",
    difficulty: "Easy",
    category: "review",
  },
  {
    id: 2,
    title: "Multiple Choice Quiz",
    description: "Test your knowledge with multiple choice questions",
    icon: <ListChecks className="h-5 w-5" />,
    duration: "10-15 min",
    difficulty: "Medium",
    category: "quiz",
  },
  {
    id: 3,
    title: "Spelling Challenge",
    description: "Practice spelling words correctly",
    icon: <CheckCircle className="h-5 w-5" />,
    duration: "5-10 min",
    difficulty: "Hard",
    category: "challenge",
  },
  {
    id: 4,
    title: "Listening Practice",
    description: "Improve your listening comprehension",
    icon: <Play className="h-5 w-5" />,
    duration: "10-15 min",
    difficulty: "Medium",
    category: "review",
  },
  {
    id: 5,
    title: "Sentence Builder",
    description: "Create sentences with vocabulary words",
    icon: <FlaskConical className="h-5 w-5" />,
    duration: "15-20 min",
    difficulty: "Hard",
    category: "challenge",
  },
  {
    id: 6,
    title: "Daily Review",
    description: "Quick review of recently learned words",
    icon: <Clock className="h-5 w-5" />,
    duration: "5 min",
    difficulty: "Easy",
    category: "review",
  },
]

const recentSessions = [
  {
    id: 1,
    title: "Flashcards",
    date: "Today",
    score: "85%",
    duration: "8 min",
  },
  {
    id: 2,
    title: "Multiple Choice Quiz",
    date: "Yesterday",
    score: "92%",
    duration: "12 min",
  },
  {
    id: 3,
    title: "Spelling Challenge",
    date: "3 days ago",
    score: "78%",
    duration: "9 min",
  },
]

export function StudySessionHub() {
  const [selectedTab, setSelectedTab] = useState("all")

  // Filter activities based on selected tab
  const filteredActivities =
    selectedTab === "all" ? studyActivities : studyActivities.filter((activity) => activity.category === selectedTab)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Activities</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="quiz">Quizzes</TabsTrigger>
          <TabsTrigger value="challenge">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className="glass-card overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">{activity.icon}</div>
                    <Badge variant="outline" className="text-xs">
                      {activity.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2">{activity.title}</CardTitle>
                  <CardDescription>{activity.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {activity.duration}
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 pt-4">
                  <Button className="w-full">Start Activity</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Recent Sessions
          </h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {recentSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 rounded-lg glass-card">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
                  <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-muted-foreground">{session.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-green-600 dark:text-green-400">{session.score}</p>
                  <p className="text-sm text-muted-foreground">{session.duration}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Sparkles className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

