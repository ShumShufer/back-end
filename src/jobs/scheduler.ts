import logger from "../shared/config/logger.js";
import { runScheduleReminderJob } from "./scheduleReminderJob.js";
import { runApplicationDeadlineJob } from "./applicationDeadlineJob.js";
import { runPriceRecalculationJob } from "./priceRecalculationJob.js";

interface ActiveTimers {
  initialTimeout?: NodeJS.Timeout;
  scheduleReminderInterval?: NodeJS.Timeout;
  applicationDeadlineInterval?: NodeJS.Timeout;
  priceRecalculationInterval?: NodeJS.Timeout;
}

const activeTimers: ActiveTimers = {};

// Default intervals in milliseconds
const ONE_HOUR = 60 * 60 * 1000;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

/**
 * Safely execute an asynchronous job with error handling.
 */
async function executeSafeJob(name: string, jobFn: () => Promise<unknown>): Promise<void> {
  try {
    logger.info(`[Scheduler] Starting background job: ${name}`);
    await jobFn();
    logger.info(`[Scheduler] Finished background job: ${name}`);
  } catch (err) {
    logger.error(`[Scheduler] Error running background job ${name}:`, err);
  }
}

/**
 * Starts all background recurring tasks.
 */
export function startBackgroundJobs(): void {
  const enabled = process.env.ENABLE_BACKGROUND_JOBS !== "false";
  if (!enabled) {
    logger.info("[Scheduler] Background jobs disabled via ENABLE_BACKGROUND_JOBS=false");
    return;
  }

  logger.info("[Scheduler] Initializing automated background jobs...");

  // Run initial tick 5 seconds after server start
  activeTimers.initialTimeout = setTimeout(() => {
    void executeSafeJob("ScheduleReminderJob", runScheduleReminderJob);
    void executeSafeJob("ApplicationDeadlineJob", runApplicationDeadlineJob);
    void executeSafeJob("PriceRecalculationJob", runPriceRecalculationJob);
  }, 5000);

  // Set recurring intervals
  activeTimers.scheduleReminderInterval = setInterval(() => {
    void executeSafeJob("ScheduleReminderJob", runScheduleReminderJob);
  }, ONE_HOUR);

  activeTimers.applicationDeadlineInterval = setInterval(() => {
    void executeSafeJob("ApplicationDeadlineJob", runApplicationDeadlineJob);
  }, SIX_HOURS);

  activeTimers.priceRecalculationInterval = setInterval(() => {
    void executeSafeJob("PriceRecalculationJob", runPriceRecalculationJob);
  }, TWELVE_HOURS);

  logger.info("[Scheduler] Background jobs scheduled successfully.");
}

/**
 * Cleanly cancels all background job timers on server shutdown.
 */
export function stopBackgroundJobs(): void {
  logger.info("[Scheduler] Stopping all background jobs...");

  if (activeTimers.initialTimeout) clearTimeout(activeTimers.initialTimeout);
  if (activeTimers.scheduleReminderInterval) clearInterval(activeTimers.scheduleReminderInterval);
  if (activeTimers.applicationDeadlineInterval) clearInterval(activeTimers.applicationDeadlineInterval);
  if (activeTimers.priceRecalculationInterval) clearInterval(activeTimers.priceRecalculationInterval);

  logger.info("[Scheduler] All background jobs stopped.");
}
