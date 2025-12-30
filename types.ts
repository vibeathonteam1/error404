export enum UserRole {
  VISITOR = 'VISITOR',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}

export enum AccessStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT'
}

export enum DestinationType {
  GENERAL = 'GENERAL',
  RESTRICTED = 'RESTRICTED' // CEO Office, NLDC, IT Level
}

export interface Visitor {
  id: string;
  name: string;
  icNumber?: string; // Identity Card
  staffId?: string;
  plateNumber?: string;
  vehicleModel?: string;
  photoUrl?: string; // Placeholder for uploaded image
  type: 'GUEST' | 'STAFF' | 'PUBLIC';
  destination: string;
  destinationType: DestinationType;
  checkInTime: string;
  status: AccessStatus;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
}

export interface ChartData {
  time: string;
  visitors: number;
}