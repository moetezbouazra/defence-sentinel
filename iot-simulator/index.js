const mqtt = require('mqtt');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(MQTT_URL);

const CAMERAS = ['CAM_001', 'CAM_002', 'CAM_003'];

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Simulate heartbeat
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

  // Simulate motion
  setInterval(async () => {
    const deviceId = CAMERAS[Math.floor(Math.random() * CAMERAS.length)];
    const motionPayload = {
      deviceId,
      timestamp: new Date().toISOString(),
      type: 'motion_detected',
      hasImage: true
    };
    console.log(`Motion detected on ${deviceId}`);
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
    } catch (error) {
      console.error('Failed to fetch/send image:', error);
    }
  }, 15000);
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
});
