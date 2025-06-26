import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    // This will throw an error for testing purposes
    throw new Error("Test server-side error from API route");
  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: "An error occurred on the server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simulate some processing that might fail
    if (body.shouldFail) {
      throw new Error("Intentional API error for testing");
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: "api",
        endpoint: "sentry-test-error",
      },
      extra: {
        requestBody: request.body,
        userAgent: request.headers.get("user-agent"),
      },
    });
    
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
