import "server-only";
import { getEnv } from "@/lib/env";

// Demonstration content (sample text written for development) is hidden unless
// SHOW_DEMO_CONTENT is "true". Never turn it on for the real site.
export function showDemoContent(): boolean {
  return getEnv().SHOW_DEMO_CONTENT === "true";
}
