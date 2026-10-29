import type { PublicationEventType } from "@prisma/client";

export const EVENT_LABELS: Record<PublicationEventType, string> = {
  CREATED: "Created",
  IMPORTED: "Imported",
  UPDATED: "Edited",
  VERSION_RESTORED: "Version restored",
  REVIEW_CHANGED: "Review changed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SCHEDULED: "Scheduled",
  SCHEDULE_CANCELLED: "Schedule cancelled",
  SCHEDULE_BLOCKED: "Scheduled publication blocked",
  PUBLISHED: "Published",
  UNPUBLISHED: "Unpublished",
  ARCHIVED: "Archived",
  RESTORED: "Restored",
};
