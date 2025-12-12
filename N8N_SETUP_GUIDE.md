# N8N Automation Setup Guide

This guide explains how to set up n8n workflows for sending email and WhatsApp notifications when security threats are detected.

## Overview

When a critical threat is detected (person with confidence > 0.65), the backend sends a webhook to n8n with:
- Alert details (title, message, severity)
- Device information
- Timestamp
- Detection data (object classes, confidence scores)
- Annotated image URL

## Starting n8n

Since n8n is installed separately on your VPS, start it manually or via your preferred method.

Access n8n at: **http://localhost:5678**

**Default credentials:**
- Username: `admin`
- Password: `admin123`

## Webhook Endpoint

The backend sends POST requests to:
```
http://localhost:5678/webhook/defence-sentinel-notification
```

### Webhook Payload Structure

```json
{
  "type": "alert",
  "severity": "CRITICAL" | "WARNING" | "INFO",
  "title": "Threat Detected: person",
  "message": "1 threat detected on Front Door Camera",
  "deviceName": "Front Door Camera",
  "timestamp": "2025-12-08T10:30:45.123Z",
  "detections": [
    {
      "className": "person",
      "confidence": 0.95,
      "threatLevel": "CRITICAL"
    }
  ],
  "hasImage": true
}
```

### Image Access

Annotated images are accessible at:
```
http://backend:3001/uploads/annotated/event_{eventId}_{timestamp}_annotated.jpg
```

From outside Docker network (for email attachments):
```
http://localhost:3001/uploads/annotated/event_{eventId}_{timestamp}_annotated.jpg
```

## Workflow 1: Gmail Email Notifications

### Prerequisites
1. Gmail account with 2FA enabled
2. App-specific password (Settings → Security → App passwords)

### Setup Steps

1. **Create New Workflow** in n8n
2. **Add Webhook Trigger**
   - Name: "Defence Sentinel Webhook"
   - HTTP Method: POST
   - Path: `defence-sentinel-notification`
   - Response Mode: "Respond Immediately"
   
3. **Add IF Node** (Filter Critical Alerts)
   - Condition: `{{ $json.severity }}` equals `CRITICAL`
   
4. **Add HTTP Request Node** (Fetch Image)
   - Connect to "true" branch of IF node
   - Method: GET
   - URL: `http://localhost:3001{{ $json.imageUrl }}`
   - Response Format: File
   - Binary Property: `image`
   
5. **Add Gmail Node**
   - Operation: Send Email
   - To Email: Your recipient email
   - Subject: `🚨 {{ $json.title }} - {{ $json.deviceName }}`
   - Email Type: HTML
   - Message:
   ```html
   <h2>Security Alert</h2>
   <p><strong>Severity:</strong> {{ $json.severity }}</p>
   <p><strong>Device:</strong> {{ $json.deviceName }}</p>
   <p><strong>Time:</strong> {{ $json.timestamp }}</p>
   <p><strong>Message:</strong> {{ $json.message }}</p>
   
   <h3>Detections:</h3>
   <ul>
   {{ $json.detections.map(d => `<li>${d.className} (${(d.confidence * 100).toFixed(1)}% - ${d.threatLevel})</li>`).join('') }}
   </ul>
   
   <p><em>Defence Sentinel - Automated Security System</em></p>
   ```
   - Attachments: Select binary property `image`
   - Credentials: Add Gmail OAuth2 or SMTP credentials

6. **Activate Workflow**

### Gmail OAuth2 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop app)
5. Add credentials in n8n:
   - Client ID
   - Client Secret
   - Authorize and grant permissions

## Workflow 2: WhatsApp Notifications

### Prerequisites
- Twilio account (or WhatsApp Business API)
- WhatsApp-enabled phone number from Twilio

### Setup Steps (Using Twilio)

1. **Create New Workflow** in n8n
2. **Add Webhook Trigger**
   - Same configuration as Gmail workflow
   
3. **Add IF Node** (Filter Alerts)
   - Condition: `{{ $json.severity }}` equals `CRITICAL` OR `WARNING`
   
4. **Add Twilio Node**
   - Connect to "true" branch
   - Operation: Send Message (WhatsApp)
   - From: `whatsapp:+14155238886` (Twilio Sandbox or your number)
   - To: `whatsapp:+21612345678` (Your WhatsApp number)
   - Message:
   ```
   🚨 *{{ $json.severity }} ALERT*
   
   *Device:* {{ $json.deviceName }}
   *Time:* {{ $json.timestamp }}
   
   {{ $json.message }}
   
   *Detections:*
   {{ $json.detections.map(d => `• ${d.className}: ${(d.confidence * 100).toFixed(0)}%`).join('\n') }}
   
   _Defence Sentinel Security System_
   ```
   - Credentials: Add Twilio Account SID and Auth Token

