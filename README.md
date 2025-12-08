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
-   **n8n Automation**: http://localhost:5678 (admin/admin123)
-   **IoT Simulator**: http://localhost:4000
-   **Mosquitto**: 1883 (MQTT), 9001 (WebSockets)
-   **Postgres**: 5432
-   **Redis**: 6379

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
