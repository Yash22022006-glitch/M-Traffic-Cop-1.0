
import { Case, CaseStatus, LatLng, ViolationType, UserRole, User, AuditLog, MediaType, SensorSource } from './types';

export const SPEED_LIMIT_KMH = 60; // Threshold for automatic speeding violation detection

export const VIOLATION_TYPE_COLORS: Record<ViolationType, string> = {
  [ViolationType.RED_LIGHT_JUMP]: 'bg-red-500',
  [ViolationType.NO_HELMET]: 'bg-yellow-500',
  [ViolationType.TRIPLE_RIDING]: 'bg-orange-500',
  [ViolationType.NO_SEATBELT]: 'bg-blue-500',
  [ViolationType.WRONG_WAY]: 'bg-purple-500',
  [ViolationType.PHONE_IN_HAND]: 'bg-pink-500',
  [ViolationType.STOP_LINE_OVERRUN]: 'bg-indigo-500',
  [ViolationType.SPEEDING]: 'bg-green-500',
  [ViolationType.ILLEGAL_PARKING]: 'bg-gray-500',
  [ViolationType.AMBULANCE]: 'bg-blue-700', // Added missing color mapping
};

// Mock User Credentials for login
export const MOCK_USER_CREDENTIALS = {
  'murugan&222': { id: 'admin-murugan', password: '123', role: UserRole.ADMIN },
  'murugan_222': { id: 'public-murugan', password: '123', role: UserRole.RECORDER },
};

// Mock Users - Added required 'name' property to fix type errors
export const MOCK_USERS: User[] = [
  { id: 'admin-murugan', name: 'Murugan Admin', role: UserRole.ADMIN, unit: 'HQ', email: 'murugan&222@example.com', phone: '123-456-7890', deviceIds: [], avatar: 'https://i.pravatar.cc/150?u=admin-murugan' },
  { id: 'public-murugan', name: 'Murugan Public', role: UserRole.RECORDER, unit: 'Field', email: 'murugan_222@example.com', phone: '987-654-3210', deviceIds: ['device-xyz'], avatar: 'https://i.pravatar.cc/150?u=public-murugan' },
  { id: 'user-2', name: 'Reviewer East', role: UserRole.REVIEWER, unit: 'RTO East', email: 'reviewer_east@example.com', phone: '123-456-7891', deviceIds: [], avatar: 'https://i.pravatar.cc/150?u=user-2' },
  { id: 'user-3', name: 'Recorder Patrol 1', role: UserRole.RECORDER, unit: 'Patrol 1', email: 'recorder_patrol1@example.com', phone: '123-456-7892', deviceIds: ['device-abc'], avatar: 'https://i.pravatar.cc/150?u=user-3' },
];

export const ADMIN_DEFAULT_ID: string = 'admin-murugan'; // Admin user for dashboard actions
export const RECORDER_DEFAULT_ID: string = 'public-murugan'; // Default recorder for new cases by public

// Configuration for simulated AI detection logic in CameraView
export const SIMULATED_AI_DETECTION_CONFIG = {
  detectionCycleProbability: 0.5, // 50% chance the AI attempts a detection in each interval
  minConfidenceThreshold: 0.65, // Any simulated detection below this is considered a false positive and discarded
  violationTypeConfigs: {
    [ViolationType.RED_LIGHT_JUMP]: { baseConfidence: 0.90, confidenceRange: 0.05, detectionChanceMultiplier: 1.5 },
    [ViolationType.NO_HELMET]: { baseConfidence: 0.85, confidenceRange: 0.10, detectionChanceMultiplier: 1.2 },
    [ViolationType.TRIPLE_RIDING]: { baseConfidence: 0.75, confidenceRange: 0.15, detectionChanceMultiplier: 0.8 },
    [ViolationType.NO_SEATBELT]: { baseConfidence: 0.92, confidenceRange: 0.03, detectionChanceMultiplier: 1.7 },
    [ViolationType.WRONG_WAY]: { baseConfidence: 0.80, confidenceRange: 0.10, detectionChanceMultiplier: 1.0 },
    [ViolationType.PHONE_IN_HAND]: { baseConfidence: 0.70, confidenceRange: 0.18, detectionChanceMultiplier: 0.9 },
    [ViolationType.STOP_LINE_OVERRUN]: { baseConfidence: 0.88, confidenceRange: 0.07, detectionChanceMultiplier: 1.3 },
    [ViolationType.SPEEDING]: { baseConfidence: 0.93, confidenceRange: 0.04, detectionChanceMultiplier: 1.6 },
    [ViolationType.ILLEGAL_PARKING]: { baseConfidence: 0.60, confidenceRange: 0.20, detectionChanceMultiplier: 0.5 },
  }
};


// Mock Cases
const mockLocations: LatLng[] = [
  { latitude: 13.067439, longitude: 80.237617 }, // Anna Salai
  { latitude: 13.0418, longitude: 80.2341 },    // T. Nagar
  { latitude: 13.0012, longitude: 80.2565 },    // Adyar
  { latitude: 13.0333, longitude: 80.2667 },    // Mylapore
  { latitude: 12.9792, longitude: 80.2184 },    // Velachery
];

const generateRandomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
};

