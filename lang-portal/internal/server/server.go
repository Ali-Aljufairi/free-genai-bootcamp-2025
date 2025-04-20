package server

import (
	"context"
	"fmt"
	"lang-portal/internal/config"
	"lang-portal/internal/database"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"gorm.io/gorm"
)

type FiberServer struct {
	App    *fiber.App
	sqlDB  *database.DB
	gormDB *gorm.DB
	neo4j  neo4j.DriverWithContext
}

func NewFiberServer(gormDB *gorm.DB) (*FiberServer, error) {
	// Initialize Neo4j connection
	neo4jConfig := config.DefaultNeo4jConfig()
	ctx := context.Background()
	neo4jDriver, err := neo4jConfig.Connect(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create Neo4j driver: %w", err)
	}

	// Initialize SQLite database
	sqlDB, err := database.New("./words.db")
	if err != nil {
		return nil, fmt.Errorf("failed to initialize SQLite database: %w", err)
	}

	server := &FiberServer{
		App:    fiber.New(),
		sqlDB:  sqlDB,
		gormDB: gormDB,
		neo4j:  neo4jDriver,
	}

	server.RegisterFiberRoutes()
	return server, nil
}

func (s *FiberServer) Start(port string) error {
	log.Printf("Server is starting on port %s", port)
	return s.App.Listen(fmt.Sprintf(":%s", port))
}

func (s *FiberServer) Shutdown() error {
	ctx := context.Background()
	if err := s.neo4j.Close(ctx); err != nil {
		log.Printf("Error closing Neo4j connection: %v", err)
	}
	return s.App.Shutdown()
}

func (s *FiberServer) Health() map[string]interface{} {
	return map[string]interface{}{
		"status": "healthy",
		"sqlite": s.sqlDB.Health(),
		"neo4j":  "connected",
	}
}
