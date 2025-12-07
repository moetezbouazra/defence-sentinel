# Defence Sentinel

AI-powered security surveillance system.

## Setup

1.  **Prerequisites**: Docker and Docker Compose.
2.  **Start Services**:
    ```bash
    docker-compose up --build
    ```

## Services

-   **Frontend**: http://localhost:5173
-   **Backend**: http://localhost:3001
-   **AI Service**: http://localhost:8000
-   **Mosquitto**: 1883 (MQTT), 9001 (WebSockets)
-   **Postgres**: 5432
-   **Redis**: 6379

## Development

-   **Frontend**: `cd frontend && npm run dev`
-   **Backend**: `cd backend && npm run dev`
-   **AI Service**: `cd ai-service && uvicorn main:app --reload`
