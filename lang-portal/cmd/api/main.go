package main

import (
	"context"
	"fmt"
	"lang-portal/internal/database"
	"lang-portal/internal/server"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	_ "github.com/joho/godotenv/autoload"
)

func gracefulShutdown(fiberServer *server.FiberServer, done chan bool) {
	// Create context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal.
	<-ctx.Done()

	log.Println("shutting down gracefully, press Ctrl+C again to force")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := fiberServer.ShutdownWithContext(ctx); err != nil {
		log.Printf("Server forced to shutdown with error: %v", err)
	}

	log.Println("Server exiting")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {
	// Check for database commands
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "migrate":
			db, err := database.New("words.db")
			if err != nil {
				log.Fatalf("Failed to connect to database: %v", err)
			}
			defer db.Close()
			if err := db.Migrate("internal/database/migrations"); err != nil {
				log.Fatalf("Failed to run migrations: %v", err)
			}
			log.Println("Migrations completed successfully")
			return
		case "seed":
			db, err := database.New("words.db")
			if err != nil {
				log.Fatalf("Failed to connect to database: %v", err)
			}
			defer db.Close()
			if err := db.SeedWords("internal/database/seeds/words.json", "default"); err != nil {
				log.Fatalf("Failed to seed database: %v", err)
			}
			log.Println("Database seeding completed successfully")
			return
		case "seed-activities":
			db, err := database.New("words.db")
			if err != nil {
				log.Fatalf("Failed to connect to database: %v", err)
			}
			defer db.Close()
			if err := db.SeedStudyActivities("internal/database/seeds/study_activities.json"); err != nil {
				log.Fatalf("Failed to seed study activities: %v", err)
			}
			if err := db.SeedStudySessions("internal/database/seeds/study_sessions.json"); err != nil {
				log.Fatalf("Failed to seed study sessions: %v", err)
			}
			log.Println("Study activities and sessions seeding completed successfully")
			return
		}
	}

	// Start server if no database commands
	server := server.New()
	server.RegisterFiberRoutes()

	// Create a done channel to signal when the shutdown is complete
	done := make(chan bool, 1)

	go func() {
		port, _ := strconv.Atoi(os.Getenv("PORT"))
		err := server.Listen(fmt.Sprintf(":%d", port))
		if err != nil {
			panic(fmt.Sprintf("http server error: %s", err))
		}
	}()

	// Run graceful shutdown in a separate goroutine
	go gracefulShutdown(server, done)

	// Wait for the graceful shutdown to complete
	<-done
	log.Println("Graceful shutdown complete.")
}
