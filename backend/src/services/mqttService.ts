import mqtt from 'mqtt';
import prisma from '../utils/prisma';
import { getIo } from './socketService';
import { sendNotificationWebhook, getPublicImageUrl } from './notificationService';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');
const ORIGINAL_DIR = path.join(UPLOAD_DIR, 'original');
const ANNOTATED_DIR = path.join(UPLOAD_DIR, 'annotated');

// Ensure upload directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(THUMBNAIL_DIR, { recursive: true });
    await fs.mkdir(ORIGINAL_DIR, { recursive: true });
    await fs.mkdir(ANNOTATED_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
};

ensureDirectories();

export const initMqtt = () => {
  const client = mqtt.connect(MQTT_URL);

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('cameras/+/motion');
    client.subscribe('cameras/+/status');
    client.subscribe('cameras/+/image');
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const type = topicParts[2];

      if (type === 'status') {
        await handleStatusMessage(deviceId, payload);
      } else if (type === 'motion') {
        await handleMotionMessage(deviceId, payload);
      } else if (type === 'image') {
        await handleImageMessage(deviceId, payload);
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  });
};

const handleStatusMessage = async (deviceId: string, payload: any) => {
  await prisma.device.upsert({
    where: { deviceId },
    update: {
      status: payload.status === 'online' ? 'ONLINE' : 'OFFLINE',
      lastSeen: new Date(),
      metadata: payload,
    },
    create: {
      deviceId,
      name: deviceId,
      status: payload.status === 'online' ? 'ONLINE' : 'OFFLINE',
      lastSeen: new Date(),
      metadata: payload,
    },
  });
  
  try {
    getIo().emit('device:status', { deviceId, status: payload.status });
  } catch (e) {
    // Socket might not be ready
  }
};

const handleMotionMessage = async (deviceId: string, payload: any) => {
  console.log(`Motion detected on ${deviceId}`);
  
  // Ensure device exists
  let device = await prisma.device.findUnique({ where: { deviceId } });
  if (!device) {
    device = await prisma.device.create({
      data: {
        deviceId,
        name: deviceId,
        status: 'ONLINE',
      }
    });
  }

  // Create event
  const event = await prisma.event.create({
    data: {
      deviceId: device.id,
      type: 'MOTION',
      status: 'PENDING', // Wait for image
      timestamp: new Date(payload.timestamp),
    },
    include: { device: true }
  });

  try {
    getIo().emit('event:new', event);
  } catch (e) {}
};

const handleImageMessage = async (deviceId: string, payload: any) => {
  console.log(`Image received from ${deviceId}`);
  
  // Find the most recent pending event for this device (within last minute)
  const event = await prisma.event.findFirst({
    where: {
      device: { deviceId },
      status: 'PENDING',
      createdAt: { gt: new Date(Date.now() - 60000) }
    },
    orderBy: { createdAt: 'desc' },
    include: { device: true }
  });

  if (!event) {
    console.log('No pending event found for image');
    return;
  }

  // Update event status
  await prisma.event.update({
    where: { id: event.id },
    data: { status: 'PROCESSING' }
  });

  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(payload.image, 'base64');
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalFilename = `event_${event.id}_${timestamp}.jpg`;
    const annotatedFilename = `event_${event.id}_${timestamp}_annotated.jpg`;
    const thumbnailFilename = `event_${event.id}_${timestamp}_thumb.jpg`;
    
    // Save original image
    const originalPath = path.join(ORIGINAL_DIR, originalFilename);
    await fs.writeFile(originalPath, imageBuffer);
    
    // Create thumbnail
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);
    await sharp(imageBuffer)
      .resize(400, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    // Send to AI service
    const formData = new FormData();
    formData.append('file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
    formData.append('camera_name', event.device.name);

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    const { detections, annotated_image, processing_time } = aiResponse.data;
    
    // Save annotated image if available
    let annotatedPath = null;
    if (annotated_image) {
      annotatedPath = path.join(ANNOTATED_DIR, annotatedFilename);
      await fs.writeFile(annotatedPath, Buffer.from(annotated_image, 'base64'));
    }

    // Save detections
    for (const d of detections) {
      await prisma.detection.create({
        data: {
          eventId: event.id,
          className: d.class,
          confidence: d.confidence,
          bbox: d.bbox,
          threatLevel: getThreatLevel(d.class, d.confidence),
        }
      });
    }

    // Update event with file paths (use relative URLs for frontend)
    const imageUrl = `/uploads/original/${originalFilename}`;
    const thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
    const annotatedImageUrl = annotatedPath ? `/uploads/annotated/${annotatedFilename}` : null;

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'COMPLETED',
        imageUrl: imageUrl,
        thumbnailUrl: annotatedImageUrl || thumbnailUrl, // Use annotated as thumbnail if available
        type: detections.length > 0 ? 'DETECTION' : 'MOTION',
      },
      include: {
        device: true,
        detections: true,
        alerts: true
      }
    });

    // Check for threats and generate alerts
    const criticalDetections = detections.filter((d: any) => {
      const level = getThreatLevel(d.class, d.confidence);
      return level === 'HIGH' || level === 'CRITICAL';
    });

    if (criticalDetections.length > 0) {
      const maxThreatDetection = criticalDetections[0];
      const severity = getThreatLevel(maxThreatDetection.class, maxThreatDetection.confidence) === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      
      const alert = await prisma.alert.create({
        data: {
          eventId: event.id,
          severity,
          title: `Threat Detected: ${maxThreatDetection.class}`,
          message: `${criticalDetections.length} threat${criticalDetections.length > 1 ? 's' : ''} detected on ${event.device.name}`,
          acknowledged: false,
        }
      });
      
      getIo().emit('alert:new', alert);

      // Send notification to n8n webhook
      const imageUrl = annotatedPath ? await getPublicImageUrl(annotatedPath) : null;
      await sendNotificationWebhook({
        type: 'alert',
        severity,
        title: alert.title,
        message: alert.message,
        deviceName: event.device.name,
        timestamp: new Date().toISOString(),
        annotatedImagePath: annotatedPath || undefined,
        thumbnailPath: thumbnailPath,
        detections: criticalDetections.map((d: any) => ({
          className: d.class,
          confidence: d.confidence,
          threatLevel: getThreatLevel(d.class, d.confidence),
        })),
      });
    }

    getIo().emit('event:update', updatedEvent);

  } catch (error) {
    console.error('AI processing failed:', error);
    await prisma.event.update({
      where: { id: event.id },
      data: { status: 'FAILED' }
    });
  }
};

const getThreatLevel = (className: string, confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  if (className === 'person' && confidence > 0.8) return 'CRITICAL';
  if (className === 'person' && confidence > 0.65) return 'HIGH';
  if (['car', 'truck', 'motorcycle'].includes(className)) return 'MEDIUM';
  return 'LOW';
};
