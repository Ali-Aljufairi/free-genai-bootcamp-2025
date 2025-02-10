package server

import (
	"github.com/gofiber/fiber/v2"

	"lang-portal/internal/database"
)

type FiberServer struct {
	*fiber.App

	db database.Service
}

func New() *FiberServer {
	server := &FiberServer{
		App: fiber.New(fiber.Config{
			ServerHeader: "lang-portal",
			AppName:      "lang-portal",
		}),

		db: database.New(),
	}

	return server
}
