import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAlerts = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { page = 1, limit = 10, severity, acknowledged } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
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

export const getUnreadCount = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const count = await prisma.alert.count({
      where: { acknowledged: false, userId },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const acknowledgeAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // First check if alert belongs to user
    const existingAlert = await prisma.alert.findFirst({
      where: { id, userId }
    });
    if (!existingAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

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
