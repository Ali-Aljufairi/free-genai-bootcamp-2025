/**
 * Simple script to test Sentry integration by sending a test event
 * Run this with: node test-sentry.js
 */

const Sentry = require("@sentry/node");

// Initialize Sentry for this test script
Sentry.init({
  dsn: "https://5f2aa379610a248fdb8e476f9680476a@o4509562367705088.ingest.de.sentry.io/4509562384023632",
  tracesSampleRate: 1,
  debug: true,
  environment: "test",
});

console.log("🚀 Testing Sentry integration...");

// Test 1: Send a test message
Sentry.captureMessage("Test message from Sentry integration script", "info");
console.log("✅ Sent test message");

// Test 2: Send a test error
try {
  throw new Error("Test error from Sentry integration script");
} catch (error) {
  Sentry.captureException(error);
  console.log("✅ Sent test error");
}

// Test 3: Send a test event with context
Sentry.withScope((scope) => {
  scope.setTag("test", "integration");
  scope.setLevel("warning");
  scope.setContext("test_info", {
    timestamp: new Date().toISOString(),
    script: "test-sentry.js",
    purpose: "Integration testing",
  });
  
  Sentry.captureMessage("Test event with context", "warning");
});
console.log("✅ Sent test event with context");

// Give Sentry some time to send the events
setTimeout(() => {
  console.log("🎉 Test complete! Check your Sentry dashboard at:");
  console.log("https://sorami.sentry.io/projects/lang-portal-frontend/");
  process.exit(0);
}, 2000);
