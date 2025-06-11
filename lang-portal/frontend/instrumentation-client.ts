import posthog from "posthog-js"
if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) {
    console.warn("PostHog key missing – analytics disabled")
  } else if (!(posthog as any)._initialized) { // prevent double-init on HMR
    posthog.init(key, {
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    })
    ;(posthog as any)._initialized = true
  }
}