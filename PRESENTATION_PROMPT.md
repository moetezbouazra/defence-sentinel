# Presentation Generation Prompt

Generate a professional presentation about the **Defence Sentinel** AI-powered security surveillance system project with the following specifications:

## Project Overview
Defence Sentinel is an IoT-based security surveillance system that uses AI-powered object detection (YOLO11n) to monitor camera feeds in real-time and send alerts when threats are detected.

## Architecture Components

### Core Services
- **Backend**: Express.js + TypeScript + Prisma ORM + Socket.IO + MQTT client
- **Frontend**: React + Vite + TanStack Query + shadcn/ui (indigo/violet dark theme)
- **AI Service**: FastAPI + YOLO11n (Ultralytics) for object detection
- **Database**: PostgreSQL for persistent storage
- **Message Broker**: Mosquitto MQTT for IoT device communication
- **Notification System**: **n8n workflow automation** for email alerts
- **Caching**: Redis for performance optimization
- **Containerization**: Docker Compose for orchestration

### Data Flow
1. **IoT Simulator** publishes camera frames via MQTT (`cameras/{deviceId}/motion` and `cameras/{deviceId}/image`)
2. **Backend** receives MQTT messages, creates events, sends images to AI service
3. **AI Service** performs YOLO11n detection, returns annotated images + detections with confidence scores
4. **Backend** analyzes threat levels (person >65% = HIGH/CRITICAL), creates alerts
5. **n8n** receives webhook notifications and sends professional HTML emails to device owners
6. **Socket.IO** pushes real-time updates to frontend dashboard

### Key Features
- **Real-time Object Detection**: YOLO11n identifies persons, vehicles, and other objects
- **Threat Level Classification**: CRITICAL (person >80%), HIGH (person >65%), MEDIUM (vehicles), LOW (other)
- **User-Based Ownership**: Each camera belongs to a user, alerts sent to owner's email
- **Email Notifications via n8n**: Automated workflow sends HTML emails with annotated images, timestamps, and detection details
- **Manual Camera Triggers**: Dashboard button to explicitly capture and analyze images on-demand
- **Image Storage**: Filesystem-based with Sharp compression (original, thumbnails, annotated)
- **Responsive Dashboard**: Modern UI with Framer Motion animations, lazy loading, empty states
- **Analytics**: Timeline view, detection statistics, threat distribution charts

### Email Notification System (n8n)
- **Workflow**: Backend sends webhook → n8n workflow → SMTP email delivery
- **Content**: Professional HTML template with gradient design, embedded annotated detection image (inline), color-coded threat levels
- **Routing**: Emails automatically sent to the authenticated user who owns the camera (user-based routing)
- **Trigger**: HIGH/CRITICAL alerts (person detected with >65% confidence)
- **Customization**: n8n allows visual workflow editing, multi-channel notifications (email, SMS, Slack, etc.)

### Technical Highlights
- **MQTT Topics**: `cameras/{deviceId}/motion`, `cameras/{deviceId}/image`, `cameras/{deviceId}/status`
- **Real-time Communication**: Socket.IO events (`event:new`, `event:update`, `alert:new`, `device:status`)
- **Database Relations**: User → Devices (one-to-many), User → Alerts (one-to-many), Event → Detections (one-to-many)
- **Authentication**: JWT-based with localStorage storage, axios interceptors
- **Color Scheme**: OKLCH color space with indigo/violet primary palette
- **Deployment**: Docker Compose with selective volume mounts for hot-reload

## Presentation Structure Suggestions

### Slide 1: Title
- Project name, tagline, team/author info

### Slide 2-3: Problem Statement & Solution
- Security monitoring challenges
- How AI + IoT solves them

### Slide 4: System Architecture Diagram
- Show all services and data flow (IoT → MQTT → Backend → AI → n8n → Email)

### Slide 5: Technology Stack
- Frontend, Backend, AI, Database, Message Broker, Automation (n8n)

### Slide 6: AI Object Detection
- YOLO11n model, confidence scores, threat level classification
- Show annotated image examples

### Slide 7: Email Notification Workflow (n8n)
- Diagram: Threat detected → Webhook → n8n workflow → SMTP → User inbox
- Screenshot of n8n workflow canvas
- Sample email template

### Slide 8: User Experience
- Dashboard screenshots (device grid, alerts, analytics, timeline)
- Manual trigger feature
- Real-time updates

### Slide 9: Key Features
- Real-time detection, user-based ownership, automated alerts via n8n, responsive UI

### Slide 10: Database Schema
- User-Device-Alert-Event-Detection relationships

### Slide 11: Demo/Results
- Live system screenshots, sample detections, alert emails

### Slide 12: Future Enhancements
- Multi-user device assignment, mobile app, advanced analytics, facial recognition, integration with more n8n automation channels (Slack, Telegram, etc.)

### Slide 13: Conclusion
- Summary of achievements, technologies learned, impact

## Visual Elements to Include
- Architecture diagram with all services
- n8n workflow screenshot showing webhook → email flow
- Sample annotated detection images
- Dashboard UI screenshots
- Email notification template preview
- Database schema diagram
- MQTT message flow diagram
- Color-coded threat level examples (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=green)

## Tone & Style
- Professional, technical, suitable for university project presentation
- Clear explanations of complex concepts
- Emphasis on real-world application and scalability
- Highlight the use of modern technologies (n8n for automation, YOLO11n for AI, Socket.IO for real-time, Docker for deployment)

## Deliverables
Generate presentation slides in **PowerPoint (.pptx)** or **Google Slides** format with clean, modern design matching the project's indigo/violet theme.
