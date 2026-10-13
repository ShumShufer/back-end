import prisma from "../shared/config/db.js";
import { dispatchNotification } from "../shared/helpers/notificationDispatcher.js";
import logger from "../shared/config/logger.js";

/**
 * Background job to send reminders for schedule events occurring in the next 24 hours.
 */
export async function runScheduleReminderJob(): Promise<{ remindersSent: number }> {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  logger.info("[Job:ScheduleReminder] Checking for upcoming events between now and next 24 hours...");

  const events = await prisma.scheduleEvent.findMany({
    where: {
      startTime: {
        gte: now,
        lte: next24Hours,
      },
    },
  });

  let remindersSent = 0;

  for (const event of events) {
    let recipientIds: string[] = [];

    if (event.scope === "CLASSROOM" && event.classroomId) {
      // Find students enrolled in the classroom
      const enrollments = await prisma.enrollment.findMany({
        where: { classroomId: event.classroomId, status: "ACCEPTED" },
        select: { studentId: true },
      });
      // Find mentors assigned to the classroom
      const mentors = await prisma.classroomMentor.findMany({
        where: { classroomId: event.classroomId },
        select: { mentorId: true },
      });

      recipientIds = [
        ...enrollments.map((e) => e.studentId),
        ...mentors.map((m) => m.mentorId),
      ];
    } else if (event.scope === "SCHOOL" && event.schoolId) {
      const schoolUsers = await prisma.user.findMany({
        where: { schoolId: event.schoolId },
        select: { id: true },
      });
      recipientIds = schoolUsers.map((u) => u.id);
    }

    if (recipientIds.length > 0) {
      const formattedTime = new Date(event.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      await dispatchNotification({
        topic: "SYSTEM",
        title: `Reminder: Upcoming Event "${event.title}"`,
        body: `You have an event scheduled for today at ${formattedTime}${
          event.location ? ` at ${event.location}` : ""
        }.`,
        recipientUserIds: recipientIds,
        relatedEntityId: event.id,
      });

      remindersSent += recipientIds.length;
    }
  }

  logger.info(`[Job:ScheduleReminder] Completed. Total notifications dispatched: ${remindersSent}`);
  return { remindersSent };
}
