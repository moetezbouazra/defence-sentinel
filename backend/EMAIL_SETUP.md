# Email Notification Setup Guide

## Gmail Configuration

### 1. Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2FA

### 2. Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Defence Sentinel" as the custom name
5. Click **Generate**
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### 3. Configure Environment Variables

Update your `.env` file:

```env
# Email Configuration (Sender account)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx    # The app password from step 2
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

**Important:** 
- Remove spaces from the app password: `xxxxxxxxxxxxxxxx`
- Keep the quotes around the password if it contains special characters
- **No need to configure ALERT_EMAIL_RECIPIENT** - emails are automatically sent to the device owner's registered email address

**How Email Routing Works:**
- Each camera/device is owned by a user (the one who registered the account)
- When a threat is detected, the system automatically sends the email to that user's email address
- This ensures users only receive alerts for their own cameras
- New cameras are automatically assigned to the first registered user in the system

### 4. Test the Configuration

Restart the backend service:
```bash
docker compose restart backend
```

Check the logs for email service initialization:
```bash
docker logs defence-sentinel-backend
```

You should see: `✅ Email service configured`

### 5. Trigger a Test Alert

Use the manual camera trigger to create an event that will generate an alert:

1. Open the dashboard: http://localhost:5173
2. Click on the "Manual Capture" button for any camera
3. Wait for the AI detection to process
4. If a person is detected with >65% confidence, an alert will be created
5. Check your inbox for the email notification!

## Email Template Features

The alert email includes:
- ✅ **Severity badge** (CRITICAL/WARNING/INFO)
- ✅ **Alert title and message**
- ✅ **Camera name and location**
- ✅ **Timestamp** (formatted with full date/time)
- ✅ **Annotated detection image** (embedded inline)
- ✅ **Detection details** (object class, confidence, threat level)
- ✅ **Color-coded threat levels** (Critical=Red, High=Orange, Medium=Yellow, Low=Green)
- ✅ **Professional HTML design** with gradient header

## Troubleshooting

### Email not sending?

1. **Check logs:**
   ```bash
   docker logs defence-sentinel-backend | grep -i email
   ```

2. **Common issues:**
   - App password not generated or incorrect
   - 2FA not enabled on Gmail account
   - Wrong email/password in `.env`
   - Gmail blocking "less secure" apps (use app password instead)
   - Firewall blocking port 587

3. **Test SMTP connection:**
   The service automatically tests the connection on startup.
   Look for: `✅ Email server connection verified`

### Still not working?

- Verify Gmail settings allow app passwords
- Check spam/junk folder
- Try a different email provider (see below)

## Alternative Email Providers

### Outlook/Office 365
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Custom SMTP Server
```env
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=alerts@your-domain.com
EMAIL_PASSWORD=your-password
```

### Using port 465 (SSL)
```env
EMAIL_PORT=465
# The service will automatically use secure=true for port 465
```

## Security Best Practices

1. **Never commit `.env` file** to version control
2. Use **app-specific passwords** instead of your main password
3. Consider using a **dedicated email account** for alerts
4. Regularly **rotate app passwords**
5. Enable **email filtering** to prevent alert spam

## Customization

To customize the email template, edit:
`backend/src/services/emailService.ts`

Key sections:
- `generateEmailHTML()` - HTML template structure
- `severityColors` - Badge colors
- `threatColors` - Detection threat level colors
