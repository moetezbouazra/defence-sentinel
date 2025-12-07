---
agent: agent
---
# Defence Sentinel - AI Copilot Instructions v3.0

## 🎯 Project Overview
Build **Defence Sentinel**, a complete AI-powered security surveillance system with real-time threat detection, premium web dashboard, and IoT simulation. This is a production-ready, full-stack application showcasing modern web technologies, computer vision, and real-time data processing.

---

## 🏗️ Core Architecture

### System Components
1. **AI Detection Service** - YOLOv11 object detection (Python/FastAPI)
2. **Backend API** - Node.js with real-time capabilities (Express/Fastify + TypeScript)
3. **Frontend Dashboard** - React with premium UI/UX (Vite + shadcn/ui + Framer Motion)
4. **IoT Simulation** - MQTT-based camera feed simulator (Node.js)
5. **Message Broker** - Mosquitto MQTT for device communication
6. **Database** - PostgreSQL 16 with Prisma ORM
7. **Cache Layer** - Redis for performance optimization

### Data Flow
```
IoT Simulator → MQTT Broker → Backend → AI Service → Backend → WebSocket → Frontend
                                    ↓
                              PostgreSQL + Redis
                                    ↓
                            (Future: n8n Webhooks for WhatsApp/Gmail)
```

---

## 💻 Technology Stack

### Frontend (Premium React Dashboard)
- **Core**: React 18+, TypeScript, Vite
- **UI**: shadcn/ui (run 'npx shadcn@latest mcp init --client vscode' to add the official shadcn/ui mcp server, after running it pause and tell me so I can let you resume the work), Tailwind CSS, Radix UI
- **Animations**: Framer Motion, canvas-confetti
- **State**: @tanstack/react-query, zustand
- **Real-time**: socket.io-client
- **Charts**: recharts
- **Icons**: lucide-react
- **Utilities**: react-hot-toast, date-fns, react-dropzone, react-zoom-pan-pinch, react-intersection-observer

### Backend (Node.js API)
- **Runtime**: Node.js 20+, TypeScript
- **Framework**: Express.js or Fastify (your choice)
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7
- **Real-time**: Socket.io
- **MQTT**: mqtt.js
- **Image Processing**: Sharp (for thumbnails)
- **Auth**: JWT + bcrypt
- **Validation**: Zod schemas

