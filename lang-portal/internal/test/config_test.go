package test

import (
	"log"
	"os"
	"testing"
	"time"
)

// TestMain is the main test configuration function that sets up the testing environment
// for all test files in the project. It configures test flags, initializes test settings,
// and implements a safety timeout to prevent tests from running indefinitely.
//
// The function performs the following setup:
// 1. Enables verbose test output with color formatting for better readability
// 2. Initializes the testing package with default configurations
// 3. Sets up a global timeout mechanism to prevent test hangs
// 4. Executes all tests and handles the exit status
func TestMain(m *testing.M) {
	// Enable verbose test output and colored test results for better readability
	// These environment variables affect how the test output is displayed
	os.Setenv("GOFLAGS", "-v")
	os.Setenv("GO_TEST_COLOR", "1")

	// Initialize the testing package with default configurations
	// This ensures proper test setup before execution
	testing.Init()

	// Set a global timeout of 30 seconds to prevent tests from hanging
	// This safety mechanism ensures tests don't run indefinitely
	// If any test exceeds this timeout, the process will be terminated
	go func() {
		time.Sleep(30 * time.Second)
		log.Fatal("Tests timed out after 30 seconds")
	}()

	// Execute all tests and exit with the appropriate status code
	// m.Run() runs all tests and returns an exit code (0 for success, non-zero for failure)
	os.Exit(m.Run())
}

/*
Test Directory Structure:

/internal/test/
├── config_test.go           - Main test configuration (this file)
├── handlers/                - API handler unit tests
│   ├── group_handlers_test.go
│   ├── word_handlers_test.go
│   ├── study_activity_handlers_test.go
│   └── study_session_handlers_test.go
├── integration/            - End-to-end integration tests
└── server/routes_test.go   - API routing tests

This file serves as the main test configuration for the project.
It sets up the testing environment with:
1. Verbose output for detailed test results
2. Colored output for better visibility
3. A 30-second timeout safety mechanism
4. Proper test initialization and execution

Note: The timeout mechanism can be adjusted by modifying the time.Sleep duration
if longer-running tests are needed.
*/
