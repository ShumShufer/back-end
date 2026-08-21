import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateNotificationInput,
  QueryNotificationsInput,
} from "./notifications.schema.js";

/**
 * Get notifications for current user with unread filter.
 */
export async function getUserNotifications(query: QueryNotificationsInput, actor: AuthUser) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    userId: actor.id,
  };

  if (query.unreadOnly === "true") {
    where.read = false;
  }

  if (query.topic) {
    where.notification = { topic: query.topic };
  }

  const [recipients, total] = await Promise.all([
    prisma.notificationRecipient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { notification: { createdAt: "desc" } },
      include: {
        notification: true,
      },
    }),
    prisma.notificationRecipient.count({ where }),
  ]);

  return {
    notifications: recipients.map((r) => ({
      recipientId: r.id,
      read: r.read,
      notification: r.notification,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Mark notification as read.
 */
export async function markAsRead(recipientId: string, actor: AuthUser) {
  const recipient = await prisma.notificationRecipient.findUnique({
    where: { id: recipientId },
  });

  if (!recipient) throw AppError.notFound("Notification recipient not found");
  if (recipient.userId !== actor.id) throw AppError.forbidden("Cannot mark other user's notification");

  return prisma.notificationRecipient.update({
    where: { id: recipientId },
    data: { read: true },
  });
}

/**
 * Send manual notification (Admin / System).
 */
export async function createManualNotification(input: CreateNotificationInput, actor: AuthUser) {
  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot broadcast notifications");
  }

  return prisma.notification.create({
    data: {
      topic: input.topic,
      title: input.title,
      body: input.body,
      relatedEntityId: input.relatedEntityId ?? null,
      recipients: {
        create: input.recipientUserIds.map((userId) => ({
          userId,
          read: false,
        })),
      },
    },
    include: { recipients: true },
  });
}
