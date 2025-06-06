"use client";

import { SignUp } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-50/80 via-blue-50/60 to-indigo-50/70 dark:from-slate-900/90 dark:via-blue-950/80 dark:to-indigo-950/90">
            <Card className="p-6 shadow-lg border border-blue-100/50 dark:border-blue-900/50 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold">Start Your Learning Journey</h1>
                    <p className="text-sm text-muted-foreground">Create an account to begin improving your language skills</p>
                </div>
                <SignUp
                    appearance={{
                        elements: {
                            formButtonPrimary:
                                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
                            card: "bg-transparent shadow-none",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            footerAction: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        }
                    }}
                    afterSignUpUrl="/study"
                    signInUrl="/sign-in"
                />
            </Card>
        </div>
    );
}