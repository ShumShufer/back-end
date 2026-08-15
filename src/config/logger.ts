export function logInfo(message: string): void {
  console.log(`[INFO] ${message}`);
}

export function logError(message: string): void {
  console.error(`[ERROR] ${message}`);
}

export function logWarn(message: string): void {
  console.warn(`[WARN] ${message}`);
}

export const logger = {
  info: logInfo,
  error: logError,
  warn: logWarn,
};
