# 📧 Email Alerts - Quick Reference

## TL;DR
Alert emails are sent to the **user who owns the camera**, not a hardcoded email.

---

## Setup (2 minutes)

### 1. Get Gmail App Password
https://myaccount.google.com/apppasswords
- App: Mail
- Device: Other → "Defence Sentinel"
- Copy the 16-char password

### 2. Update `.env`
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### 3. Restart Backend
```bash
docker compose restart backend
```

---

## Test It

1. **Register:** `http://localhost:5173/register` with your email
2. **Login:** Use the same email
3. **Trigger:** Click "Manual Capture" on any camera
4. **Check:** Your email inbox (the one you registered with)

---

## How It Works

```
User registers with email: john@example.com
         ↓
Camera auto-assigned to John
         ↓
Threat detected (person >65% confidence)
         ↓
Alert created for John
         ↓
Email sent to: john@example.com ✉️
```

---

## Key Points

✅ **Each user receives alerts for their own cameras**  
✅ **No hardcoded ALERT_EMAIL_RECIPIENT needed**  
✅ **New cameras auto-assign to first user**  
✅ **Emails include annotated image + detection details**  

---

## Verification

```bash
# Check email service is running
docker logs defence-sentinel-backend | grep "Email service configured"

# Check alert was sent
docker logs defence-sentinel-backend | grep "Alert email sent"
```

**Expected:**
```
✅ Email service configured
✅ Alert email sent to john@example.com
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No email received | Check spam folder, verify EMAIL_USER/PASSWORD |
| "Email service not configured" | Check .env has EMAIL_USER and EMAIL_PASSWORD |
| TypeScript errors | Run `cd backend && npx prisma generate` |
| Wrong email address | Verify user's email: `SELECT email FROM "User"` |

---

**Docs:** 
- Quick Setup: `EMAIL_QUICK_START.md`
- Detailed Guide: `backend/EMAIL_SETUP.md`
- Changelog: `CHANGELOG_EMAIL_TO_USER.md`
