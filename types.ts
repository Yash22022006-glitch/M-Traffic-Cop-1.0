
export enum CaseStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ASSIGNED = 'ASSIGNED',
  EMERGENCY = 'EMERGENCY', 
  EMERGENCY_CONFIRMED = 'EMERGENCY_CONFIRMED',
}

export enum SensorSource {
  LOCAL = 'LOCAL_PHONE',
  CCTV_1KM = 'CCTV_WI-FI_1KM',
  CCTV_100M = 'CCTV_WI-FI_100M',
}

export enum ViolationType {
  RED_LIGHT_JUMP = 'RED_LIGHT_JUMP',
  NO_HELMET = 'NO_HELMET',
  TRIPLE_RIDING = 'TRIPLE_RIDING',
  NO_SEATBELT = 'NO_SEATBELT',
  WRONG_WAY = 'WRONG_WAY',
  PHONE_IN_HAND = 'PHONE_IN_HAND',
  STOP_LINE_OVERRUN = 'STOP_LINE_OVERRUN',
  SPEEDING = 'SPEEDING',
  ILLEGAL_PARKING = 'ILLEGAL_PARKING',
  AMBULANCE = 'AMBULANCE', 
}

export interface Hospital {
  name: string;
  distance: string;
  eta: string;
  address: string;
  uri: string;
}

export interface AuditLog {
  id: string;
  caseId: string;
  action: string;
  actorId: string;
  notes: string;
  ts: string;
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Case {
  id: string;
  createdAt: string;
  status: CaseStatus;
  violationTypes: ViolationType[];
  confidence: number;
  plateText: string;
  plateConfidence: number;
  location: LatLng & {
    geoHash: string;
    placeName: string;
  };
  deviceId: string;
  recorderId: string;
  mediaUrls: string[];
  rulesMatched: string[];
  duplicateOf: string | null;
  assigneeId?: string;
  hospitalRoute?: Hospital; 
  sensorSource?: SensorSource;
  description?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  POLICE = 'POLICE',
  PUBLIC = 'PUBLIC',
  RECORDER = 'RECORDER',
  REVIEWER = 'REVIEWER',
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  unit: string;
  email: string;
  phone: string;
  avatar?: string;
  dob?: string;
  aadhaar?: string;
  deviceIds: string[];
  password?: string;
}

export enum DutyStatus {
  ON_DUTY = 'ON_DUTY',
  NEXT_DUTY = 'NEXT_DUTY',
  PAST_DUTY = 'PAST_DUTY',
}

export interface OfficerDuty {
  id: string;
  userId: string;
  name: string;
  badgeId: string;
  status: DutyStatus;
  shift: string;
  assignedUnit: string;
  location?: string;
}

export interface TrafficInfo {
  summary: string;
  specificArea: string;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  routeImpacts: {
    route: string;
    delay: string;
    reason: string;
  }[];
  sources: { title: string; uri: string }[];
}

export interface FilterOptions {
  status?: CaseStatus;
  violationType?: ViolationType;
  confidenceMin?: number;
  locationSearch?: string;
  createdAtAfter?: string; 
  createdAtBefore?: string; 
  searchTerm?: string; 
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ManualReport {
  violationType: ViolationType[]; 
  notes?: string;
  imageBase64: string;
  location?: LatLng;
  timestamp: string;
  reporterId: string; 
}
