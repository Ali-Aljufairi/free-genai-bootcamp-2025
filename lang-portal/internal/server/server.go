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
	// Initialize Neo4j connection with better error handling
	neo4jConfig := config.DefaultNeo4jConfig()
	ctx := context.Background()
	var neo4jDriver neo4j.DriverWithContext
	
	neo4jDriver, neo4jErr := neo4jConfig.Connect(ctx)
	if neo4jErr != nil {
		log.Printf("Warning: Neo4j connection failed: %v. Neo4j-dependent routes will be skipped.", neo4jErr)
		// Continue without Neo4j
		neo4jDriver = nil
	} else {
		log.Println("Neo4j connection established successfully")
	}

	// Initialize SQLite database
	sqlDB, err := database.New("./words.db")
	if err != nil {
		return nil, fmt.Errorf("failed to initialize SQLite database: %w", err)
	}

	server := &FiberServer{
		App:    fiber.New(fiber.Config{
			DisableStartupMessage: false,
		}),
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
	if s.neo4j != nil {
		if err := s.neo4j.Close(ctx); err != nil {
			log.Printf("Error closing Neo4j connection: %v", err)
		}
	}
	return s.App.Shutdown()
}

func (s *FiberServer) Health() map[string]interface{} {
	health := map[string]interface{}{
		"status": "healthy",
		"sqlite": s.sqlDB.Health(),
	}
	
	if s.neo4j != nil {
		health["neo4j"] = "connected"
	} else {
		health["neo4j"] = "not connected"
	}
	
	return health
}