5. **Add HTTP Request Node** (Optional - Send Image)
   - Method: GET
   - URL: `http://backend:3001{{ $json.imageUrl }}`
   - Response Format: File
   
6. **Add Twilio Node** (Send Media Message)
   - Operation: Send Message
   - Message: "Annotated Image"
   - Media URL: Public URL to the image
   
7. **Activate Workflow**

### Twilio Setup
1. Sign up at [Twilio](https://www.twilio.com)
2. Get WhatsApp Sandbox number (for testing)
3. For production: Apply for WhatsApp Business API
4. Get Account SID and Auth Token from Twilio Console
5. Add credentials in n8n

## Workflow 3: Combined Email + WhatsApp

You can create a single workflow that sends both:

1. Start with Webhook Trigger
2. Add IF node for severity filtering
3. Branch to parallel paths:
   - Path 1: Gmail node
   - Path 2: Twilio WhatsApp node
4. Both paths fetch the same image

## Advanced: Conditional Logic

Add more sophisticated filtering:

```javascript
// Only notify during night time
const hour = new Date($json.timestamp).getHours();
return hour >= 22 || hour <= 6;

// Only notify for specific devices
return ['Front Door', 'Backyard'].includes($json.deviceName);

// Only for multiple detections
return $json.detections.length >= 2;

// Only for high confidence
return $json.detections.some(d => d.confidence > 0.9);
```

## Testing the Integration

1. **Start all services:**
   ```bash
   docker compose up -d
   ```

2. **Activate your n8n workflow**

3. **Trigger a camera event:**
   ```bash
   curl -X POST http://localhost:4000/trigger \
     -H "Content-Type: application/json" \
     -d '{"deviceId": "CAM_001"}'
   ```

4. **Check n8n execution log** for webhook received
5. **Verify email/WhatsApp received**

## Troubleshooting

### Webhook not received
- Check n8n is running: `docker ps | grep n8n`
- Verify webhook URL in backend logs
- Check n8n execution history

### Images not accessible
- Verify backend is serving static files: `curl http://localhost:3001/uploads/`
- Check Docker network connectivity
- Use public URL (localhost:3001) for external services

### Gmail errors
- Verify app password is correct
- Check "Less secure app access" is enabled (if using SMTP)
- OAuth2 token may need refresh

### WhatsApp errors
- Join Twilio Sandbox (send "join <code>" to sandbox number)
- Verify phone number format includes country code
- Check Twilio account balance

## Environment Variables

Add to `.env` if needed:

```env
# Backend
N8N_WEBHOOK_URL=http://n8n:5678/webhook
BACKEND_PUBLIC_URL=http://localhost:3001

# n8n (in docker-compose.yml)
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin123
```

## Sample n8n Workflow JSON

Import this workflow template in n8n:

```json
{
  "name": "Defence Sentinel - Email & WhatsApp",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "defence-sentinel-notification",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.severity}}",
              "operation": "equals",
              "value2": "CRITICAL"
            }
          ]
        }
      },
      "name": "IF Critical",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "sendTo": "your-email@gmail.com",
        "subject": "=🚨 {{$json.title}} - {{$json.deviceName}}",
        "emailType": "html",
        "message": "=<h2>Security Alert</h2><p><strong>Severity:</strong> {{$json.severity}}</p><p><strong>Device:</strong> {{$json.deviceName}}</p><p><strong>Time:</strong> {{$json.timestamp}}</p><p><strong>Message:</strong> {{$json.message}}</p>"
      },
      "name": "Gmail",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 1,
      "position": [650, 200]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "IF Critical", "type": "main", "index": 0}]]
    },
    "IF Critical": {
      "main": [[{"node": "Gmail", "type": "main", "index": 0}]]
    }
  }
}
```

## Security Recommendations

1. **Change default n8n password** immediately
2. **Use environment variables** for sensitive data
3. **Enable n8n authentication** in production
4. **Use HTTPS** for production webhooks
5. **Implement rate limiting** on webhook endpoints
6. **Validate webhook signatures** if available

## Support

For issues:
- Check n8n documentation: https://docs.n8n.io
- Backend logs: `docker logs defence-sentinel-backend`
- n8n logs: `docker logs defence-sentinel-n8n`
