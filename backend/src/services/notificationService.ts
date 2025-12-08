import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook';

interface NotificationPayload {
  type: 'alert' | 'event';
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  deviceName: string;
  timestamp: string;
  annotatedImagePath?: string;
  thumbnailPath?: string;
  detections?: Array<{
    className: string;
    confidence: number;
    threatLevel: string;
  }>;
}

export async function sendNotificationWebhook(payload: NotificationPayload) {
  try {
    const webhookUrl = `${N8N_WEBHOOK_URL}/defence-sentinel-notification`;
    
    // Prepare the data to send
    const data = {
      type: payload.type,
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
      deviceName: payload.deviceName,
      timestamp: payload.timestamp,
      detections: payload.detections || [],
      hasImage: !!payload.annotatedImagePath,
    };

    console.log(`📧 Sending notification webhook to n8n: ${payload.title}`);
    
    // Send JSON data to webhook
    const response = await axios.post(webhookUrl, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    console.log('✅ Notification webhook sent successfully');
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('❌ Failed to send notification webhook:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendImageToWebhook(imagePath: string, eventId: string) {
  try {
    const webhookUrl = `${N8N_WEBHOOK_URL}/defence-sentinel-image`;
    
    if (!fs.existsSync(imagePath)) {
      console.error(`Image not found: ${imagePath}`);
      return { success: false, error: 'Image file not found' };
    }

    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('eventId', eventId);
    formData.append('filename', path.basename(imagePath));

    console.log(`🖼️ Sending image to n8n webhook: ${path.basename(imagePath)}`);

    const response = await axios.post(webhookUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 10000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('✅ Image sent to webhook successfully');
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('❌ Failed to send image to webhook:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getPublicImageUrl(imagePath: string): Promise<string> {
  // For n8n to access images, we need to provide a public URL
  // This assumes backend is accessible at localhost:3001
  const backendUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';
  const relativePath = imagePath.replace(/^.*\/uploads\//, '/uploads/');
  return `${backendUrl}${relativePath}`;
}
