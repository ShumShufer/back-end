import prisma from "../shared/config/db.js";
import { dispatchNotification } from "../shared/helpers/notificationDispatcher.js";
import logger from "../shared/config/logger.js";

/**
 * Background job to check deadlines for tasks and pending enrollment applications.
 */
export async function runApplicationDeadlineJob(): Promise<{
  taskReminders: number;
  pendingApplicationAlerts: number;
}> {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  logger.info("[Job:ApplicationDeadline] Checking approaching task deadlines and pending applications...");

  // 1. Approaching Task Deadlines
  const upcomingTasks = await prisma.task.findMany({
    where: {
      deadline: {
        gte: now,
        lte: next24Hours,
      },
    },
    include: {
      classroom: {
        include: {
          students: {
            where: { status: "ACCEPTED" },
            select: { studentId: true },
          },
        },
      },
      submissions: {
        select: { studentId: true },
      },
    },
  });

  let taskReminders = 0;

  for (const task of upcomingTasks) {
    const submittedStudentIds = new Set(task.submissions.map((s) => s.studentId));
    const pendingStudentIds = task.classroom.students
      .map((s) => s.studentId)
      .filter((id) => !submittedStudentIds.has(id));

    if (pendingStudentIds.length > 0) {
      await dispatchNotification({
        topic: "TASK",
        title: `Deadline Alert: ${task.title}`,
        body: `The deadline for task "${task.title}" is approaching on ${new Date(
          task.deadline,
        ).toLocaleDateString()}. Please submit your work on time.`,
        recipientUserIds: pendingStudentIds,
        relatedEntityId: task.id,
      });

      taskReminders += pendingStudentIds.length;
    }
  }

  // 2. Pending Application Reminders (pending for > 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const overdueApplications = await prisma.enrollment.findMany({
    where: {
      status: "PENDING",
      submittedAt: { lte: sevenDaysAgo },
    },
    select: {
      id: true,
      schoolId: true,
      studentId: true,
    },
  });

  let pendingApplicationAlerts = 0;

  // Group by schoolId and alert school admins
  const schoolMap = new Map<string, string[]>();
  for (const app of overdueApplications) {
    if (!schoolMap.has(app.schoolId)) {
      schoolMap.set(app.schoolId, []);
    }
    schoolMap.get(app.schoolId)!.push(app.id);
  }

  for (const [schoolId, appIds] of schoolMap.entries()) {
    const schoolAdmins = await prisma.user.findMany({
      where: { schoolId, role: { in: ["ADMIN", "EDUCATION_HEAD"] } },
      select: { id: true },
    });

    if (schoolAdmins.length > 0) {
      await dispatchNotification({
        topic: "APPLICATION",
        title: `Pending Applications Review Needed`,
        body: `Your school has ${appIds.length} pending student application(s) awaiting review for more than 7 days.`,
        recipientUserIds: schoolAdmins.map((a) => a.id),
      });

      pendingApplicationAlerts += schoolAdmins.length;
    }
  }

  logger.info(
    `[Job:ApplicationDeadline] Finished. Task reminders: ${taskReminders}, Application alerts: ${pendingApplicationAlerts}`,
  );

  return { taskReminders, pendingApplicationAlerts };
}
