# Language Learning Portal

A free bootcamp project focused on language learning using Generative AI technologies.

## Project Overview

This project aims to create an interactive platform for language learning, leveraging modern AI technologies to provide personalized learning experiences.

## Available Make Commands

Run build with tests:
```bash
make all
```

Build the application:
```bash
make build
```

Run the application:
```bash
make run
```

Create DB container:
```bash
make docker-run
```

Shutdown DB Container:
```bash
make docker-down
```

DB Integrations Test:
```bash
make itest
```

Live reload the application:
```bash
make watch
```

Run the test suite:
```bash
make test
```

## Project Structure

```
lang-portal/
├── .github/                   # GitHub specific configurations
├── cmd/                       # Main application entry points
│   └── api/                   # API server entry point
├── internal/                  # Private application code
│   ├── database/              # Database layer
│   │   └── database.go        # Database operations and health checks
│   └── server/                # Server implementation
├── frontend/                  # React frontend application
│   ├── public/                # Static assets
│   ├── src/                   # Frontend source code
│   └── package.json           # Frontend dependencies
└── [other configuration files]
```

### Components
- **Backend (`cmd/`, `internal/`)**: The backend is written in Go, with an API server and database layer.
- **Frontend (`frontend/`)**: A React-based application using TypeScript, Vite, Tailwind, and PostCSS.
- **Configuration & Deployment**: Uses Docker for containerized deployment with live reload capabilities.

## Getting Started

1. Clone the repository:
   ```sh
   git clone https://github.com/free-genai-bootcamp-2025/lang-portal.git
   cd lang-portal
   ```

2. Install dependencies and run the development server:
   - **Backend:**
     ```sh
     make run
     ```
   - **Frontend:**
     ```sh
     cd frontend
     npm install
     npm run dev
     ```

## Contributing

- Follow the guidelines mentioned in `.github/`
- Ensure code follows best practices and is well-documented
- Submit a pull request for any changes

## Available Make Commands

Run build with tests:
```bash
make all
```

Build the application:
```bash
make build
```

Run the application:
```bash
make run
```

Create DB container:
```bash
make docker-run
```

Shutdown DB Container:
```bash
make docker-down
```

DB Integrations Test:
```bash
make itest
```

Live reload the application:
```bash
make watch
```

Run the test suite:
```bash
make test
```