# Simple Makefile for a Go project

# Build the application
all: build test

build:
	@echo "Building for Mac..."
	@CGO_ENABLED=1 GOOS=darwin go build -o main cmd/api/main.go 2>build-errors.tmp || { \
		echo "\033[1;31mBuild failed. Error details:\033[0m" && \
		echo "----------------------------------------" && \
		cat build-errors.tmp && \
		echo "\n\033[1;33mOrganizing detailed error report...\033[0m" && \
		echo "Build Errors Log (Generated from make build)\n" > build-errors.log && \
		echo "Compilation Errors by Package:\n" >> build-errors.log && \
		for pkg in $$(grep -o "[^/]*/[^/]*/[^:]*" build-errors.tmp | sort -u); do \
			echo "\nPackage: $$pkg" >> build-errors.log && \
			grep -A 1 "$$pkg" build-errors.tmp | sed 's/^/   - /' >> build-errors.log; \
		done && \
		echo "\nDetailed error log has been written to: build-errors.log" && \
		rm build-errors.tmp && \
		exit 1; \
	}

# Run the application
run:
	@go run cmd/api/main.go &
	@npm install --prefer-offline --no-fund --prefix ./frontend
	@npm run dev --prefix ./frontend

# Database setup and management
db-setup: db-init migrate seed

# Reset database (clean and reinitialize)
db-reset:
	@echo "Resetting database..."
	@rm -f words.db
	@make db-setup

# Initialize SQLite database
db-init:
	@echo "Initializing SQLite database..."
	@touch words.db

# Create DB container
docker-run:
	@if docker compose up --build 2>/dev/null; then \
		: ; \
	else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose up --build; \
	fi

# Shutdown DB container
docker-down:
	@if docker compose down 2>/dev/null; then \
		: ; \
	else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose down; \
	fi

# Test the application
test:
	@echo "\033[1;34mRunning tests...\033[0m"
	@go test -v ./...

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Run database migrations
migrate:
	@echo "Running migrations..."
	@go build -o dbtools cmd/api/main.go
	@./dbtools migrate
	@rm -f dbtools

# Seed database with initial data
seed:
	@echo "Seeding database..."
	@go build -o dbtools cmd/api/main.go
	@./dbtools seed
	@./dbtools seed-activities
	@rm -f dbtools

# Live Reload
watch:
	@if command -v air > /dev/null; then \
		air; \
		echo "Watching...";\
	else \
		read -p "Go's 'air' is not installed on your machine. Do you want to install it? [Y/n] " choice; \
		if [ "$$choice" != "n" ] && [ "$$choice" != "N" ]; then \
			go install github.com/air-verse/air@latest; \
			air; \
		fi \
	fi

.PHONY: all build run test clean watch
