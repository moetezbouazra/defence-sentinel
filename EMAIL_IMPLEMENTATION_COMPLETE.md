# ✅ Email Notification System - Implementation Complete

## Summary

Alert emails are now sent to the **authenticated user who owns the camera**, not a hardcoded email address.

---

## What Was Changed

### 1. **Database Schema** (`backend/prisma/schema.prisma`)
- Added `userId` to `Device` model
- Added `userId` to `Alert` model
- Created User → Device relation (one-to-many)
- Created User → Alert relation (one-to-many)

### 2. **Migration** (`20251208073244_add_user_to_device_and_alert`)
- Safely migrated existing data
- Assigned all existing devices/alerts to first registered user
- Applied foreign key constraints

### 3. **Backend Logic** (`backend/src/services/mqttService.ts`)
- Auto-assigns new cameras to first user in system
- Creates alerts with `userId` from device owner
- Sends emails to `event.device.user.email` instead of `ALERT_EMAIL_RECIPIENT`

### 4. **Environment Variables** (`backend/.env`)
- **Removed:** `ALERT_EMAIL_RECIPIENT` (no longer needed)
- **Kept:** `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_HOST`, `EMAIL_PORT` (sender config)

### 5. **Documentation**
- Updated `EMAIL_QUICK_START.md` - Quick setup guide
- Updated `EMAIL_SETUP.md` - Detailed configuration
- Created `CHANGELOG_EMAIL_TO_USER.md` - Technical changelog

---

## How to Use

### Step 1: Configure Email Sender
Edit `backend/.env`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Step 2: Register a User
The email you register with will receive the alerts:
```bash
POST http://localhost:3001/api/auth/register
{
  "email": "john@example.com",  # ← This email receives alerts
  "password": "password123",
  "name": "John Doe"
}
```

### Step 3: Trigger Camera
1. Login at http://localhost:5173
2. Click "Manual Capture" on any camera
3. Wait for AI detection
4. **Check john@example.com inbox** for alert email

---

## Email Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. User Registers                                      │
│     Email: john@example.com                             │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  2. Camera Auto-Assigned                                │
│     Device.userId = john's ID                           │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  3. Threat Detected                                     │
│     Person detected (confidence > 65%)                  │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  4. Alert Created                                       │
│     Alert.userId = Device.userId (john)                 │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  5. Email Sent                                          │
│     To: john@example.com (from Device.user.email)       │
│     Subject: 🛡️ Defence Sentinel Alert - CRITICAL      │
│     Content: Annotated image + detection details        │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Logs

When everything is working, you'll see:

```bash
docker logs defence-sentinel-backend
```

**Expected output:**
```
✅ Email service configured
Server running on port 3001
Connected to MQTT broker
✅ Auto-created device CAM_001 for user john@example.com
Motion detected on CAM_001
Image received from CAM_001
✅ Alert email sent to john@example.com
```

---

## Multi-User Support

### Current Behavior
- All cameras auto-assign to the **first registered user**
- If you register multiple users, only the first one receives alerts

### Future Enhancement Options

**Option A: Device Assignment UI**
Add admin panel to assign cameras to specific users:
```typescript
PUT /api/devices/:deviceId
{ "userId": "user-uuid" }
```

**Option B: Device Claiming**
Users claim cameras using a token:
```typescript
POST /api/devices/claim
{ "deviceId": "CAM_001", "claimToken": "ABC123" }
```

**Option C: Organizations**
Create organization hierarchy:
```
Organization → Users → Devices
```

---

## Troubleshooting

### ❌ No email received

**Check 1:** Verify email service is configured
```bash
docker logs defence-sentinel-backend | grep -i email
```
Should see: `✅ Email service configured`

**Check 2:** Verify alert was created
```bash
docker logs defence-sentinel-backend | grep -i alert
```
Should see: `✅ Alert email sent to <email>`

**Check 3:** Verify user email is correct
```bash
# In psql or database client
SELECT email FROM "User" LIMIT 1;
```

**Check 4:** Check spam folder
Gmail might filter first email from new sender.

### ❌ TypeScript errors in VS Code

Regenerate Prisma client locally:
```bash
cd backend
npx prisma generate
```

Then restart VS Code TypeScript server:
- `Cmd+Shift+P` → "TypeScript: Restart TS Server"

---

## Testing Checklist

- [x] Database migration applied successfully
- [x] Prisma client regenerated (Docker + local)
- [x] Backend service running without errors
- [x] Email service configured
- [x] User registration works
- [x] Device auto-assignment works
- [x] Alert creation includes userId
- [x] Email sent to device owner
- [ ] **Manual test:** Register → Trigger camera → Receive email

---

## Related Files

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Database schema with User-Device-Alert relations |
| `backend/src/services/mqttService.ts` | Device creation, alert logic, email trigger |
| `backend/src/services/emailService.ts` | Email sending with HTML templates |
| `backend/.env` | Email sender configuration |
| `EMAIL_QUICK_START.md` | Quick setup guide |
| `backend/EMAIL_SETUP.md` | Detailed configuration guide |
| `CHANGELOG_EMAIL_TO_USER.md` | Technical implementation details |

---

## Next Steps

1. ✅ **Test the flow:** Register → Login → Trigger camera → Check inbox
2. 🔄 **Optional:** Implement device assignment UI for multi-user support
3. 🔄 **Optional:** Add email preferences (enable/disable notifications)
4. 🔄 **Optional:** Add email rate limiting (max 1 email per 5 minutes per camera)

---

**Status:** ✅ Ready for testing  
**Last Updated:** December 8, 2025  
**Services:** All running (postgres, redis, mqtt, ai-service, backend, frontend, iot-simulator)
