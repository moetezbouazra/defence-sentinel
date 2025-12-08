import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailAlert {
  alertId: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  deviceName: string;
  deviceLocation?: string;
  timestamp: Date;
  annotatedImagePath: string;
  detections: Array<{
    className: string;
    confidence: number;
    threatLevel: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');

    if (!emailUser || !emailPass) {
      console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    this.isConfigured = true;
    console.log('✅ Email service configured');
  }

  private generateEmailHTML(alert: EmailAlert): string {
    const severityColors = {
      CRITICAL: '#ef4444',
      WARNING: '#f59e0b',
      INFO: '#3b82f6',
    };

    const threatColors = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#f59e0b',
      LOW: '#10b981',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .alert-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
      background-color: ${severityColors[alert.severity]};
      color: white;
    }
    .content {
      padding: 30px 20px;
    }
    .alert-info {
      background-color: #f3f4f6;
      border-left: 4px solid ${severityColors[alert.severity]};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .alert-info h2 {
      margin: 0 0 10px 0;
      font-size: 18px;
      color: #111827;
    }
    .alert-info p {
      margin: 5px 0;
      color: #4b5563;
    }
    .device-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .info-card {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 16px;
      color: #111827;
      font-weight: 500;
    }
    .image-container {
      margin: 20px 0;
      text-align: center;
    }
    .image-container img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
    }
    .detections {
      margin: 20px 0;
    }
    .detections h3 {
      font-size: 16px;
      margin-bottom: 15px;
      color: #111827;
    }
    .detection-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      margin: 8px 0;
      background-color: #f9fafb;
      border-radius: 6px;
      border-left: 3px solid;
    }
    .detection-name {
      font-weight: 600;
      text-transform: capitalize;
    }
    .detection-confidence {
      font-size: 14px;
      color: #6b7280;
    }
    .detection-threat {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .timestamp {
      font-size: 14px;
      color: #6b7280;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Defence Sentinel Alert</h1>
      <span class="alert-badge">${alert.severity}</span>
    </div>
    
    <div class="content">
      <div class="alert-info">
        <h2>${alert.title}</h2>
        <p>${alert.message}</p>
      </div>

      <div class="device-info">
        <div class="info-card">
          <div class="info-label">Camera</div>
          <div class="info-value">${alert.deviceName}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Location</div>
          <div class="info-value">${alert.deviceLocation || 'Not specified'}</div>
        </div>
      </div>

      <div class="image-container">
        <img src="cid:annotated-image" alt="Detection Image" />
        <p class="timestamp">📅 ${alert.timestamp.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}</p>
      </div>

      <div class="detections">
        <h3>🔍 Detected Objects (${alert.detections.length})</h3>
        ${alert.detections
          .map(
            (detection) => `
          <div class="detection-item" style="border-left-color: ${threatColors[detection.threatLevel as keyof typeof threatColors] || '#6b7280'}">
            <div>
              <div class="detection-name">${detection.className}</div>
              <div class="detection-confidence">${(detection.confidence * 100).toFixed(1)}% confidence</div>
            </div>
            <span class="detection-threat" style="background-color: ${threatColors[detection.threatLevel as keyof typeof threatColors] || '#6b7280'}">
              ${detection.threatLevel}
            </span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <div class="footer">
      <p>This is an automated alert from Defence Sentinel Security System</p>
      <p>Alert ID: ${alert.alertId}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  async sendAlertEmail(
    recipientEmail: string,
    alert: EmailAlert
  ): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('Email service not configured, skipping email');
      return false;
    }

    try {
      // Read the annotated image
      const imagePath = path.resolve(alert.annotatedImagePath);
      
      if (!fs.existsSync(imagePath)) {
        console.error(`Annotated image not found: ${imagePath}`);
        return false;
      }

      const mailOptions = {
        from: `"Defence Sentinel 🛡️" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `🚨 ${alert.severity} Alert: ${alert.title}`,
        html: this.generateEmailHTML(alert),
        attachments: [
          {
            filename: 'detection.jpg',
            path: imagePath,
            cid: 'annotated-image',
          },
        ],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Alert email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send alert email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
