import { Visitor, AccessStatus, DestinationType, LogEntry, ChartData } from './types';

export const LOCATIONS = [
  { name: 'General Meeting Room A', type: DestinationType.GENERAL },
  { name: 'General Meeting Room B', type: DestinationType.GENERAL },
  { name: 'Cafeteria', type: DestinationType.GENERAL },
  { name: 'CEO Office', type: DestinationType.RESTRICTED },
  { name: 'NLDC (Network Load Dispatch)', type: DestinationType.RESTRICTED },
  { name: 'IT Server Level', type: DestinationType.RESTRICTED },
  { name: 'Public Sports Facility', type: DestinationType.GENERAL },
];

export const INITIAL_VISITORS: Visitor[] = [
  {
    id: 'V-1001',
    name: 'Sarah Connor',
    icNumber: '890101-14-5566',
    plateNumber: 'WAA 1234',
    vehicleModel: 'Toyota Camry',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    type: 'GUEST',
    destination: 'General Meeting Room A',
    destinationType: DestinationType.GENERAL,
    checkInTime: '09:15 AM',
    status: AccessStatus.CHECKED_IN,
    riskLevel: 'LOW',
  },
  {
    id: 'S-502',
    name: 'Dr. Miles Dyson',
    staffId: 'CYBER-99',
    type: 'STAFF',
    destination: 'IT Server Level',
    destinationType: DestinationType.RESTRICTED,
    checkInTime: '08:30 AM',
    status: AccessStatus.CHECKED_IN,
    riskLevel: 'LOW',
  },
  {
    id: 'V-1003',
    name: 'John Doe',
    icNumber: '950505-10-1234',
    photoUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150',
    type: 'GUEST',
    destination: 'CEO Office',
    destinationType: DestinationType.RESTRICTED,
    checkInTime: '10:00 AM',
    status: AccessStatus.PENDING,
    riskLevel: 'MEDIUM', // Flagged for review
  }
];

export const MOCK_LOGS: LogEntry[] = [
  { id: 'L1', timestamp: '10:05 AM', action: 'Watchlist Check', user: 'System', details: 'No matches found for John Doe', type: 'INFO' },
  { id: 'L2', timestamp: '09:45 AM', action: 'Perimeter Alert', user: 'System', details: 'Vehicle overstaying in Zone B', type: 'WARNING' },
  { id: 'L3', timestamp: '09:15 AM', action: 'Check-In', user: 'Sarah Connor', details: 'Verified via Face Recognition', type: 'INFO' },
  { id: 'L4', timestamp: '08:30 AM', action: 'Staff Entry', user: 'Dr. Miles Dyson', details: 'Biometric Scan Success', type: 'INFO' },
];

export const ANALYTICS_DATA: ChartData[] = [
  { time: '08:00', visitors: 12 },
  { time: '09:00', visitors: 45 },
  { time: '10:00', visitors: 65 },
  { time: '11:00', visitors: 45 },
  { time: '12:00', visitors: 150 }, // Friday prayers peak start
  { time: '13:00', visitors: 185 }, // Peak
  { time: '14:00', visitors: 160 }, // Peak continuing
  { time: '15:00', visitors: 80 },  // Tapering off
  { time: '16:00', visitors: 40 },
];
