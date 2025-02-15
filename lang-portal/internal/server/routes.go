package server

import (
	"lang-portal/internal/handlers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *FiberServer) RegisterFiberRoutes() {
	// Apply CORS middleware
	s.App.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS,PATCH",
		AllowHeaders:     "Accept,Authorization,Content-Type",
		AllowCredentials: false, // credentials require explicit origins
		MaxAge:           300,
	}))

	s.App.Get("/", s.HelloWorldHandler)

	s.App.Get("/health", s.healthHandler)

	// Dashboard routes
	dashboardHandler := handlers.NewDashboardHandler(s.db)
	s.App.Get("/api/v1/dashboard/last_study_session", dashboardHandler.GetLastStudySession)
	s.App.Get("/api/v1/dashboard/study_progress", dashboardHandler.GetStudyProgress)
	s.App.Get("/api/v1/dashboard/quick-stats", dashboardHandler.GetQuickStats)

	// Study session routes
	studySessionHandler := handlers.NewStudySessionHandler(s.db)
	s.App.Get("/api/v1/study_sessions", studySessionHandler.GetStudySessions)
	s.App.Get("/api/v1/study_sessions/:id/words", studySessionHandler.GetStudySessionWords)
	s.App.Get("/api/v1/study_progress", studySessionHandler.StudyProgress)

	// Word routes
	wordHandler := handlers.NewWordHandler(s.db)
	s.App.Get("/api/v1/words", wordHandler.GetWords)
}

func (s *FiberServer) HelloWorldHandler(c *fiber.Ctx) error {
	resp := fiber.Map{
		"message": "Hello World",
	}

	return c.JSON(resp)
}

func (s *FiberServer) healthHandler(c *fiber.Ctx) error {
	return c.JSON(s.db.Health())
}
