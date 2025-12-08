# 🔄 Email System Update - User-Based Routing

## What Changed?

### Before ❌
- Alert emails sent to a **hardcoded email address** (`ALERT_EMAIL_RECIPIENT` in `.env`)
- All users received alerts at the same email
- No user-device ownership

### After ✅
- Alert emails sent to the **device owner's registered email**
- Each user receives alerts only for their own cameras
- Automatic device ownership assignment

---

## Database Changes

### New Relations Added:
1. **Device → User**: Each device now belongs to a user
   - `Device.userId` (foreign key to User.id)
   
2. **Alert → User**: Each alert is associated with a user
   - `Alert.userId` (foreign key to User.id)

### Migration Applied:
```sql
-- Migration: 20251208073244_add_user_to_device_and_alert
-- Existing devices/alerts assigned to first registered user
-- New devices auto-assigned to first user in system
```

---

## How It Works Now

### 1. **User Registration**
```
User registers → email: john@example.com
```

### 2. **Device Assignment**
```
New camera detected → Auto-assigned to first user (John)
Device.userId = john's user ID
```

### 3. **Alert Creation**
```
Threat detected → Alert created
Alert.userId = device.userId (John)
```

### 4. **Email Sent**
```
Email sent to → device.user.email (john@example.com)
```

---

## Code Changes

### `/backend/prisma/schema.prisma`
```prisma
model User {
  devices  Device[]  // New relation
  alerts   Alert[]   // New relation
}

model Device {
  userId   String
  user     User @relation(fields: [userId], references: [id])
}

model Alert {
  userId   String
  user     User @relation(fields: [userId], references: [id])
}
```

### `/backend/src/services/mqttService.ts`
```typescript
// Auto-assign new devices to first user
const firstUser = await prisma.user.findFirst();
const device = await prisma.device.create({
  data: { userId: firstUser.id, ... }
});

// Create alert with userId
const alert = await prisma.alert.create({
  data: { 
    userId: event.device.userId,
    ...
  }
});

// Send email to device owner
await emailService.sendAlertEmail(event.device.user.email, ...);
```

### `/backend/.env`
```diff
- ALERT_EMAIL_RECIPIENT=recipient@example.com  # Removed
+ # Emails sent to device owner's registered email
```

---

## Configuration

### Updated `.env`:
```env
# Email sender configuration only
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# ❌ ALERT_EMAIL_RECIPIENT removed - emails go to user's registered email
```

---

## Testing

### 1. **Register a User**
```bash
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

### 2. **Trigger Camera**
- Click "Manual Capture" on any camera
- System detects person
- Email sent to `test@example.com`

### 3. **Check Logs**
```bash
docker logs defence-sentinel-backend | grep -i email
```

**Expected output:**
```
✅ Email service configured
✅ Auto-created device CAM_001 for user test@example.com
✅ Alert email sent to test@example.com
```

---

## Multi-User Support (Future)

Currently, all cameras auto-assign to the **first registered user**. To support multiple users:

### Option 1: Manual Device Assignment
Add device management UI where admins can assign cameras to specific users.

### Option 2: Device Registration Flow
Require users to "claim" cameras using device tokens/QR codes.

### Option 3: Organization Hierarchy
Implement organizations/groups where cameras belong to orgs, users belong to orgs.

---

## Migration Status

✅ Schema updated  
✅ Migration applied (existing data preserved)  
✅ Prisma client regenerated  
✅ Backend rebuilt and running  
✅ Documentation updated  

---

## Rollback Instructions

If you need to revert to the old behavior:

1. **Revert schema changes**:
   ```bash
   cd backend
   git checkout HEAD -- prisma/schema.prisma
   ```

2. **Create rollback migration**:
   ```bash
   npx prisma migrate dev --name rollback_user_device_relation
   ```

3. **Restore `.env`**:
   ```env
   ALERT_EMAIL_RECIPIENT=your-email@example.com
   ```

4. **Revert code changes**:
   ```bash
   git checkout HEAD -- src/services/mqttService.ts
   ```

5. **Rebuild**:
   ```bash
   docker compose up -d --build backend
   ```

---

**Last Updated:** December 8, 2025  
**Migration:** 20251208073244_add_user_to_device_and_alert
