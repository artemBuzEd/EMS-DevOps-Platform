# EMS DevOps Platform


## 🚀 Getting Started

### Prerequisites
- Docker Desktop
- .NET 8 SDK (for local development)

### Running with Docker Compose
1. **Clone the repository:**
   ```bash
   git clone https://github.com/artemBuzEd/EMS-DevOps-Platform.git
   cd EMS-DevOps-Platform
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d --build
   ```
   *Note: The `--build` flag ensures standard changes to code are recompiled into containers.*

3. **Verify Status:**
   ```bash
   docker-compose ps
   ```

### 🔧 Configuration
The project uses environment variables for configuration. See `docker-compose.yml` for default values.
- **Ports:**
    - Aggregator: `8083`
    - User Profile: `8080`
    - Event Catalog: `8081`
    - Venue: `8082`

## 🐳 DevOps Features
- **Optimized DockerImages**: Uses Multi-stage builds and Alpine Linux for small footprint (~100MB).
- **Security**: Containers run as non-root user (`USER app`).
- **Resilience**: Service startup is orchestrated using Docker Healthchecks (Apps wait for DBs to be healthy).

## ⚠️ Troubleshooting on Mac (M1/M2/M3)
If you see performance warnings, ensure you are **not** forcing `platform: linux/amd64` in docker-compose. I am doing this because while building images, I get an error due to arm64. You can try removing `platform: linux/amd64`. As soon as I find a solution to this problem, I will update the docker-compose file. The .NET images support Apple Silicon natively, so try it on your machine.