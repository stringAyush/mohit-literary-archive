import { describe, expect, it } from "vitest";
import { checkFormToken, createFormToken } from "@/lib/form-token";
import { contactInputSchema } from "@/lib/validation/contact";

const secret = "a-test-secret-that-is-long-enough-123456";

describe("contact form validation", () => {
  const valid = { name: "Asha", email: "asha@example.com", subject: "Permission", message: "May I quote your poem?" };

  it("accepts a complete message", () => {
    expect(contactInputSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["name", { name: "  " }, /name/],
    ["email", { email: "not-an-email" }, /valid email/],
    ["subject", { subject: "" }, /subject/],
    ["message", { message: "hi" }, /at least/],
    ["message", { message: "x".repeat(5001) }, /5,000/],
  ])("rejects a bad %s with a helpful message", (field, change, pattern) => {
    const result = contactInputSchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    const issue = result.error!.issues.find((i) => i.path[0] === field);
    expect(issue?.message).toMatch(pattern);
  });
});

describe("contact form tokens", () => {
  const now = 1_800_000_000_000;

  it("accepts a token used after a few seconds", () => {
    expect(checkFormToken(createFormToken(secret, now), secret, now + 10_000)).toBe("ok");
  });

  it("rejects instant submissions, old forms and forgeries", () => {
    const token = createFormToken(secret, now);
    expect(checkFormToken(token, secret, now + 500)).toBe("too-fast");
    expect(checkFormToken(token, secret, now + 1000 * 60 * 60 * 25)).toBe("expired");
    expect(checkFormToken(token, "a-different-secret-that-is-also-long-123", now + 10_000)).toBe("invalid");
    expect(checkFormToken(`${now - 60_000}.${token.split(".")[1]}`, secret, now)).toBe("invalid");
    expect(checkFormToken("", secret, now)).toBe("invalid");
  });
});