### AI Service (Python)
- **Model**: YOLOv11 from Ultralytics (https://github.com/ultralytics/ultralytics)
- **Framework**: FastAPI
- **Computer Vision**: OpenCV, PIL/Pillow
- **Python**: 3.11+

### Infrastructure
- **Docker**: Docker + Docker Compose for full stack
- **MQTT Broker**: Eclipse Mosquitto 2
- **Storage**: Local filesystem (can be upgraded to S3)

---

## 📊 Database Schema Design

### Core Models Needed (Prisma Schema)

**Users** - Authentication and user management
- Fields: id, email, name, passwordHash, role (USER/ADMIN), notificationPreferences (JSON), displayPreferences (JSON)
- displayPreferences structure: 
  ```json
  {
    "showConfidenceOnImages": true,
    "confidenceFormat": "percentage", // or "decimal"
    "showCameraName": true,
    "imageQuality": "original", // or "compressed"
    "thumbnailSize": "medium" // "small", "medium", "large"
  }
  ```

**Devices** - IoT camera devices
- Fields: id, name, deviceId (unique), location, status (ONLINE/OFFLINE/MAINTENANCE), lastSeen, metadata (JSON for battery, signal)

**Events** - Motion/detection events from cameras
- Fields: id, deviceId, type (MOTION/DETECTION/MANUAL), timestamp, imageUrl, thumbnailUrl, status (PENDING/PROCESSING/COMPLETED/FAILED), metadata (JSON)

**Detections** - AI detection results
- Fields: id, eventId, className (person/car/truck/etc), confidence (Float 0-1), bbox (JSON: {x, y, width, height}), threatLevel (LOW/MEDIUM/HIGH/CRITICAL), annotatedImageUrl, processingTimeMs

**Alerts** - Generated alerts for threats
- Fields: id, eventId, severity (INFO/WARNING/CRITICAL), title, message, acknowledged (boolean), acknowledgedAt, notificationsSent (JSON array: ["email", "whatsapp", "push"])

**Sessions** - User JWT sessions
- Fields: id, userId, token, expiresAt

### Enums
- Role: USER, ADMIN
- DeviceStatus: ONLINE, OFFLINE, MAINTENANCE
- EventType: MOTION, DETECTION, MANUAL
- EventStatus: PENDING, PROCESSING, COMPLETED, FAILED
- ThreatLevel: LOW, MEDIUM, HIGH, CRITICAL
- AlertSeverity: INFO, WARNING, CRITICAL

---

## 🎨 Frontend Dashboard Requirements

### Design System
- **Theme**: Dark mode by default with toggle option
- **Colors**: 
  - Primary: Blue (#3B82F6)
  - Success: Green (#10B981)
  - Warning: Amber (#F59E0B)
  - Danger: Red (#EF4444)
  - Background: Slate grays (#0F172A, #1E293B, #334155)
- **Typography**: Inter or Geist Sans
- **Animation Style**: Smooth, purposeful (200-300ms transitions)
- **Component Style**: Rounded corners (8-12px), subtle shadows, glassmorphism effects

### Pages to Build

**1. Dashboard (/)** 
- KPI cards with real-time stats (total events 24h, active threats, devices online/offline, detection accuracy)
- Live event feed sidebar with thumbnails and real-time Socket.io updates
- Charts: Events timeline (7 days), detection class distribution, threat levels over time
- Active alerts panel with unacknowledged count

**2. Events (/events)**
- View modes: Grid (default with image cards), List (compact table), Timeline
- Filters: Device, date range, event type, threat level, detection class
- Event cards show: 
  - Image with bounding boxes
  - **Camera name/ID prominently displayed** (e.g., badge or overlay on image based on user preference)
  - Device badge, timestamp, detection count, threat indicator
  - **Confidence scores on bounding boxes** (if enabled in user preferences)
- Click event: Open detail modal with zoomable image viewer, detection list, side-by-side original vs annotated toggle
- **IMPORTANT**: Display the number of persons detected prominently on each event card
- **IMPORTANT**: Show bounding boxes on images highlighting detected persons/objects
- **User Preferences Applied**: 
  - Respect user's "showConfidenceOnImages" setting (show/hide percentages on boxes)
  - Respect "confidenceFormat" (show as 87% or 0.87)
  - Respect "showCameraName" setting (display camera name overlay on image if enabled)

**3. Detections (/detections)**
- Statistics cards: Total detections, most detected class, average confidence
- Filterable table: Thumbnail, class, confidence, threat level, device, timestamp
- Class filter pills for quick filtering
- Confidence distribution histogram

**4. Alerts (/alerts)**
- Tabs: All, Unread, Critical, Acknowledged
- Alert list with severity badges (CRITICAL glows red with animation)
- Quick acknowledge button with optimistic UI updates
- Alert detail drawer with full event context

**5. Devices (/devices)**
- Device grid with status indicators (green dot = online)
- Last seen timestamp, event count (24h), battery/signal indicators
- Add device form, device settings
- Device detail page with event history

**6. Analytics (/analytics)**
- Date range selector
- Advanced charts: Hourly patterns, device comparison, detection trends
- Export to CSV/PDF

**7. Settings (/settings)**
- **Tabs**: Profile, Notifications, Display Preferences, AI Configuration, System
- **Profile**: User profile, password change
- **Notifications**: Notification preferences (email, WhatsApp, push - prepare for future n8n integration)
- **Display Preferences**: 
  - **Show Confidence Scores on Images**: Toggle to display/hide confidence percentages on bounding boxes and event cards
  - **Confidence Display Format**: Percentage slider (0-100%) or decimal (0.0-1.0)
  - **Show Camera Name on Images**: Toggle to display which camera captured the photo (overlay on image or in metadata section)
  - **Image Quality Preference**: Original vs Compressed for faster loading
  - **Thumbnail Size**: Small/Medium/Large grid options
- **AI Configuration**: 
  - Confidence thresholds (separate sliders for person, vehicle, other objects)
  - Enabled detection classes (checkboxes)
  - Minimum confidence for alerts (slider)
- **System**: Dark mode toggle, timezone settings, language (future)

### Premium UI/UX Features
- **Animations**: Framer Motion for page transitions, card hovers (scale + shadow), stagger animations for lists
- **Loading States**: Skeleton loaders, shimmer effects, progress bars
- **Empty States**: Friendly illustrations with clear CTAs
- **Micro-interactions**: Button hover effects, card lifts, smooth transitions
- **Real-time Indicators**: "Live" badge with pulse animation, connection status dot, notification badges
- **Image Handling**: Progressive loading, lazy loading, lightbox viewer with zoom/pan
- **Toast Notifications**: Beautiful toasts with react-hot-toast for all actions
- **Responsive**: Mobile-first, collapsible sidebar, touch-friendly

---

## 🤖 AI Service Requirements

### YOLOv11 Integration
- Use latest YOLOv11 from Ultralytics: https://github.com/ultralytics/ultralytics
- Start with YOLOv11n (nano) for speed, allow upgrading to YOLOv11s/m/l
- Download model on first run if not present

### Detection Configuration
**Primary Detection Classes** (with confidence thresholds):
- **person** - 0.65 (CRITICAL threat if detected)
- **car** - 0.70 (HIGH priority)
- **truck** - 0.70 (HIGH priority)
- **motorcycle** - 0.70 (HIGH priority)
- **bicycle** - 0.75 (MEDIUM priority)

**Ignore**: dog, cat, bird (unless confidence > 0.8)

### Threat Level Logic
- **CRITICAL**: Person detected with confidence > 0.80
- **HIGH**: Person detected with confidence 0.65-0.80
- **MEDIUM**: Vehicle detected (car, truck, motorcycle, bicycle)
- **LOW**: Other objects or low confidence detections

### API Endpoints Required
```
POST /api/v1/detect
- Input: Multipart form with image file
- Output: JSON with detections array, annotated_image_url, detection_count, processing_time_ms

GET /api/v1/health
- Service health check and model info

POST /api/v1/batch-detect (optional)
- Process multiple images
```

### Image Processing
- Resize images to 640x640 for inference
- Draw bounding boxes on detected objects with color coding by threat level
- **Add labels with class name and confidence percentage on boxes** (format based on user preference)
- **Add camera name/ID overlay on image** (if user preference enabled)
- Save both original and annotated images
- Support dynamic annotation: Generate different annotated versions based on user display preferences (with/without confidence, with/without camera name)
- Target: <300ms inference time per image

---

## 🔌 Backend API Requirements

### API Routes Structure
```
Authentication:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/refresh
  GET  /api/auth/me

Devices:
  GET    /api/devices
  POST   /api/devices
  GET    /api/devices/:id
  PUT    /api/devices/:id
  DELETE /api/devices/:id

Events:
  GET    /api/events (with pagination, filters)
  GET    /api/events/:id
  DELETE /api/events/:id
  POST   /api/events/upload (manual image upload)

Detections:
  GET /api/detections (filtered by event, class, threat level)
  GET /api/detections/stats

Alerts:
  GET    /api/alerts
  POST   /api/alerts/:id/acknowledge
  GET    /api/alerts/unread-count

Analytics:
  GET /api/analytics/dashboard (KPIs for last 24h)
  GET /api/analytics/timeline (events over time)
  GET /api/analytics/threats (threat distribution)
  GET /api/analytics/devices (device performance)

WebSocket:
  WS /ws/events (real-time event stream)
```

### MQTT Integration Logic
1. Connect to Mosquitto broker on startup
2. Subscribe to topics: `cameras/+/motion`, `cameras/+/image`, `cameras/+/status`
3. When motion event received:
   - Save image to filesystem
   - Forward image to AI service for detection
   - Parse detection results
   - Create Event and Detection records in database
   - If HIGH or CRITICAL threat: Generate Alert
   - Emit WebSocket event to connected dashboard clients
   - **FUTURE**: Trigger n8n webhook with event data for WhatsApp/Gmail notifications

### Real-time WebSocket Events
Emit these events to connected frontend clients:
- `event:new` - New event created
- `detection:new` - New detection processed
- `alert:new` - New alert generated
- `device:status` - Device came online/offline
- `stats:update` - Dashboard stats updated

### Alert Generation Rules
- Generate alert when:
  - Person detected with confidence > 0.65
  - Vehicle detected in restricted zone (future)
  - Device goes offline for > 5 minutes
- Store alert in database with severity level
- Mark as unacknowledged
- Emit WebSocket event to dashboard
- **FUTURE**: Call n8n webhook endpoint with alert data

---

## 📡 IoT Simulator Requirements

Create a Node.js script that simulates multiple ESP32-CAM devices:

### Features
- Simulate 3-5 virtual cameras (CAM_001, CAM_002, CAM_003, etc.)
- Random motion detection every 15-60 seconds per camera
- Use sample images from a folder OR capture from webcam
- Publish to MQTT topics with proper message format
- Simulate device heartbeat every 30 seconds

### MQTT Message Formats
```javascript
// Topic: cameras/{deviceId}/motion
{
  "deviceId": "CAM_001",
  "timestamp": "2024-12-06T10:30:00Z",
  "type": "motion_detected",
  "hasImage": true
}

// Topic: cameras/{deviceId}/image
// Send image as base64 in JSON or as binary payload
{
  "deviceId": "CAM_001",
  "image": "base64_encoded_jpeg_data...",
  "timestamp": "2024-12-06T10:30:00Z"
}

// Topic: cameras/{deviceId}/status
{
  "deviceId": "CAM_001",
  "status": "online",
  "batteryLevel": 85,
  "signalStrength": -45,
  "timestamp": "2024-12-06T10:30:00Z"
}
```

---

## 🔔 n8n Integration Planning (Future Implementation)

### Overview
Prepare the backend to support n8n automation workflows for sending intrusion alerts via WhatsApp and Gmail when critical threats are detected.

### Backend Webhook Endpoint
Create endpoint: `POST /api/webhooks/n8n/alert`
- This will be called BY n8n, not by backend
- OR: Backend calls n8n webhook when alert is generated

### Data to Send to n8n
When HIGH or CRITICAL alert is generated, send webhook with:
```json
{
  "alertId": "alert_123",
  "eventId": "event_456",
  "deviceId": "CAM_001",
  "deviceName": "Front Door Camera",
  "severity": "CRITICAL",
  "title": "Person Detected",
  "message": "High-confidence person detected at Front Door Camera",
  "timestamp": "2024-12-06T10:30:15Z",
  "detections": [
    {
      "class": "person",
      "confidence": 0.87,
      "bbox": [120, 45, 180, 320]
    }
  ],
  "imageUrl": "http://backend:3001/uploads/annotated/event_456.jpg",
  "thumbnailUrl": "http://backend:3001/uploads/thumbnails/event_456.jpg"
}
```

### n8n Workflow Design (To Be Implemented Later)
**Workflow 1: Critical Alert Notifications**
1. Webhook Trigger - Receives alert data from backend
2. Function Node - Format message for WhatsApp/Gmail
3. Gmail Node - Send email with:
   - Subject: "🚨 CRITICAL: {title}"
   - Body: HTML formatted with detection details
   - Attachment: Annotated image showing bounding boxes
   - Include: Timestamp, device name, confidence scores
4. WhatsApp Business Node (via Twilio or official API) - Send message:
   - Text: Alert message with timestamp and detection count
   - Image: Annotated image with bounding boxes
5. HTTP Request Node - Update alert in backend: Mark `notificationsSent: ["email", "whatsapp"]`

**Workflow 2: Daily Summary Report** (Optional)
- Cron trigger: Daily at 8:00 AM
- Fetch yesterday's statistics
- Generate HTML report
- Send via email

### Backend Preparation
- Store `notificationsSent` JSON array in Alert model
- Create endpoint to receive n8n callback: `PATCH /api/alerts/:id/notification-status`
- Add n8n webhook URL to environment variables
- Make alert data easily accessible via API for n8n to fetch

### Integration Notes
- n8n will be set up separately after core system is working
- Backend should expose clean webhook endpoint
- Images must be publicly accessible (or use presigned URLs)
- Consider rate limiting on webhook endpoint
- Log all notification attempts for debugging

---

## 🎯 Key Features & Requirements Summary

### Must-Have Features
1. ✅ YOLOv11 object detection with person/vehicle detection
2. ✅ Real-time dashboard with WebSocket updates
3. ✅ Event grid with **bounding boxes drawn on images**
4. ✅ **Display person count prominently on each event**
5. ✅ **Camera name/ID displayed on events** (respecting user preference)
6. ✅ **Confidence scores shown on bounding boxes** (optional via user preference)
7. ✅ **User display preferences**: Toggle confidence scores, camera names, confidence format (percentage/decimal)
8. ✅ MQTT-based IoT simulator with multiple cameras
9. ✅ Alert system with acknowledge functionality
10. ✅ Premium UI with Framer Motion animations
11. ✅ Dark mode with theme toggle
12. ✅ Responsive design (mobile + desktop)
13. ✅ Image viewer with zoom/pan capabilities
14. ✅ Statistics and analytics dashboard
15. ✅ Device management interface

### Future Enhancements (Prepare For)
- WhatsApp notifications via n8n (backend webhook ready)
- Gmail notifications via n8n (alert data API ready)
- Face recognition for known persons
- Video support with frame-by-frame detection
- Mobile app companion
- Geolocation mapping of devices
- AI model A/B testing dashboard

---

## 🚀 Implementation Phases

### Phase 1: Foundation & Infrastructure
- Set up Docker Compose with PostgreSQL, Redis, Mosquitto
- Initialize backend with Express/Fastify + TypeScript
- Set up Prisma with database schema
- Implement authentication (register, login, JWT)
- Create basic CRUD APIs for devices

### Phase 2: AI Service
- Set up Python FastAPI project
- Install Ultralytics YOLOv11
- Implement detection endpoint with bounding box drawing
- Save original and annotated images
- Test with sample images
- Optimize performance (<300ms inference)

### Phase 3: Backend Core
- Implement MQTT client and message handlers
- Create services: AI client, Socket.io, Alert generation
- Implement Event/Detection/Alert CRUD operations
- Set up image storage with Sharp for thumbnails
- Implement WebSocket real-time events
- Create analytics endpoints

### Phase 4: IoT Simulator
- Create Node.js MQTT publisher
- Implement virtual camera simulation
- Random motion detection with sample images
- Device status heartbeat
- Multiple camera support

### Phase 5: Frontend Dashboard
- Set up React + Vite + TypeScript
- Install shadcn/ui, Framer Motion, Recharts
- Create layout with sidebar and header
- Implement authentication pages
- Build Dashboard page with KPIs and charts
- Build Events page with grid/list views and filters
- **Implement image display with bounding boxes**
- **Show person count on event cards**
- Build Alerts page with acknowledge
- Build Detections and Analytics pages
- Build Devices management page
- Build Settings page
- Add WebSocket integration for real-time updates
- Implement all animations and micro-interactions

### Phase 6: Integration & Testing
- End-to-end testing of full flow
- Performance optimization
- Error handling and edge cases
- UI polish and animations
- Mobile responsive testing

### Phase 7: n8n Preparation (Future)
- Add webhook endpoint in backend
- Ensure images are accessible
- Create API endpoint for alert data
- Document n8n integration steps
- Provide sample n8n workflow JSON

---

## 🛠️ Development Guidelines

### Code Quality
- Use TypeScript strict mode everywhere
- Follow ESLint + Prettier configurations
- Write descriptive variable/function names
- Add comments for complex logic
- Handle all errors gracefully with try-catch
- Validate all inputs with Zod schemas

### Performance
- Lazy load images with intersection observer
- Paginate large lists (events, detections)
- Cache frequently accessed data in Redis
- Optimize database queries with proper indexes
- Use React.memo for expensive components
- Code split routes for smaller bundle size

### Security
- Hash passwords with bcrypt (salt rounds: 10)
- Use JWT with expiration (access: 15m, refresh: 7d)
- Validate all API inputs with Zod
- Sanitize user inputs
- Use prepared statements (Prisma handles this)
- Rate limit API endpoints (express-rate-limit)
- CORS configuration for frontend domain only

### File Organization
- Group by feature, not by type
- Keep components small and focused (max 200 lines)
- Extract reusable logic into custom hooks
- Use barrel exports (index.ts) for clean imports
- Separate business logic from route handlers

---

## 📦 Docker Compose Configuration

Provide a `docker-compose.yml` that includes:
- PostgreSQL 16 with health check
- Redis 7
- Eclipse Mosquitto 2 with config volume
- AI Service (Python FastAPI)
- Backend (Node.js)
- Frontend (React Vite dev server)
- IoT Simulator
- Shared network for inter-service communication
- Volume mounts for persistence and development

---

## 🎨 Design Inspiration

The dashboard should feel like a modern security operations center:
- **Dark Theme**: Professional, easy on eyes for monitoring
- **Glassmorphism**: Subtle transparency and blur effects
- **Smooth Animations**: Nothing jarring, everything fluid
- **Color Coding**: Red (critical), Orange (high), Yellow (medium), Green (low)
- **Information Density**: Show a lot without feeling cluttered
- **Real-time Feel**: Pulse animations, live badges, instant updates
- **Premium Quality**: Every interaction should feel polished

Think: Apple's design sensibility + modern SaaS dashboard + security monitoring tool.

---

## 📝 Final Notes

- Start with core detection functionality first
- Then add real-time features
- Then focus on UI polish and animations
- Finally prepare for n8n integration
- Make it production-ready: error handling, logging, validation
- Document as you go: README, API docs, setup instructions
- Test thoroughly: unit tests for services, integration tests for API, E2E for critical flows

**The goal**: Create an impressive, portfolio-worthy full-stack AI application that showcases modern web development, computer vision, real-time systems, and premium UX design.

Good luck! 🚀🛡️