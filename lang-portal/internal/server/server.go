package server

import (
	"github.com/gofiber/fiber/v2"

	"lang-portal/internal/database"
)

type FiberServer struct {
	*fiber.App

	db *database.DB
}

func New() *FiberServer {
	db, err := database.New("./data.db")
	if err != nil {
		panic(err)
	}

	server := &FiberServer{
		App: fiber.New(fiber.Config{
			ServerHeader: "lang-portal",
			AppName:      "lang-portal",
		}),
		db: db,
	}

	return server
}
