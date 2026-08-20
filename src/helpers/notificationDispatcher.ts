import prisma from "../config/db.js";
import type { NotificationTopic } from "../../generated/prisma/enums.js";

export interface DispatchNotificationParams {
  topic: NotificationTopic;
  title: string;
  body: string;
  recipientUserIds: string[];
  relatedEntityId?: string;
}

/**
 * Dispatches a notification record and fans out recipient records to target users.
 */
export async function dispatchNotification(params: DispatchNotificationParams) {
  if (!params.recipientUserIds || params.recipientUserIds.length === 0) {
    return null;
  }

  // Deduplicate user IDs
  const uniqueRecipientIds = Array.from(new Set(params.recipientUserIds));

  return prisma.notification.create({
    data: {
      topic: params.topic,
      title: params.title,
      body: params.body,
      relatedEntityId: params.relatedEntityId ?? null,
      recipients: {
        create: uniqueRecipientIds.map((userId) => ({
          userId,
          read: false,
        })),
      },
    },
    include: {
      recipients: true,
    },
  });
}
