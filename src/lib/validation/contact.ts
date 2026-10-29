import { z } from "zod";

// Shared by the browser (instant feedback) and the server (the real check).
export const contactInputSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100, "Please keep your name under 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address")
    .max(200, "That email address is too long")
    .email("Please enter a valid email address"),
  subject: z
    .string()
    .trim()
    .min(1, "Please add a subject")
    .max(150, "Please keep the subject under 150 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a sentence (10 characters)")
    .max(5000, "Please keep your message under 5,000 characters"),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

export function contactFormToObject(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
  };
}
