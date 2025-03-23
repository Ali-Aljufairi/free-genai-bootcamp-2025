"use client"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { api } from "@/services/api"

export function StreakCalendar() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [activityData, setActivityData] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [currentStreak, setCurrentStreak] = useState(7) // Default streak

  // Generate last 28 days (4 weeks)
  const days = Array.from({ length: 28 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - 27 + i)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
    return {
      date,
      dateKey,
      hasActivity: activityData[dateKey] || false,
    }
  })

  useEffect(() => {
    async function fetchActivityData() {
      try {
        setIsLoading(true)
        // Fetch study progress data which should include activity dates
        const progressData = await api.dashboard.getStudyProgress()

        // Convert the API response into a map of dates with activity
        const activityMap: { [key: string]: boolean } = {}
        if (progressData && progressData.dailyActivity) {
          progressData.dailyActivity.forEach((activity: any) => {
            // Assume the API returns a date string in each activity
            if (activity.date) {
              activityMap[activity.date] = true
            }
          })
        }

        // Calculate current streak
        if (progressData && progressData.currentStreak) {
          setCurrentStreak(progressData.currentStreak)
        }

        setActivityData(activityMap)
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to fetch activity data:", err)
        // Use dummy data if API fails
        const dummyData: { [key: string]: boolean } = {}
        days.forEach(day => {
          dummyData[day.dateKey] = Math.random() > 0.3 // Randomly determine activity
        })
        setActivityData(dummyData)
        setIsLoading(false)
      }
    }

    fetchActivityData()
  }, [])

  // Group days by week
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // Get day names for the header
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-xs text-center text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      {isLoading ? (
        <div className="h-[140px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading calendar data...</p>
        </div>
      ) : (
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const isToday = new Date().toDateString() === day.date.toDateString()
                return (
                  <div
                    key={dayIndex}
                    className={`
                      aspect-square rounded-sm flex items-center justify-center text-xs
                      ${isToday ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}
                      ${day.hasActivity
                        ? isDark
                          ? "bg-blue-500/80 text-white"
                          : "bg-blue-500/80 text-white"
                        : "bg-blue-100/50 dark:bg-blue-900/20 text-muted-foreground"
                      }
                    `}
                    title={day.date.toLocaleDateString()}
                  >
                    {day.date.getDate()}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

