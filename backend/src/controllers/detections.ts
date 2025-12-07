import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDetections = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, className, threatLevel, eventId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (className) where.className = String(className);
    if (threatLevel) where.threatLevel = String(threatLevel);
    if (eventId) where.eventId = String(eventId);

    const [detections, total] = await Promise.all([
      prisma.detection.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            include: {
              device: true,
            },
          },
        },
      }),
      prisma.detection.count({ where }),
    ]);

    res.json({
      data: detections,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch detections' });
  }
};

export const getDetectionStats = async (req: Request, res: Response) => {
  try {
    const totalDetections = await prisma.detection.count();
    
    const byClass = await prisma.detection.groupBy({
      by: ['className'],
      _count: {
        className: true,
      },
    });

    const byThreatLevel = await prisma.detection.groupBy({
      by: ['threatLevel'],
      _count: {
        threatLevel: true,
      },
    });

    res.json({
      total: totalDetections,
      byClass,
      byThreatLevel,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch detection stats' });
  }
};
