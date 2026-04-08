
import { GoogleGenAI, Type } from '@google/genai';
import { MOCK_CASES, MOCK_USERS, MOCK_USER_CREDENTIALS } from '../constants';
import { 
  Case, 
  CaseStatus, 
  FilterOptions, 
  PaginationInfo, 
  User, 
  LatLng, 
  UserRole, 
  ViolationType, 
  ManualReport, 
  OfficerDuty, 
  DutyStatus, 
  TrafficInfo,
  Hospital
} from '../types';

export interface PaginatedCases {
  cases: Case[];
  pagination: PaginationInfo;
}

// Mock session management
const MOCK_SESSION_KEY = 'mtraffic_mock_session';

const getApiKey = () => {
  try {
    // Prioritize GEMINI_API_KEY as per platform guidelines
    return (process.env as any).GEMINI_API_KEY || (process.env as any).API_KEY || '';
  } catch (e) {
    return '';
  }
};
const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper to handle 404 errors as per guidelines
const handleApiError = async (error: any) => {
  console.error("API Error details:", error);
  const errorMessage = error?.message || String(error);
  if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
    if (window.aistudio?.openSelectKey) {
      console.warn("Model not found or 404 error. Prompting for new API key...");
      await window.aistudio.openSelectKey();
    }
  }
  throw error;
};

let SESSION_USERS = [...MOCK_USERS];
let SESSION_CASES = [...MOCK_CASES];

export const signInUser = async (identifier: string, password: string): Promise<User> => {
  await delay(500); // Simulate network
  const email = identifier.includes('@') ? identifier : `${identifier}@mtraffic.local`;
  
  // 1. Check against MOCK_USER_CREDENTIALS for specific hardcoded demo accounts
  const credEntry = Object.entries(MOCK_USER_CREDENTIALS).find(([id, cred]) => 
    (id === identifier || `${id}@mtraffic.local` === email) && cred.password === password
  );

  if (credEntry) {
    const [, cred] = credEntry;
    const user = SESSION_USERS.find(u => u.id === cred.id);
    if (user) {
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
      return user;
    }
  }

  // 2. Check general SESSION_USERS (including newly signed up ones)
  const user = SESSION_USERS.find(u => u.email === email || u.id === identifier || u.email === identifier);
  
  if (user) {
    // If it's a newly signed up user, they might have a password field
    if (user.password && user.password === password) {
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
      return user;
    }
    // Fallback for other mock users who don't have a password set (default to '123')
    if (!user.password && password === '123') {
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
      return user;
    }
  }

  throw new Error("Invalid credentials. Try 'murugan&222' with password '123'.");
};

export const signUpUser = async (userData: any): Promise<User> => {
  await delay(800);
  const newUser: User = {
    id: `u-${Date.now()}`,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    unit: userData.role === UserRole.PUBLIC ? 'Public' : (userData.role === UserRole.ADMIN ? 'HQ Command' : 'HQ Unit'),
    phone: '',
    avatar: userData.avatar,
    deviceIds: [],
    dob: userData.dob,
    aadhaar: userData.aadhaar,
    password: userData.password, // Store password for mock auth
  };
  SESSION_USERS.push(newUser);
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(newUser));
  return newUser;
};

export const seedDemoUsers = async (): Promise<string> => {
  await delay(800);
  // Ensure demo users from credentials are in SESSION_USERS if not already
  Object.entries(MOCK_USER_CREDENTIALS).forEach(([identifier, cred]) => {
    if (!SESSION_USERS.find(u => u.id === cred.id)) {
      const demoUser: User = {
        id: cred.id,
        name: identifier.includes('&') ? 'Admin User' : 'Public User',
        role: cred.role,
        unit: cred.role === UserRole.ADMIN ? 'HQ' : 'Field',
        email: `${identifier}@mtraffic.local`,
        phone: '000-000-0000',
        deviceIds: [],
        password: cred.password
      };
      SESSION_USERS.push(demoUser);
    }
  });
  return "Demo environment initialized successfully. You can now login with 'murugan&222' or 'murugan_222' using password '123'.";
};

export const logoutUser = async () => {
  localStorage.removeItem(MOCK_SESSION_KEY);
};

export const getMockSession = (): User | null => {
  const session = localStorage.getItem(MOCK_SESSION_KEY);
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
};

export const fetchCaseById = async (id: string): Promise<Case | undefined> => SESSION_CASES.find(c => c.id === id);

