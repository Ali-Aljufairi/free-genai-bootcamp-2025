"use client"

import { UserProfile } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your account and application preferences.</p>
            </div>

            <Card className="border-border/50 shadow-lg">
                <CardContent className="p-0">
                    <UserProfile
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-transparent shadow-none p-0",
                                navbar: "hidden",
                                pageScrollBox: "p-0",
                                headerTitle: "text-foreground",
                                headerSubtitle: "text-muted-foreground",
                                formFieldLabel: "text-foreground font-medium",
                                formFieldInput: "bg-background border-border text-foreground placeholder:text-muted-foreground",
                                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                                formButtonReset: "text-muted-foreground hover:text-foreground",
                                userPreviewMainIdentifier: "text-foreground",
                                userPreviewSecondaryIdentifier: "text-muted-foreground",
                                userButtonPopoverCard: "bg-popover border border-border",
                                userButtonPopoverText: "text-foreground",
                                userButtonPopoverActionButton: "text-muted-foreground hover:text-foreground",
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