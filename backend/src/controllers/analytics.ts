import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalEvents24h,
      activeThreats,
      onlineDevices,
      totalDevices
    ] = await Promise.all([
      prisma.event.count({
        where: {
          timestamp: { gte: twentyFourHoursAgo },
          device: { userId }
        }
      }),
      prisma.alert.count({
        where: {
          acknowledged: false,
          severity: 'CRITICAL',
          userId
        }
      }),
      prisma.device.count({
        where: { status: 'ONLINE', userId }
      }),
      prisma.device.count({ where: { userId } })
    ]);

    res.json({
      totalEvents24h,
      activeThreats,
      onlineDevices,
      totalDevices
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getTimeline = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const timeline = await prisma.$queryRaw`
      SELECT DATE(e.timestamp) as date, COUNT(*) as count
      FROM "Event" e
      JOIN "Device" d ON e."deviceId" = d.id
      WHERE e.timestamp >= ${sevenDaysAgo} AND d."userId" = ${userId}
      GROUP BY DATE(e.timestamp)
      ORDER BY DATE(e.timestamp) ASC
    `;

    const serializedTimeline = (timeline as any[]).map(item => ({
      date: item.date,
      count: Number(item.count)
    }));

    res.json(serializedTimeline);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
};

export const getThreatDistribution = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const distribution = await prisma.detection.groupBy({
      by: ['threatLevel'],
      where: {
        event: {
          device: { userId }
        }
      },
      _count: {
        threatLevel: true
      }
    });

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threat distribution' });
  }
};

export const getDevicePerformance = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const devices = await prisma.device.findMany({
      where: { userId },
      include: {
        events: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        },
        _count: {
          select: {
            events: true
          }
        }
      }
    });

    const deviceStats = devices.map(device => ({
      id: device.id,
      name: device.name,
      deviceId: device.deviceId,
      status: device.status,
      lastSeen: device.lastSeen,
      events24h: device.events.length,
      totalEvents: device._count.events
    }));

    res.json(deviceStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch device performance' });
  }
};
