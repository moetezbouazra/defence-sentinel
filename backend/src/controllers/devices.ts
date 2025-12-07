import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const deviceSchema = z.object({
  name: z.string(),
  deviceId: z.string(),
  location: z.string().optional(),
});

export const getDevices = async (req: Request, res: Response) => {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDevice = async (req: Request, res: Response) => {
  try {
    const { name, deviceId, location } = deviceSchema.parse(req.body);
    
    const existing = await prisma.device.findUnique({ where: { deviceId } });
    if (existing) {
      return res.status(400).json({ error: 'Device ID already exists' });
    }

    const device = await prisma.device.create({
      data: { name, deviceId, location },
    });
    res.status(201).json(device);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDevice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
