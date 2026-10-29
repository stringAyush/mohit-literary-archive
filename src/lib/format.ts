// Date formatting helpers. Dates are shown in Indian Standard Time by default,
// which is where the writer lives; change SITE_TIME_ZONE if that ever differs.
export const SITE_TIME_ZONE = "Asia/Kolkata";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SITE_TIME_ZONE,
  }).format(value);
}

/** For calendar dates stored without a time (composedOn, originalPublishedAt). */
export function formatCalendarDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SITE_TIME_ZONE,
    timeZoneName: "short",
  }).format(value);
}

/** yyyy-mm-dd for <input type="date">. */
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function yearOf(date: Date | null | undefined): number | null {
  return date ? date.getUTCFullYear() : null;
}
