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
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tsconfig.app.json      # App-specific TS config
│   ├── tsconfig.node.json     # Node-specific TS config
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── postcss.config.js      # PostCSS configuration
├── .air.toml                  # Air live reload configuration
├── .gitignore                 # Git ignore rules
├── .goreleaser.yml            # GoReleaser configuration
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Docker Compose services
├── go.mod                     # Go module definition
├── Makefile                   # Build and development commands
└── README.md                  # Project documentation
```

### Overview
This project is structured into different modules to ensure clean code separation and maintainability.

- **Backend (`cmd/`, `internal/`)**: The backend is written in Go, with an API server and database layer.
- **Frontend (`frontend/`)**: A React-based application using TypeScript, Vite, Tailwind, and PostCSS.
- **Configuration & Deployment**:
  - Uses Docker (`Dockerfile`, `docker-compose.yml`) for containerized deployment.
  - GoReleaser (`.goreleaser.yml`) is used for automated releases.
  - Live reload enabled via Air (`.air.toml`).

### Development Setup
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

### Contributing
- Follow the guidelines mentioned in `.github/`.
- Ensure code follows best practices and is well-documented.
- Submit a pull request for any changes.


