// Mock Fayda Verification Client
// This is a stub implementation that returns mock data instead of calling the real Fayda API

export interface FaydaVerificationResponse {
  success: boolean;
  verified: boolean;
  phoneNumber?: string | undefined;
  idNumber?: string | undefined;
  fullName?: string | undefined;
  error?: string | undefined;
}

// Mock database of verified users for development
const mockVerifiedUsers = new Map<string, { fullName: string; idNumber: string; phoneNumber: string }>([
  ["0911223344", { fullName: "John Doe", idNumber: "FAY-123456", phoneNumber: "0911223344" }],
  ["0922334455", { fullName: "Jane Smith", idNumber: "FAY-234567", phoneNumber: "0922334455" }],
  ["0933445566", { fullName: "Ahmed Hassan", idNumber: "FAY-345678", phoneNumber: "0933445566" }],
  ["FAY-123456", { fullName: "John Doe", idNumber: "FAY-123456", phoneNumber: "0911223344" }],
  ["FAY-234567", { fullName: "Jane Smith", idNumber: "FAY-234567", phoneNumber: "0922334455" }],
  ["FAY-345678", { fullName: "Ahmed Hassan", idNumber: "FAY-345678", phoneNumber: "0933445566" }],
]);

/**
 * Mock Fayda verification client
 * In production, this would call the real Fayda API
 * For development, it supports registered test credentials or any validly formatted Fayda ID
 */
export async function verifyWithFayda(
  identifier: string,
): Promise<FaydaVerificationResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  const trimmed = identifier.trim();

  // Check if identifier exists in mock database
  const userRecord = mockVerifiedUsers.get(trimmed);

  if (userRecord) {
    return {
      success: true,
      verified: true,
      phoneNumber: userRecord.phoneNumber,
      idNumber: userRecord.idNumber,
      fullName: userRecord.fullName,
    };
  }

  // Development fallback: If input looks like a valid Fayda ID (e.g., FAY-XXXX or >= 6 chars), accept it
  if (trimmed.length >= 4) {
    const isPhone = /^(\+251|0)[1-9]\d{8}$/.test(trimmed);
    const mockId = isPhone ? `FAY-${trimmed.slice(-6)}` : trimmed.toUpperCase();
    return {
      success: true,
      verified: true,
      phoneNumber: isPhone ? trimmed : undefined,
      idNumber: mockId,
      fullName: "Verified Citizen",
    };
  }

  // Return failure for invalid inputs
  return {
    success: false,
    verified: false,
    error: "Invalid Fayda identification number or phone number",
  };
}

/**
 * Add a mock verified user for testing
 * Used in development and test scenarios
 */
export function addMockVerifiedUser(
  phoneNumber: string,
  fullName: string,
  idNumber: string,
): void {
  mockVerifiedUsers.set(phoneNumber, { fullName, idNumber, phoneNumber });
  mockVerifiedUsers.set(idNumber, { fullName, idNumber, phoneNumber });
}

/**
 * Clear all mock verified users
 * Used for test cleanup
 */
export function clearMockUsers(): void {
  mockVerifiedUsers.clear();
}

