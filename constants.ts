import { Visitor, AccessStatus, DestinationType, AccessTier, LogEntry, ChartData } from './types';

export interface LocationInfo {
  name: string;
  concealedName: string;
  type: DestinationType;
  tier: AccessTier;
}

export const LOCATIONS: LocationInfo[] = [
  { name: 'General Meeting Room A', concealedName: 'General Purpose Area A', type: DestinationType.GENERAL, tier: AccessTier.GREEN },
  { name: 'General Meeting Room B', concealedName: 'General Purpose Area B', type: DestinationType.GENERAL, tier: AccessTier.GREEN },
  { name: 'Cafeteria', concealedName: 'Dining Hall', type: DestinationType.GENERAL, tier: AccessTier.GREEN },
  { name: 'Tower A - Platinum', concealedName: 'Verified Tower Zone', type: DestinationType.RESTRICTED, tier: AccessTier.ORANGE },
  { name: 'Tower B - Platinum', concealedName: 'Verified Tower Zone', type: DestinationType.RESTRICTED, tier: AccessTier.ORANGE },
  { name: 'CEO Office (Tower A L17/18)', concealedName: 'High-Security Management Suite', type: DestinationType.RESTRICTED, tier: AccessTier.RED_2 },
  { name: 'NLDC Building', concealedName: 'System Control Center', type: DestinationType.RESTRICTED, tier: AccessTier.RED_1 },
  { name: 'Public Sports Facility', concealedName: 'General Activity Area', type: DestinationType.GENERAL, tier: AccessTier.GREEN },
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
    accessTier: AccessTier.GREEN,
    checkInTime: '09:15 AM',
    status: AccessStatus.CHECKED_IN,
    riskLevel: 'LOW',
    hasInvitation: false
  },
  {
    id: 'V-1003',
    name: 'John Doe',
    icNumber: '950505-10-1234',
    type: 'GUEST',
    accessTier: AccessTier.RED_2,
    checkInTime: '10:00 AM',
    status: AccessStatus.PENDING,
    riskLevel: 'MEDIUM',
    hasInvitation: false
  },
  {
    id: 'V-1005',
    name: 'James Bond',
    icNumber: '000707-01-0007',
    type: 'GUEST',
    accessTier: AccessTier.ORANGE,
    checkInTime: '10:45 AM',
    status: AccessStatus.CHECKED_IN,
    riskLevel: 'LOW',
    hasInvitation: true
  },
  {
    id: 'S-2001',
    name: 'Officer PB-2001',
    staffId: 'PB-2001',
    type: 'STAFF',
    accessTier: AccessTier.GREEN, // Staff defaults to GREEN as per Rule 1
    checkInTime: '08:00 AM',
    status: AccessStatus.CHECKED_IN,
    riskLevel: 'LOW',
    hasInvitation: false
  }
];

export const MOCK_LOGS: LogEntry[] = [
  { id: 'L1', timestamp: '10:05 AM', action: 'Tier Upgrade', user: 'Operator', details: 'Upgraded John Doe to RED_2 for CEO Visit', type: 'INFO' },
  { id: 'L2', timestamp: '09:45 AM', action: 'Perimeter Alert', user: 'System', details: 'Vehicle overstaying in Zone B', type: 'WARNING' },
  { id: 'L3', timestamp: '09:15 AM', action: 'Check-In', user: 'Sarah Connor', details: 'Verified via Face Recognition - GREEN Tier', type: 'INFO' },
];

export const ANALYTICS_DATA: ChartData[] = [
  { time: '08:00', visitors: 12 },
  { time: '09:00', visitors: 45 },
  { time: '10:00', visitors: 65 },
  { time: '11:00', visitors: 45 },
  { time: '12:00', visitors: 150 },
  { time: '13:00', visitors: 185 },
  { time: '14:00', visitors: 160 },
  { time: '15:00', visitors: 80 },
  { time: '16:00', visitors: 40 },
];