# Defence Sentinel

AI-powered security surveillance system.

## Setup

1.  **Prerequisites**: Docker and Docker Compose.
2.  **Start Services**:
    ```bash
    docker-compose up --build
    ```

    The backend will automatically:
    - Wait for PostgreSQL to be ready
    - Run database migrations
    - Generate Prisma client
    - Start the application

## Database

Database schema and migrations are handled automatically when starting the services. The backend container includes a startup script that:

- Waits for PostgreSQL to be healthy
- Applies any pending migrations
- Generates the Prisma client

For development outside Docker, you can manually run migrations with:
```bash
cd backend
npx prisma migrate deploy
```

## Services

-   **Frontend**: http://localhost:5174
-   **Backend**: http://localhost:3001
-   **AI Service**: http://localhost:8000
-   **n8n Automation**: http://localhost:5678 (admin/admin123)
-   **IoT Simulator**: http://localhost:4000
-   **Mosquitto**: 1883 (MQTT), 9001 (WebSockets)
-   **Postgres**: 5433
-   **Redis**: 6380

## Features

- 🎯 Real-time object detection with YOLO11n
- 📱 Manual camera trigger system
- 🔔 Automated notifications via n8n (Email & WhatsApp)
- 📊 Analytics dashboard with timeline views
- 🎨 Modern dark theme UI with animations
- 🔐 Rate limiting, validation, and authentication
- 📸 Image storage with thumbnails and annotations

## Notifications Setup

Defence Sentinel integrates with **n8n** for automated notifications. When threats are detected, webhooks are sent to n8n which can trigger:
- 📧 Gmail email alerts with annotated images
- 💬 WhatsApp messages via Twilio
- 📲 Custom integrations (Slack, Discord, SMS, etc.)

**See [N8N_SETUP_GUIDE.md](./N8N_SETUP_GUIDE.md)** for detailed setup instructions.

## Development

-   **Frontend**: `cd frontend && yarn dev`
-   **Backend**: `cd backend && yarn dev`
-   **AI Service**: `cd ai-service && uvicorn main:app --reload`
