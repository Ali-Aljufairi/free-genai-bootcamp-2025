"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressCircle } from "@/components/progress-circle"
import { ActivityFeed } from "@/components/activity-feed"
import { StreakCalendar } from "@/components/streak-calendar"
import { StatsCards } from "@/components/stats-cards"
import { BookOpen, Clock, TrendingUp } from "lucide-react"
import { useLastStudySession, useStudyProgress } from "@/hooks/api/useDashboard"
import { useState, useEffect } from "react"


export default function Dashboard() {
  const { data: lastSession } = useLastStudySession();
  const { data: studyProgress, isLoading: progressLoading } = useStudyProgress();

  const [progressValue, setProgressValue] = useState<number>(65);
  const [streakDays, setStreakDays] = useState<number>(7);
  const [username, setUsername] = useState<string>("Learner");

  useEffect(() => {
    // Update progress value if we have real data
    if (studyProgress && studyProgress.dailyProgress) {
      setProgressValue(studyProgress.dailyProgress);
    }

    // Update streak count if we have real data
    if (studyProgress && studyProgress.currentStreak) {
      setStreakDays(studyProgress.currentStreak);
    }

    // Could be expanded to fetch user profile data
    // For now using a default value
  }, [studyProgress]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {username}</h1>
        <p className="text-muted-foreground">Track your progress and continue your language learning journey.</p>
      </div>
      <StatsCards />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Daily Progress
            </CardTitle>
            <CardDescription>Your learning activity today</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <ProgressCircle value={progressValue} size={180} />
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/study">Continue Learning</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="col-span-1 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest learning sessions</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] overflow-auto py-0">
            <ActivityFeed />
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/history">View All Activity</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Learning Streak
            </CardTitle>
            <CardDescription>Stay consistent with your learning</CardDescription>
          </CardHeader>
          <CardContent>
            <StreakCalendar />
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground w-full text-center">
              Current streak: <span className="font-medium text-blue-600 dark:text-blue-400">{streakDays} days</span>
            </p>
          </CardFooter>
        </Card>
      </div>
      {/* Sample text for highlighting */}
      <div className="p-6 glass-card rounded-lg">
        <h2 className="text-xl font-bold mb-3">Try Highlighting This Text</h2>
        <p className="mb-3">
          Select any text on this page to see the blue highlight animation effect. This is a custom styling that
          enhances the user experience when interacting with text content.
        </p>
        <p>
          Sorami provides an immersive language learning experience with interactive lessons, vocabulary practice, and
          progress tracking. Our goal is to make language learning enjoyable and effective.
        </p>
      </div>
    </div>
  )
}

