# Defence Sentinel - AI Coding Agent Instructions

## Project Overview
AI-powered security surveillance system with real-time object detection. IoT devices publish camera frames via MQTT → Backend processes via AI service → WebSocket updates to frontend dashboard.

## Architecture

### Service Communication Flow
```
IoT Simulator → MQTT (Mosquitto) → Backend → AI Service (FastAPI/YOLO)
                                  ↓
                         Socket.IO → Frontend (React)
```

**Critical Flow**: 
1. IoT device publishes `cameras/{deviceId}/motion` (triggers event creation, status: PENDING)
2. IoT device publishes `cameras/{deviceId}/image` with base64 image (within 60s)
3. Backend finds PENDING event, sends image to AI service, stores detections
4. If high-confidence person detected (>0.65), creates CRITICAL alert
5. Real-time updates via Socket.IO: `event:new`, `event:update`, `alert:new`, `device:status`

### Tech Stack
- **Backend**: Express + TypeScript + Prisma (PostgreSQL) + Socket.IO + MQTT client
- **AI Service**: FastAPI + YOLO11n (Ultralytics)
- **Frontend**: React + TypeScript + Vite + TanStack Query + shadcn/ui
- **Infra**: Docker Compose (postgres, redis, mosquitto, 3 app services, iot-simulator)

## Development Workflows

### Running Services
```bash
# Full stack (recommended for testing)
docker compose up --build

# Individual services for development
cd backend && yarn dev          # Auto-reload with ts-node-dev
cd frontend && yarn dev          # Vite dev server
cd ai-service && uvicorn main:app --reload
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name <migration_name>   # Creates migration + applies
npx prisma generate                               # Regenerate Prisma client after schema changes
```

**Important**: Prisma client must be regenerated after any `schema.prisma` changes. Backend Docker requires `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` for Alpine Linux compatibility.

### Testing MQTT Flow
IoT simulator auto-publishes motion events every 15s and status heartbeats every 30s for CAM_001, CAM_002, CAM_003. Check backend logs for "Motion detected on {deviceId}" → "Image received from {deviceId}".

## Code Conventions

### Threat Level Calculation (backend/src/services/mqttService.ts)
```typescript
person + confidence > 0.8  → CRITICAL
person + confidence > 0.65 → HIGH
car/truck/motorcycle       → MEDIUM
all others                 → LOW
```

### API Patterns
- **Authentication**: JWT stored in localStorage, axios interceptor adds `Authorization: Bearer {token}` header
- **Pagination**: All list endpoints use `{ data: [], meta: { total, page, limit, totalPages } }`
- **Real-time**: Socket.IO events follow pattern `{resource}:{action}` (e.g., `event:new`, `alert:new`)

### Frontend State Management
- **TanStack Query** for server state with auto-refetch intervals (Dashboard stats: 30s, Alerts: 10s)
- **Zustand** for client state (not extensively used yet)
- **Auth flow**: Login → store token → redirect to dashboard → axios interceptor auto-attaches token

### Prisma Schema Conventions
- All tables use `id: String @id @default(uuid())`
- Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Enums for status/type fields (DeviceStatus, EventType, ThreatLevel, AlertSeverity)
- `Device.deviceId` is unique MQTT identifier; `Device.id` is internal UUID

## Key Files

- **MQTT orchestration**: `backend/src/services/mqttService.ts` - handles motion/image/status messages, triggers AI processing
- **AI detection**: `ai-service/main.py` - YOLO11n inference with threat-based color coding (red=critical, orange=high, yellow=medium, green=low)
- **Database schema**: `backend/prisma/schema.prisma` - single source of truth for data model
- **API layer**: `frontend/src/lib/api.ts` - centralized axios instance with auth interceptor
- **Docker config**: `docker-compose.yml` - network topology, health checks, volume mounts

## Gotchas

1. **Event-Image Association**: Backend matches images to events using `device.deviceId + status=PENDING + createdAt within last 60s`. If IoT simulator delays >60s, image is orphaned.

2. **Base64 Image Storage**: Currently stores images as base64 data URLs in Postgres (`event.imageUrl`, `event.thumbnailUrl`). Not production-ready (DB bloat), but sufficient for demo. Production should use S3/object storage.

3. **Socket.IO Initialization**: `getIo()` wrapped in try-catch because it may be called before socket server initializes during startup.

4. **Environment Variables**: 
   - Backend expects `AI_SERVICE_URL=http://ai-service:8000` (Docker) vs `http://localhost:8000` (local dev)
   - Frontend uses `VITE_API_URL` (must start with `VITE_` for Vite exposure)

5. **MQTT Topic Structure**: Always `cameras/{deviceId}/{message_type}` where message_type is `motion|status|image`. Backend subscribes to wildcard `cameras/+/motion` etc.

## Common Tasks

**Add new detection class**: Update `getThreatLevel()` in `backend/src/services/mqttService.ts` + threat color mapping in `ai-service/main.py:get_threat_color()`

**Add new API endpoint**: 
1. Define route in `backend/src/routes/{resource}.ts`
2. Implement controller in `backend/src/controllers/{resource}.ts`
3. Mount route in `backend/src/index.ts`
4. Add API function in `frontend/src/lib/api.ts`

**Add new page**: Create in `frontend/src/pages/{Page}.tsx` + add route in `App.tsx` + add nav link in `Layout.tsx`
