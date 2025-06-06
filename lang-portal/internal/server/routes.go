package server

import (
	"lang-portal/internal/handlers"
	"log"

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
	dashboardHandler := handlers.NewDashboardHandler(s.sqlDB)
	s.App.Get("/api/langportal/dashboard/last_study_session", dashboardHandler.GetLastStudySession)
	s.App.Get("/api/langportal/dashboard/study_progress", dashboardHandler.GetStudyProgress)
	s.App.Get("/api/langportal/dashboard/quick-stats", dashboardHandler.GetQuickStats)

	// Study session routes
	studySessionHandler := handlers.NewStudySessionHandler(s.sqlDB)
	s.App.Get("/api/langportal/study_sessions", studySessionHandler.GetStudySessions)
	s.App.Get("/api/langportal/study_sessions/:id", studySessionHandler.GetStudySession)
	s.App.Get("/api/langportal/study_sessions/:id/words", studySessionHandler.GetStudySessionWords)
	s.App.Post("/api/langportal/study_sessions", studySessionHandler.CreateStudySession)
	s.App.Post("/api/langportal/study_sessions/:id/words/:word_id/review", studySessionHandler.ReviewWord)

	// Flashcard routes
	flashcardHandler := handlers.NewFlashcardHandler(s.sqlDB)
	s.App.Get("/api/langportal/flashcards/quiz", flashcardHandler.GetQuizWords)
	s.App.Post("/api/langportal/flashcards/submit-quiz", flashcardHandler.SubmitQuizAnswers)
	s.App.Get("/api/langportal/flashcards/learned", flashcardHandler.GetLearnedWords)
	s.App.Post("/api/langportal/flashcards/reset-progress", flashcardHandler.ResetProgress)

	// Group routes
	groupHandler := handlers.NewGroupHandler(s.sqlDB)
	s.App.Get("/api/langportal/groups", groupHandler.GetGroups)
	s.App.Get("/api/langportal/groups/:id", groupHandler.GetGroup)
	s.App.Get("/api/langportal/groups/:id/words", groupHandler.GetGroupWords)
	s.App.Get("/api/langportal/groups/:id/study_sessions", groupHandler.GetGroupStudySessions)

	// Study activity routes
	studyActivityHandler := handlers.NewStudyActivityHandler(s.sqlDB)
	s.App.Get("/api/langportal/study_activities", studyActivityHandler.GetStudyActivities)
	s.App.Get("/api/langportal/study_activities/:id", studyActivityHandler.GetStudyActivity)
	s.App.Get("/api/langportal/study_activities/:id/sessions", studyActivityHandler.GetStudyActivitySessions)
	s.App.Post("/api/langportal/study_activities", studyActivityHandler.CreateStudyActivity)

	// Word routes
	wordHandler := handlers.NewWordHandler(s.sqlDB)
	s.App.Get("/api/langportal/words", wordHandler.GetWords)
	s.App.Get("/api/langportal/words/random", wordHandler.GetRandomWord)
	s.App.Get("/api/langportal/words/:id", wordHandler.GetWord)
	s.App.Post("/api/langportal/words", wordHandler.CreateWord)

	// JLPT SQLite-based routes that don't require Neo4j
	jlptSQLiteHandler := handlers.NewJLPTSQLiteHandler(s.sqlDB)
	s.App.Get("/api/langportal/jlpt/:level/random-kanji", jlptSQLiteHandler.GetRandomKanji)

	// Add Neo4j-dependent routes only if Neo4j is available
	if s.neo4j != nil {
		jlptHandler := handlers.NewJLPTHandler(s.sqlDB.GetDB(), s.neo4j)
		s.App.Post("/api/langportal/jlpt/import", jlptHandler.ImportJLPTLevel)
		setupNeo4jDependentRoutes(s.App, jlptHandler)
	} else {
		log.Printf("Neo4j connection not available, skipping Neo4j-dependent routes")
	}
}

func setupNeo4jDependentRoutes(app *fiber.App, h *handlers.JLPTHandler) {
	app.Get("/api/langportal/kanji/:kanji/compounds", h.GetKanjiCompounds)
	app.Get("/api/langportal/kanji/validate-compound", h.ValidateKanjiCompound)
	app.Post("/api/langportal/neo4j/cleanup", h.CleanupNeo4j)

	// Game endpoints
	app.Get("/api/langportal/game/kanji-compound/start/:level", h.StartKanjiCompoundGame)
	app.Get("/api/langportal/game/kanji-compound/compounds/:kanji/:level", h.GetGameCompounds)
	app.Post("/api/langportal/game/kanji-compound/validate", h.ValidateGameCompound)
	app.Get("/api/langportal/game/kanji-compound/choices/:kanji/:level", h.GetKanjiChoices)
}

func (s *FiberServer) HelloWorldHandler(c *fiber.Ctx) error {
	resp := fiber.Map{
		"message": "Hello World",
	}

	return c.JSON(resp)
}

func (s *FiberServer) healthHandler(c *fiber.Ctx) error {
	return c.JSON(s.Health())
}