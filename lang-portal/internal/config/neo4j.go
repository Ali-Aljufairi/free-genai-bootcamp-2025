package config

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// Neo4jConfig holds the configuration for Neo4j connection
type Neo4jConfig struct {
	URI      string
	Username string
	Password string
}

// DefaultNeo4jConfig returns a default configuration for Neo4j
func DefaultNeo4jConfig() *Neo4jConfig {
	return &Neo4jConfig{
		URI:      getEnvOrDefault("NEO4J_URI", "bolt://localhost:7687"),
		Username: getEnvOrDefault("NEO4J_USERNAME", "neo4j"),
		Password: getEnvOrDefault("NEO4J_PASSWORD", "password"),
	}
}

// Connect establishes a connection to Neo4j using the configuration
func (c *Neo4jConfig) Connect(ctx context.Context) (neo4j.DriverWithContext, error) {
	// Create a context with timeout for faster failure if Neo4j is not available
	timeoutCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	
	driver, err := neo4j.NewDriverWithContext(c.URI, neo4j.BasicAuth(c.Username, c.Password, ""))
	if err != nil {
		return nil, fmt.Errorf("failed to create Neo4j driver: %w", err)
	}

	// Verify connection with timeout
	err = driver.VerifyConnectivity(timeoutCtx)
	if err != nil {
		driver.Close(ctx) // Clean up the driver if verification fails
		return nil, fmt.Errorf("failed to verify Neo4j connectivity: %w", err)
	}

	return driver, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
