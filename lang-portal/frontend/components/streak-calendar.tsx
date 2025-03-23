"use client"

import { useTheme } from "next-themes"

export function StreakCalendar() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Generate last 28 days (4 weeks)
  const days = Array.from({ length: 28 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - 27 + i)
    return {
      date,
      hasActivity: Math.random() > 0.3, // Randomly determine if there was activity
    }
  })

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
                    ${
                      day.hasActivity
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
    </div>
  )
}

