import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, severity, acknowledged } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (severity) where.severity = String(severity);
    if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
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
      prisma.alert.count({ where }),
    ]);

    res.json({
      data: alerts,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const count = await prisma.alert.count({
      where: { acknowledged: false },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
};
