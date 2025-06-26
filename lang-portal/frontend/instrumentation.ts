import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server instrumentation
    Sentry.init({
      dsn: "https://5f2aa379610a248fdb8e476f9680476a@o4509562367705088.ingest.de.sentry.io/4509562384023632",
      tracesSampleRate: 1,
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    Sentry.init({
      dsn: "https://5f2aa379610a248fdb8e476f9680476a@o4509562367705088.ingest.de.sentry.io/4509562384023632",
      tracesSampleRate: 1,
      debug: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
