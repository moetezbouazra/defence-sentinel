import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse({ ...req.body, ...req.query, ...req.params });
      req.body = data;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  notificationPreferences: z.record(z.any()).optional(),
  displayPreferences: z.record(z.any()).optional(),
});

// Device schemas
export const createDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE']).optional(),
  metadata: z.record(z.any()).optional(),
});

// Event schemas
export const eventQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  deviceId: z.string().optional(),
  type: z.enum(['MOTION', 'DETECTION', 'MANUAL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Detection schemas
export const detectionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  eventId: z.string().uuid().optional(),
  className: z.string().optional(),
  threatLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

// Alert schemas
export const alertQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  acknowledged: z.coerce.boolean().optional(),
});

export const acknowledgeAlertSchema = z.object({
  id: z.string().uuid(),
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  deviceId: z.string().uuid().optional(),
});
