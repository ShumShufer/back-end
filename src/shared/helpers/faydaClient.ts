// Mock Fayda Verification Client
// Based on official Ethiopian National ID Program (id.gov.et / Fayda Verifier)

export interface FaydaCitizenRecord {
  fullName: string;
  idNumber: string; // FCN or FAY-ID
  phoneNumber: string;
  gender: "Male" | "Female";
  dateOfBirth: string;
  version: string;
  photoUrl?: string;
}

export interface FaydaVerificationResponse {
  success: boolean;
  verified: boolean;
  phoneNumber?: string | undefined;
  idNumber?: string | undefined;
  fullName?: string | undefined;
  gender?: "Male" | "Female" | undefined;
  dateOfBirth?: string | undefined;
  version?: string | undefined;
  error?: string | undefined;
}

// Canonical mock Ethiopian Fayda database matching official test cards & id.gov.et
const mockCitizens: FaydaCitizenRecord[] = [
  {
    fullName: "Yonnas Kelem",
    idNumber: "FAY-123456",
    phoneNumber: "0911223344",
    gender: "Male",
    dateOfBirth: "15 MAR 1998",
    version: "1.0",
  },
  {
    fullName: "Abebe Kebede Demisse",
    idNumber: "7483 9201 8472 9102",
    phoneNumber: "0911223344",
    gender: "Male",
    dateOfBirth: "12 MAY 1995",
    version: "1.0",
  },
  {
    fullName: "Marta Hailu Tadesse",
    idNumber: "FAY-234567",
    phoneNumber: "0922334455",
    gender: "Female",
    dateOfBirth: "24 AUG 1997",
    version: "1.0",
  },
  {
    fullName: "Ahmed Hassan Omer",
    idNumber: "FAY-345678",
    phoneNumber: "0933445566",
    gender: "Male",
    dateOfBirth: "03 JAN 1992",
    version: "1.0",
  },
  {
    fullName: "Selamawit Bekele Assefa",
    idNumber: "9283 4719 2837 4651",
    phoneNumber: "0955667788",
    gender: "Female",
    dateOfBirth: "18 NOV 1999",
    version: "1.0",
  },
];

// Normalize identifier for flexible lookup (strip spaces, hyphens, lowercase)
function normalizeKey(str: string): string {
  return str.replace(/[\s-]/g, "").toUpperCase();
}

const mockVerifiedUsers = new Map<string, FaydaCitizenRecord>();

// Populate lookup map with all formats
for (const citizen of mockCitizens) {
  mockVerifiedUsers.set(normalizeKey(citizen.phoneNumber), citizen);
  mockVerifiedUsers.set(normalizeKey(citizen.idNumber), citizen);
  mockVerifiedUsers.set(citizen.idNumber, citizen);
  mockVerifiedUsers.set(citizen.phoneNumber, citizen);
}

/**
 * Mock Fayda verification client matching id.gov.et/scanId
 */
export async function verifyWithFayda(
  identifier: string,
): Promise<FaydaVerificationResponse> {
  // Simulate realistic network verification latency
  await new Promise((resolve) => setTimeout(resolve, 200));

  const trimmed = identifier.trim();

  // Try parsing JSON if identifier is a QR JSON payload
  let targetId = trimmed;
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      targetId = parsed.fcn || parsed.idNumber || parsed.faydaId || parsed.phone || trimmed;
    } catch {
      // fallback to raw
    }
  }

  // Lookup in canonical mock store
  const userRecord =
    mockVerifiedUsers.get(targetId) ||
    mockVerifiedUsers.get(normalizeKey(targetId));

  if (userRecord) {
    return {
      success: true,
      verified: true,
      phoneNumber: userRecord.phoneNumber,
      idNumber: userRecord.idNumber,
      fullName: userRecord.fullName,
      gender: userRecord.gender,
      dateOfBirth: userRecord.dateOfBirth,
      version: userRecord.version,
    };
  }

  // Fallback for valid scanned inputs (any valid FCN or Fayda ID >= 4 chars)
  if (targetId.length >= 4) {
    const isPhone = /^(\+251|0)[1-9]\d{8}$/.test(targetId.replace(/[\s-]/g, ""));
    const mockId = isPhone
      ? `FAY-${targetId.slice(-6)}`
      : targetId.toUpperCase();

    return {
      success: true,
      verified: true,
      phoneNumber: isPhone ? targetId : "0911223344",
      idNumber: mockId,
      fullName: "Verified Citizen",
      gender: "Male",
      dateOfBirth: "15 MAR 1998",
      version: "1.0",
    };
  }

  return {
    success: false,
    verified: false,
    error: "Invalid Fayda identification number or QR code",
  };
}

export function addMockVerifiedUser(citizen: FaydaCitizenRecord): void {
  mockVerifiedUsers.set(normalizeKey(citizen.phoneNumber), citizen);
  mockVerifiedUsers.set(normalizeKey(citizen.idNumber), citizen);
  mockVerifiedUsers.set(citizen.idNumber, citizen);
  mockVerifiedUsers.set(citizen.phoneNumber, citizen);
}

export function clearMockUsers(): void {
  mockVerifiedUsers.clear();
}

