const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const PORT = process.env.PORT || 4000;
const client = mqtt.connect(MQTT_URL);

const CAMERAS = ['CAM_001', 'CAM_002', 'CAM_003'];

const app = express();
app.use(cors());
app.use(express.json());

// Function to trigger motion detection for a specific camera
async function triggerMotion(deviceId) {
  if (!CAMERAS.includes(deviceId)) {
    throw new Error(`Invalid camera ID: ${deviceId}`);
  }

  const motionPayload = {
    deviceId,
    timestamp: new Date().toISOString(),
    type: 'motion_detected',
    hasImage: true
  };
  console.log(`Manual trigger: Motion detected on ${deviceId}`);
  client.publish(`cameras/${deviceId}/motion`, JSON.stringify(motionPayload));
  
  try {
    // Fetch a random image (e.g. person or car)
    const response = await fetch('https://loremflickr.com/640/480/person,car');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    const imagePayload = {
      deviceId,
      image: base64Image,
      timestamp: new Date().toISOString()
    };
    client.publish(`cameras/${deviceId}/image`, JSON.stringify(imagePayload));
    console.log(`Image sent for ${deviceId}`);
    return { success: true, deviceId };
  } catch (error) {
    console.error('Failed to fetch/send image:', error);
    throw error;
  }
}

// API endpoint to trigger motion detection
app.post('/trigger', async (req, res) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const result = await triggerMotion(deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of cameras
app.get('/cameras', (req, res) => {
  res.json({ cameras: CAMERAS });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mqttConnected: client.connected });
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Keep heartbeat for device status
  setInterval(() => {
    CAMERAS.forEach(deviceId => {
      const statusPayload = {
        deviceId,
        status: 'online',
        batteryLevel: Math.floor(Math.random() * 20) + 80,
        signalStrength: -Math.floor(Math.random() * 30) - 30,
        timestamp: new Date().toISOString()
      };
      client.publish(`cameras/${deviceId}/status`, JSON.stringify(statusPayload));
    });
  }, 30000);
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`IoT Simulator API running on port ${PORT}`);
});