export const fetchCases = async (filters: FilterOptions, pagination: { page: number; pageSize: number }): Promise<PaginatedCases> => {
  let res = [...SESSION_CASES];
  
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    res = res.filter(c => 
      c.id.toLowerCase().includes(term) || 
      c.plateText.toLowerCase().includes(term) ||
      c.violationTypes.some(v => v.toLowerCase().replace(/_/g, ' ').includes(term))
    );
  }
  
  if (filters.status) {
    res = res.filter(c => c.status === filters.status);
  }
  
  if (filters.violationType) {
    res = res.filter(c => c.violationTypes.includes(filters.violationType as ViolationType));
  }
  
  if (filters.confidenceMin !== undefined) {
    res = res.filter(c => c.confidence >= (filters.confidenceMin || 0));
  }
  
  if (filters.locationSearch) {
    const term = filters.locationSearch.toLowerCase();
    res = res.filter(c => c.location.placeName.toLowerCase().includes(term));
  }
  
  if (filters.createdAtAfter) {
    const afterDate = new Date(filters.createdAtAfter);
    res = res.filter(c => new Date(c.createdAt) >= afterDate);
  }
  
  if (filters.createdAtBefore) {
    const beforeDate = new Date(filters.createdAtBefore);
    // Add 1 day to beforeDate to include the entire day if it's just a date string
    beforeDate.setDate(beforeDate.getDate() + 1);
    res = res.filter(c => new Date(c.createdAt) < beforeDate);
  }

  const totalItems = res.length;
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  return {
    cases: res.slice(startIndex, startIndex + pagination.pageSize),
    pagination: { ...pagination, totalItems, totalPages: Math.ceil(totalItems / pagination.pageSize) }
  };
};

export const updateCaseStatus = async (id: string, status: CaseStatus) => {
  const c = SESSION_CASES.find(x => x.id === id);
  if (c) c.status = status;
  return c;
};

export const detectViolationWithGemini = async (imageBase64: string) => {
  try {
    const ai = getAI();
    const data = imageBase64.split(',')[1] || imageBase64;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Standardized flash model name for text/vision tasks
      contents: { 
        parts: [
          { text: "Analyze for violations. Detect AMBULANCES. If found, identify plate 'EMERGENCY'. Return valid JSON." }, 
          { inlineData: { mimeType: 'image/jpeg', data } }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            violationDetected: { type: Type.BOOLEAN },
            violationType: { type: Type.STRING, enum: Object.values(ViolationType) },
            confidence: { type: Type.NUMBER },
            plateText: { type: Type.STRING },
            detectionArea: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, width: { type: Type.NUMBER }, height: { type: Type.NUMBER } } }
          }
        }
      },
    });
    return JSON.parse(response.text || '{"violationDetected": false}');
  } catch (err) {
    return handleApiError(err);
  }
};

export const analyzeContentWithGemini = async (prompt: string, imageBase64?: string): Promise<string> => {
  try {
    const ai = getAI();
    const contents = imageBase64 ? { parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } }] } : prompt;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents });
    return response.text || "Unable to generate summary.";
  } catch (err) {
    return handleApiError(err);
  }
};

export const findNearestHospital = async (location: LatLng): Promise<Hospital | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Standardized flash model for text tasks with tools
      contents: `Find the absolute nearest hospital to Lat: ${location.latitude}, Lon: ${location.longitude}. If multiple, pick the one with fastest access. Return name, distance, ETA.`,
      config: { 
        tools: [{ googleMaps: {} }], 
        toolConfig: { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } } 
      },
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks[0]?.maps) {
      return { name: chunks[0].maps.title || "City General Hospital", distance: "1.1 km", eta: "3 mins", address: "Emergency Ward", uri: chunks[0].maps.uri };
    }
    return null;
  } catch (err) {
    return handleApiError(err);
  }
};

export const confirmEmergencyCase = async (id: string) => {
  const c = SESSION_CASES.find(x => x.id === id);
  if (c) {
    c.status = CaseStatus.EMERGENCY_CONFIRMED;
    localStorage.setItem('active_emergency_broadcast', JSON.stringify({
      caseId: c.id,
      hospital: c.hospitalRoute?.name,
      timestamp: Date.now()
    }));
  }
  return c;
};

export const ingestCase = async (c: Case) => { SESSION_CASES.unshift(c); return c; };
export const searchUsers = async (term: string) => SESSION_USERS.filter(u => u.name.toLowerCase().includes(term.toLowerCase()));
export const ingestManualReport = async (r: ManualReport) => {
  const c: Case = {
    id: `m-${Date.now()}`, createdAt: r.timestamp, status: CaseStatus.PENDING_REVIEW, violationTypes: r.violationType, confidence: 1, plateText: 'N/A', plateConfidence: 0,
    location: r.location ? { ...r.location, geoHash: 'm', placeName: 'Chennai Field Unit' } : { latitude: 13.0827, longitude: 80.2707, geoHash: 'm', placeName: 'Chennai Manual' },
    deviceId: 'M-PATROL-1', recorderId: r.reporterId, mediaUrls: [r.imageBase64], rulesMatched: [], duplicateOf: null
  };
  SESSION_CASES.unshift(c);
  return c;
};

