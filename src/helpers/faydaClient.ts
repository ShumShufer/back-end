// Mock Fayda Verification Client
// This is a stub implementation that returns mock data instead of calling the real Fayda API

export interface FaydaVerificationResponse {
  success: boolean;
  verified: boolean;
  phoneNumber?: string;
  idNumber?: string;
  fullName?: string;
  error?: string;
}

// Mock database of verified users for development
const mockVerifiedUsers = new Map<string, object>([
  ["0911223344", { fullName: "John Doe", idNumber: "ID123456" }],
  ["0922334455", { fullName: "Jane Smith", idNumber: "ID234567" }],
  ["0933445566", { fullName: "Ahmed Hassan", idNumber: "ID345678" }],
]);

/**
 * Mock Fayda verification client
 * In production, this would call the real Fayda API
 * For now, it returns mock data based on predefined test numbers
 */
export async function verifyWithFayda(
  phoneNumber: string,
): Promise<FaydaVerificationResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Check if phone number exists in mock database
  const userRecord = mockVerifiedUsers.get(phoneNumber);

  if (userRecord) {
    return {
      success: true,
      verified: true,
      phoneNumber,
      ...userRecord,
    };
  }

  // Return failure for unknown numbers
  return {
    success: false,
    verified: false,
    phoneNumber,
    error: "Phone number not verified with Fayda",
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
  mockVerifiedUsers.set(phoneNumber, { fullName, idNumber });
}

/**
 * Clear all mock verified users
 * Used for test cleanup
 */
export function clearMockUsers(): void {
  mockVerifiedUsers.clear();
}
