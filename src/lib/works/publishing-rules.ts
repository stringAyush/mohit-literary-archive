import type { PermissionStatus, ReviewStatus, WorkStatus } from "@prisma/client";
import { isValidSlug } from "./slug";

// The rules a work must satisfy before it can be published or scheduled.
// Kept as a plain function so it is easy to test and to show in the admin.

export type PublishableWork = {
  slug: string;
  body: string;
  status: WorkStatus;
  reviewStatus: ReviewStatus;
  permissionStatus: PermissionStatus;
  permissionNote: string | null;
  rightsConfirmedAt: Date | null;
  isDemo: boolean;
  sourceReference: { verifiedAt: Date | null } | null;
};

export type Requirement = { key: string; label: string; met: boolean };

export const PUBLISHABLE_PERMISSIONS: PermissionStatus[] = ["GRANTED", "AUTHOR_SUBMITTED"];

export function publishingRequirements(work: PublishableWork): Requirement[] {
  const requirements: Requirement[] = [
    { key: "text", label: "The work has text", met: work.body.trim().length > 0 },
    { key: "slug", label: "The web address (slug) is valid", met: isValidSlug(work.slug) },
    {
      key: "permission",
      label: "Permission is recorded as granted or submitted by the writer",
      met: PUBLISHABLE_PERMISSIONS.includes(work.permissionStatus),
    },
    {
      key: "evidence",
      label: "There is a note describing how permission was given",
      met: Boolean(work.permissionNote && work.permissionNote.trim().length >= 10),
    },
    {
      key: "rights",
      label: "An administrator has confirmed authorship and rights",
      met: work.rightsConfirmedAt !== null,
    },
    { key: "review", label: "The review status is Approved", met: work.reviewStatus === "APPROVED" },
    { key: "not-archived", label: "The work is not archived", met: work.status !== "ARCHIVED" },
  ];

  if (work.sourceReference) {
    requirements.push({
      key: "source",
      label: "The source reference has been verified",
      met: work.sourceReference.verifiedAt !== null,
    });
  }

  return requirements;
}

export function unmetRequirements(work: PublishableWork): Requirement[] {
  return publishingRequirements(work).filter((r) => !r.met);
}

export function canPublish(work: PublishableWork): boolean {
  return unmetRequirements(work).length === 0;
}
