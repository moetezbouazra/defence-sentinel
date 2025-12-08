import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const deviceSchema = z.object({
  name: z.string(),
  deviceId: z.string(),
  location: z.string().optional(),
});

export const getDevices = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDevice = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, deviceId, location } = deviceSchema.parse(req.body);
    
    const existing = await prisma.device.findUnique({ where: { deviceId } });
    if (existing) {
      return res.status(400).json({ error: 'Device ID already exists' });
    }

    const device = await prisma.device.create({
      data: { 
        name, 
        deviceId, 
        location, 
        userId,
        status: 'ONLINE', // Default to ONLINE for manually created devices
      },
    });
    res.status(201).json(device);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDevice = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const device = await prisma.device.findFirst({ 
      where: { id, userId } 
    });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
