package test

import (
	"log"
	"os"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	// Set test flags for better output
	os.Setenv("GOFLAGS", "-v")
	os.Setenv("GO_TEST_COLOR", "1")

	// Configure test settings
	testing.Init()

	// Run tests with a timeout
	go func() {
		time.Sleep(30 * time.Second)
		log.Fatal("Tests timed out after 30 seconds")
	}()

	// Run tests
	os.Exit(m.Run())
}
