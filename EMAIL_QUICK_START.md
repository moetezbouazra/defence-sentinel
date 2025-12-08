# 📧 Quick Start: Email Alerts Setup

## Gmail Setup (5 minutes)

### Step 1: Configure Your Email (Sender)
Edit `backend/.env` and update these lines:

```env
# Your Gmail account that will SEND the alerts
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

**Note:** Alert emails are automatically sent to the **authenticated user who owns the camera**. No need to configure a recipient - the system uses the user's registered email address.

### Step 2: Get Gmail App Password

1. **Enable 2-Factor Authentication:**
   - Go to: https://myaccount.google.com/security
   - Click **2-Step Verification** → Enable it

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - App: **Mail**
   - Device: **Other (Custom name)** → Type "Defence Sentinel"
   - Click **Generate**
   - Copy the 16-character password (remove spaces)
   - Paste it in `EMAIL_PASSWORD` in your `.env` file

### Step 3: Restart Backend
```bash
docker compose restart backend
```

### Step 4: Test It!
1. Open dashboard: http://localhost:5173
2. **Login with YOUR email** (the one you registered with)
3. Click **Manual Capture** for any camera
4. Wait 5-10 seconds for detection
5. **Check YOUR inbox!** 📬 (The email you logged in with will receive the alert)

**How it works:** 
- Each camera/device is owned by a user
- When a threat is detected, the email is sent to that device owner's email
- New cameras are automatically assigned to the first registered user

---

## What You'll Receive

When a **person** is detected with >65% confidence, you'll get an email with:

- 🎯 **Severity Badge** (CRITICAL/WARNING)
- 📸 **Annotated Detection Image** (embedded, not attachment)
- 📅 **Full Timestamp** (e.g., "Sunday, December 8, 2024 at 03:45:12 PM")
- 📹 **Camera Name & Location**
- 🔍 **Detection Details:**
  - Object class (person, car, etc.)
  - Confidence percentage
  - Threat level (color-coded)

---

## Email Template Preview

```
┌─────────────────────────────────────┐
│  🛡️ Defence Sentinel Alert          │
│         🚨 CRITICAL                  │
├─────────────────────────────────────┤
│                                     │
│  Threat Detected: person            │
│  1 threat detected on Front Camera │
│                                     │
│  Camera: Front Camera               │
│  Location: Main Entrance            │
│                                     │
│  [Annotated Detection Image]        │
│  📅 Sunday, Dec 8, 2024, 3:45 PM   │
│                                     │
│  🔍 Detected Objects (1)            │
│  ┌─────────────────────────┐       │
│  │ Person                  │       │
│  │ 87.5% confidence        │ 🔴 CRITICAL
│  └─────────────────────────┘       │
│                                     │
│  Alert ID: abc123...                │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### ⚠️ Not receiving emails?

**Check backend logs:**
```bash
docker logs defence-sentinel-backend | grep -i email
```

**You should see:**
```
✅ Email service configured
✅ Email server connection verified
✅ Alert email sent: <message-id>
```

**If you see warnings:**
```
⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env
```
→ Double-check your `.env` file

**Common Issues:**
1. **Wrong app password** - Generate a new one
2. **2FA not enabled** - Must be enabled for app passwords
3. **Spaces in password** - Remove all spaces from the 16-char code
4. **Check spam folder** - Gmail might filter it first time

---

## Advanced Configuration

### Use Different Email Provider

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Custom SMTP:**
```env
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=alerts@your-domain.com
EMAIL_PASSWORD=your-smtp-password
```

### Disable Email Notifications

Simply leave `EMAIL_USER` and `EMAIL_PASSWORD` empty or remove them.
The system will continue working without email alerts.

---

## Security Tips

✅ Use a **dedicated Gmail account** for sending alerts  
✅ Use **app-specific password**, not your main password  
✅ Keep `.env` file in `.gitignore` (already done)  
✅ Never commit credentials to git  

---

**Need help?** Check `backend/EMAIL_SETUP.md` for detailed documentation.
