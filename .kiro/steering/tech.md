# Technology Stack

## Build System & Package Management
- **Go**: Uses Go modules (`go.mod`) with Make-based build system
- **Python**: Uses `uv` package manager with `pyproject.toml` configuration
- **Node.js**: Uses npm/bun for frontend dependencies
- **Make**: Primary build automation tool for Go projects

## Core Technologies

### Backend
- **Go 1.23+**: Primary backend language using Fiber web framework
- **GORM**: ORM for database operations
- **SQLite**: Primary database for most services
- **Neo4j**: Graph database for specific use cases

### Frontend
- **Next.js 15**: React-based frontend framework
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Component library for UI primitives
- **Clerk**: Authentication and user management

### Python Services
- **FastAPI**: Web framework for Python microservices
- **Streamlit**: Interactive web applications
- **LangChain/LangGraph**: AI agent frameworks
- **Groq**: LLM API integration
- **Pydantic**: Data validation and serialization

### AI/ML Libraries
- **Google GenAI**: AI model integration
- **OpenAI/Groq APIs**: Language model services
- **MediaPipe**: Computer vision for ASL recognition
- **Speech recognition libraries**: Audio processing

## Common Commands

### Go (lang-portal)
```bash
make build          # Build the application
make run            # Run backend + frontend dev servers
make test           # Run test suite
make watch          # Live reload with air
make docker-run     # Start with Docker Compose
make docker-down    # Stop Docker containers
make db-reset       # Reset and reinitialize database
```

### Python Services
```bash
uv run main.py      # Run Python applications
uv sync             # Install dependencies
uv add <package>    # Add new dependency
```

### Frontend
```bash
npm run dev         # Development server
npm run build       # Production build
npm run lint        # Code linting
```

## Containerization
- **Docker**: Multi-stage builds for production
- **Docker Compose**: Local development and service orchestration
- **Kubernetes**: Production deployment configurations
- **GitHub Container Registry**: Image storage

## Development Tools
- **Air**: Live reload for Go applications
- **Sentry**: Error tracking and monitoring
- **PostHog**: Analytics and feature flags
- **VS Code**: Recommended IDE with workspace configurations