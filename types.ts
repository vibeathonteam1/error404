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

export enum AccessTier {
  GREEN = 'GREEN',
  ORANGE = 'ORANGE',
  RED_1 = 'RED_1',
  RED_2 = 'RED_2'
}

export enum DestinationType {
  GENERAL = 'GENERAL',
  RESTRICTED = 'RESTRICTED'
}

export interface Visitor {
  id: string;
  name: string;
  icNumber?: string;
  staffId?: string;
  plateNumber?: string;
  vehicleModel?: string;
  photoUrl?: string;
  type: 'GUEST' | 'STAFF' | 'PUBLIC';
  accessTier: AccessTier;
  checkInTime: string;
  status: AccessStatus;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  entrySource?: 'MANUAL' | 'OCR';
  hasInvitation?: boolean;
}

// Added LogEntry interface for system event tracking
export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  type: 'INFO' | 'WARNING' | 'ERROR';
}

// Added ChartData interface for analytics data structures
export interface ChartData {
  time: string;
  visitors: number;
}

export const STATUS_LABELS: Record<AccessStatus, string> = {
  [AccessStatus.APPROVED]: 'Allowed',
  [AccessStatus.CHECKED_IN]: 'Allowed',
  [AccessStatus.PENDING]: 'Pending',
  [AccessStatus.REJECTED]: 'Not Allowed',
  [AccessStatus.CHECKED_OUT]: 'Not Allowed'
};

export const getTierDisplayLabel = (tier: AccessTier, isStaffOrAdmin: boolean): string => {
  if (isStaffOrAdmin) return tier.replace(/_/g, ' ');

  switch (tier) {
    case AccessTier.GREEN: return 'General Access';
    case AccessTier.ORANGE: return 'Verified Tower Access';
    case AccessTier.RED_1: return 'NLDC Building Access';
    case AccessTier.RED_2: return 'CEO Office Access';
    default: return 'Basic Access';
  }
};

export const getAccessGuidance = (tier: AccessTier, status: AccessStatus): string => {
  if (status === AccessStatus.PENDING) {
    return 'Your access is currently Pending. Please wait for security approval or visit the operator desk.';
  }

  switch (tier) {
    case AccessTier.GREEN:
      return 'Proceed to general areas. Standard entry is always allowed.';
    case AccessTier.ORANGE:
      return 'Proceed to Platinum Towers (A–D). Access is active based on your invitation.';
    case AccessTier.RED_1:
      return 'Proceed to NLDC Building. Verification required at building perimeter.';
    case AccessTier.RED_2:
      return 'Proceed to Tower A Level 17/18. Management clearance required.';
    default:
      return 'Proceed to the main security checkpoint.';
  }
};