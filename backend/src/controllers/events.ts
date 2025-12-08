import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

export const getEvents = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { page = 1, limit = 10, deviceId, type, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      device: { userId }
    };
    if (deviceId) where.deviceId = String(deviceId);
    if (type) where.type = String(type);
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { timestamp: 'desc' },
        include: {
          device: true,
          detections: true,
          alerts: true,
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      data: events,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        device: true,
        detections: true,
        alerts: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// Placeholder for manual upload - requires file handling logic
export const createManualEvent = async (req: Request, res: Response) => {
  try {
    // TODO: Implement file upload handling and AI service call
    res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};
