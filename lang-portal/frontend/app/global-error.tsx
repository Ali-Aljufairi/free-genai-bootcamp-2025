"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Report the error to Sentry
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <Alert variant="destructive" className="max-w-lg">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Something went wrong!</AlertTitle>
                        <AlertDescription className="mt-2 mb-4">
                            An unexpected error occurred. Our team has been notified.
                            {error.digest && (
                                <div className="mt-2 text-xs font-mono">
                                    Error ID: {error.digest}
                                </div>
                            )}
                        </AlertDescription>
                        <div className="flex gap-2">
                            <Button onClick={reset} variant="outline">
                                Try again
                            </Button>
                            <Button
                                onClick={() => window.location.href = "/"}
                                variant="default"
                            >
                                Go home
                            </Button>
                        </div>
                    </Alert>
                </div>
            </body>
        </html>
    );
}
