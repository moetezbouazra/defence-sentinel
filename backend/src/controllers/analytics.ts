import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
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
          timestamp: { gte: twentyFourHoursAgo }
        }
      }),
      prisma.alert.count({
        where: {
          acknowledged: false,
          severity: 'CRITICAL'
        }
      }),
      prisma.device.count({
        where: { status: 'ONLINE' }
      }),
      prisma.device.count()
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

export const getTimeline = async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const timeline = await prisma.$queryRaw`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM "Event"
      WHERE timestamp >= ${sevenDaysAgo}
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp) ASC
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

export const getThreatDistribution = async (req: Request, res: Response) => {
  try {
    const distribution = await prisma.detection.groupBy({
      by: ['threatLevel'],
      _count: {
        threatLevel: true
      }
    });

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threat distribution' });
  }
};

export const getDevicePerformance = async (req: Request, res: Response) => {
  try {
    const devices = await prisma.device.findMany({
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
