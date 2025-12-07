export interface Device {
  id: string;
  name: string;
  deviceId: string;
  location?: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lastSeen?: string;
}

export interface Detection {
  id: string;
  className: string;
  confidence: number;
  bbox: any; // JSON
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  annotatedImageUrl?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  deviceId: string;
  device: Device;
  type: 'MOTION' | 'DETECTION' | 'MANUAL';
  timestamp: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  detections: Detection[];
  alerts: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
