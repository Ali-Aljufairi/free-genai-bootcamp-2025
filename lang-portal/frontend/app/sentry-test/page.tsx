"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const throwClientError = () => {
    throw new Error("Test client-side error from Sentry test page");
  };

  const throwAsyncError = async () => {
    try {
      throw new Error("Test async error from Sentry test page");
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const captureMessage = () => {
    Sentry.captureMessage("Test message from Sentry test page", "info");
  };

  const captureCustomEvent = () => {
    Sentry.addBreadcrumb({
      message: "User clicked custom event button",
      level: "info",
      category: "ui",
    });
    
    Sentry.captureMessage("Custom event triggered", "warning");
  };

  const triggerApiError = async () => {
    try {
      const response = await fetch("/api/sentry-test-error");
      if (!response.ok) {
        throw new Error("API error occurred");
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Sentry Integration Test</h1>
        <p className="text-muted-foreground">
          Use these buttons to test different types of Sentry error reporting
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Client Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Throws an unhandled client-side error
            </p>
            <Button onClick={throwClientError} variant="destructive">
              Throw Client Error
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Async Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Captures an async error manually
            </p>
            <Button onClick={throwAsyncError} variant="outline">
              Throw Async Error
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Info Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sends an info message to Sentry
            </p>
            <Button onClick={captureMessage} variant="secondary">
              Send Message
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sends a custom event with breadcrumbs
            </p>
            <Button onClick={captureCustomEvent} variant="default">
              Send Custom Event
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Triggers an API error (if endpoint exists)
            </p>
            <Button onClick={triggerApiError} variant="outline">
              Trigger API Error
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            After clicking the buttons above, check your Sentry dashboard at{" "}
            <a 
              href="https://sorami.sentry.io/projects/lang-portal-frontend/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://sorami.sentry.io/projects/lang-portal-frontend/
            </a>{" "}
            to see the captured errors and events.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