export const fetchAuditLogsForCase = async (caseId: string) => [];
export const fetchUserById = async (id: string): Promise<User | undefined> => SESSION_USERS.find(u => u.id === id);
export const fetchAllPotentialAssignees = async (): Promise<User[]> => SESSION_USERS;
export const assignCase = async (id: string, userId: string) => {
  const c = SESSION_CASES.find(x => x.id === id);
  if (c) { c.status = CaseStatus.ASSIGNED; c.assigneeId = userId; }
  return { success: true, case: c, message: "Dispatched." };
};

export const fetchOfficerDuties = async (): Promise<OfficerDuty[]> => {
  const names = [
    'Rajesh Kumar', 'Suresh Raina', 'Amit Shah', 'Priya Sharma', 'Anjali Gupta',
    'Vikram Singh', 'Sanjay Dutt', 'Deepak Chahar', 'Rohit Sharma', 'Virat Kohli',
    'MS Dhoni', 'Hardik Pandya', 'Jasprit Bumrah', 'KL Rahul', 'Shikhar Dhawan',
    'Rishabh Pant', 'Ravindra Jadeja', 'Ravichandran Ashwin', 'Mohammed Shami', 'Ishant Sharma',
    'Ajinkya Rahane', 'Cheteshwar Pujara', 'Hanuma Vihari', 'Mayank Agarwal', 'Prithvi Shaw',
    'Shubman Gill', 'Washington Sundar', 'Shardul Thakur', 'T Natarajan', 'Mohammed Siraj'
  ];
  
  const units = [
    'Anna Salai', 'T. Nagar', 'Adyar', 'Mylapore', 'Velachery',
    'Guindy', 'Tambaram', 'Chromepet', 'Pallavaram', 'Saidapet',
    'Nungambakkam', 'Egmore', 'Kilpauk', 'Anna Nagar', 'Ambattur',
    'Avadi', 'Poonamallee', 'Porur', 'Maduravoyal', 'Koyambedu'
  ];

  const shifts = ['06:00-14:00', '14:00-22:00', '22:00-06:00'];
  const statuses = [DutyStatus.ON_DUTY, DutyStatus.NEXT_DUTY, DutyStatus.PAST_DUTY];

  const mockOfficers: OfficerDuty[] = [];
  for (let i = 1; i <= 250; i++) {
    const name = names[i % names.length] + ' ' + (Math.floor(i / names.length) + 1);
    const unit = units[i % units.length];
    const shift = shifts[i % shifts.length];
    const status = statuses[i % statuses.length];
    
    mockOfficers.push({
      id: `off-${i}`,
      userId: `u-off-${i}`,
      name: name,
      badgeId: `TP-${1000 + i}`,
      status: status,
      shift: shift,
      assignedUnit: unit,
      location: status === DutyStatus.ON_DUTY ? `${unit} Junction ${i % 5 + 1}` : undefined
    });
  }
  
  return mockOfficers;
};

export const fetchUsersByRole = async (role: UserRole): Promise<User[]> => SESSION_USERS.filter(u => u.role === role);
export const acceptAllPendingCases = async () => {
  const pending = SESSION_CASES.filter(c => c.status === CaseStatus.PENDING_REVIEW);
  pending.forEach(c => c.status = CaseStatus.ACCEPTED);
  return { success: pending.length, failed: 0 };
};

export const fetchTrafficGrounding = async (location: LatLng): Promise<TrafficInfo> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Standardized flash model for text tasks with tools
      contents: `Provide a detailed traffic report for the area around Lat: ${location.latitude}, Lon: ${location.longitude}. 
      Include congestion levels (Low, Moderate, High, Severe) and specific route impacts with delays and reasons.
      Return the data in a JSON format with the following structure:
      {
        "summary": "string",
        "specificArea": "string",
        "congestionLevel": "Low" | "Moderate" | "High" | "Severe",
        "routeImpacts": [
          { "route": "string", "delay": "string", "reason": "string" }
        ]
      }
      Do not include any other text or markdown formatting in your response.`,
      config: { 
        tools: [{ googleMaps: {} }], 
        toolConfig: { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } } },
      },
    });
    
    // Extract JSON from response text (handling potential markdown formatting)
    const text = response.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((c: any) => { 
        if (c.maps) sources.push({ title: c.maps.title, uri: c.maps.uri }); 
      });
    }

    return {
      summary: data.summary || "No significant traffic reported.",
      specificArea: data.specificArea || "Current Location",
      congestionLevel: data.congestionLevel || "Low",
      routeImpacts: data.routeImpacts || [],
      sources
    };
  } catch (err) {
    return handleApiError(err);
  }
};