const getRandomLocation = () => {
  const loc = mockLocations[Math.floor(Math.random() * mockLocations.length)];
  const places = [
    'Anna Salai', 'T. Nagar', 'Adyar', 'Mylapore', 'Velachery',
    'Besant Nagar', 'Anna Nagar', 'Nungambakkam', 'Guindy', 'Marina Beach'
  ];
  return {
    ...loc,
    geoHash: 'abcde', // Placeholder
    placeName: places[Math.floor(Math.random() * places.length)],
  };
};

export const getViolationImage = (type: ViolationType, index: number): string => {
  const seeds: Record<ViolationType, string> = {
    [ViolationType.RED_LIGHT_JUMP]: 'traffic-light',
    [ViolationType.NO_HELMET]: 'motorcycle-helmet',
    [ViolationType.TRIPLE_RIDING]: 'scooter-three-people',
    [ViolationType.NO_SEATBELT]: 'car-seatbelt',
    [ViolationType.WRONG_WAY]: 'one-way-street',
    [ViolationType.PHONE_IN_HAND]: 'driving-phone',
    [ViolationType.STOP_LINE_OVERRUN]: 'stop-line',
    [ViolationType.SPEEDING]: 'speedometer',
    [ViolationType.ILLEGAL_PARKING]: 'no-parking',
    [ViolationType.AMBULANCE]: 'ambulance',
  };
  const seed = seeds[type] || 'traffic';
  return `https://picsum.photos/seed/${seed}-${index}/600/400`;
};

export const MOCK_CASES: Case[] = Array.from({ length: 50 }).map((_, i) => {
  const violationType = Object.values(ViolationType)[Math.floor(Math.random() * Object.values(ViolationType).length)];
  const sensorSource = Object.values(SensorSource)[Math.floor(Math.random() * Object.values(SensorSource).length)];
  return {
    id: `case-${String(i + 1).padStart(4, '0')}`,
    createdAt: generateRandomDate(new Date('2024-06-01T00:00:00Z'), new Date()),
    status: Object.values(CaseStatus)[Math.floor(Math.random() * Object.values(CaseStatus).length)],
    violationTypes: [violationType],
    confidence: parseFloat((Math.random() * (0.95 - 0.7) + 0.7).toFixed(2)),
    plateText: `KA01AB${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
    plateConfidence: parseFloat((Math.random() * (0.9 - 0.6) + 0.6).toFixed(2)),
    location: getRandomLocation(),
    deviceId: sensorSource,
    recorderId: RECORDER_DEFAULT_ID,
    mediaUrls: [
      getViolationImage(violationType, i),
      getViolationImage(violationType, i + 100),
    ],
    rulesMatched: ['Autonomous-AI-Filing'],
    duplicateOf: null,
    sensorSource: sensorSource,
    description: `Automated detection of ${violationType.replace(/_/g, ' ').toLowerCase()} at ${getRandomLocation().placeName}. Vehicle identified with license plate ${`KA01AB${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`}. AI confidence level at ${parseFloat((Math.random() * (0.95 - 0.7) + 0.7).toFixed(2)) * 100}%.`
  };
});

// Mock Audit Logs
export const MOCK_AUDIT_LOGS: AuditLog[] = MOCK_CASES.flatMap(c => {
  const logs: AuditLog[] = [{
    id: `audit-${c.id}-001`,
    caseId: c.id,
    action: 'Case Created',
    actorId: c.recorderId,
    notes: 'Auto-detected by AI',
    ts: c.createdAt,
  }];
  if (c.status === CaseStatus.PENDING_REVIEW || c.status === CaseStatus.ACCEPTED || c.status === CaseStatus.REJECTED || c.status === CaseStatus.ASSIGNED) {
    logs.push({
      id: `audit-${c.id}-002`,
      caseId: c.id,
      action: 'Awaiting Review',
      actorId: ADMIN_DEFAULT_ID, // Admin
      notes: 'Submitted for review',
      ts: generateRandomDate(new Date(c.createdAt), new Date()),
    });
  }
  if (c.status === CaseStatus.ACCEPTED) {
    logs.push({
      id: `audit-${c.id}-003`,
      caseId: c.id,
      action: 'Case Accepted',
      actorId: MOCK_USERS.find(u => u.role === UserRole.REVIEWER)?.id || ADMIN_DEFAULT_ID, // Reviewer or Admin
      notes: 'Approved by reviewer',
      ts: generateRandomDate(new Date(logs[logs.length - 1].ts), new Date()),
    });
  } else if (c.status === CaseStatus.REJECTED) {
    logs.push({
      id: `audit-${c.id}-003`,
      caseId: c.id,
      action: 'Case Rejected',
      actorId: MOCK_USERS.find(u => u.role === UserRole.REVIEWER)?.id || ADMIN_DEFAULT_ID, // Reviewer or Admin
      notes: 'Insufficient evidence',
      ts: generateRandomDate(new Date(logs[logs.length - 1].ts), new Date()),
    });
  }
  if (c.status === CaseStatus.ASSIGNED) {
    logs.push({
      id: `audit-${c.id}-004`,
      caseId: c.id,
      action: 'Case Assigned',
      actorId: ADMIN_DEFAULT_ID, // Admin
      notes: 'Assigned to RTO East',
      ts: generateRandomDate(new Date(logs[logs.length - 1].ts), new Date()),
    });
  }
  return logs;
}).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());