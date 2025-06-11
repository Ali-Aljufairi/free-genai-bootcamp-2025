import posthog from "posthog-js"

// Initialize PostHog when the client is loaded
if (typeof window !== "undefined") {
  try {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com"

    if (!key) {
      console.warn("PostHog key missing – analytics disabled. Set NEXT_PUBLIC_POSTHOG_KEY environment variable.")
    } else if (!(posthog as any)._initialized) { // prevent double-init on HMR
      console.log("Initializing PostHog analytics with host:", host)
      posthog.init(key, {
        api_host: "/ingest", // This should match your proxy setup in next.config.mjs
        ui_host: host,
        capture_pageview: true,
        capture_pageleave: true,
        capture_exceptions: true,
        autocapture: true,
        debug: process.env.NODE_ENV === "development",
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") {
            console.log("PostHog loaded successfully", ph)
          }
        }
      })
      ;(posthog as any)._initialized = true
      
      // Test event to verify instrumentation
      if (process.env.NODE_ENV === "development") {
        posthog.capture("instrumentation_loaded", { 
          timestamp: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error("Failed to initialize PostHog:", error)
  }
}

// Export posthog instance for use in other components
export default posthog