import mqtt from 'mqtt';
import prisma from '../utils/prisma';
import { getIo } from './socketService';
import axios from 'axios';
import FormData from 'form-data';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

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

    // Update event with results
    // In a real app, we would save the image to disk/S3 and store the URL
    // For now, we'll just store the base64 as a data URL (not recommended for production DB size, but okay for demo)
    // Or better, just store a placeholder URL since we don't have file storage set up yet
    const imageUrl = `data:image/jpeg;base64,${payload.image}`;
    const annotatedImageUrl = annotated_image ? `data:image/jpeg;base64,${annotated_image}` : null;

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'COMPLETED',
        imageUrl: imageUrl, // Storing base64 directly for now
        thumbnailUrl: annotatedImageUrl || imageUrl, // Use annotated image for thumbnail if available
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
      const alert = await prisma.alert.create({
        data: {
          eventId: event.id,
          severity: 'CRITICAL',
          title: `Threat Detected: ${criticalDetections[0].class}`,
          message: `${criticalDetections.length} threats detected on ${deviceId}`,
          acknowledged: false,
        }
      });
      getIo().emit('alert:new', alert);
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
