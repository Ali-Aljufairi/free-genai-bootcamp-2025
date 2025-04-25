"use client"

import { UserProfile } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences.</p>
      </div>

      <Card className="border-border/50 shadow-lg py-8 px-4 w-full max-w-4xl mx-auto">
        <CardContent className="p-0 flex justify-center">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "flex justify-center w-full max-w-3xl",
                card: "bg-transparent shadow-none p-0",
                navbar: "hidden",
                pageScrollBox: "p-0",
                profileSection: "p-6",
                profilePage: "p-4",
                headerTitle: "text-foreground",
                headerSubtitle: "text-foreground/80",
                formFieldLabel: "text-foreground font-medium",
                formFieldInput: "bg-background border-border text-foreground placeholder:text-foreground/70",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                formButtonReset: "text-foreground/80 hover:text-foreground",
                userPreviewMainIdentifier: "text-foreground",
                userPreviewSecondaryIdentifier: "text-foreground/80",
                userButtonPopoverCard: "bg-popover border border-border",
                userButtonPopoverText: "text-foreground",
                userButtonPopoverActionButton: "text-foreground/80 hover:text-foreground",
                formFieldWarningText: "text-yellow-500 dark:text-yellow-400",
                formFieldErrorText: "text-destructive"
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}