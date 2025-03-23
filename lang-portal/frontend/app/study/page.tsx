import type { Metadata } from "next"
import { StudySessionHub } from "@/components/study-session-hub"

export const metadata: Metadata = {
  title: "Study | Sorami (空見)",
  description: "Start a study session",
}

export default function StudyPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Study Session Hub</h1>
        <p className="text-muted-foreground">Choose an activity and start learning.</p>
      </div>

      <StudySessionHub />
    </div>
  )
}

