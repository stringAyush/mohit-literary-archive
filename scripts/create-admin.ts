/**
 * Creates the first administrator account (or resets a password with --reset).
 *
 *   npm run admin:create
 *   npm run admin:create -- --reset
 *
 * Values come from ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD if set, otherwise you are asked.
 * Passwords must be at least 12 characters. Nothing is ever printed back.
 */
import "./load-env";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { z } from "zod";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/auth/password";
import { db } from "../src/lib/db";

async function ask(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  if (hidden) {
    // Hide typed characters for the password.
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.includes(question)) write.call(rl, s);
      else write.call(rl, "*".repeat(s.length));
    };
  }
  const answer = await rl.question(question);
  rl.close();
  if (hidden) stdout.write("\n");
  return answer.trim();
}

async function main() {
  const reset = process.argv.includes("--reset");
  const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: "))).toLowerCase();
  const name = process.env.ADMIN_NAME || (reset ? "" : await ask("Display name: "));
  const password = process.env.ADMIN_PASSWORD || (await ask(`Password (min ${MIN_PASSWORD_LENGTH} characters): `, true));

  if (!z.string().email().safeParse(email).success) throw new Error("That is not a valid email address.");
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);

  const existing = await db.adminUser.findUnique({ where: { email } });
  const passwordHash = await hashPassword(password);

  if (existing) {
    if (!reset) throw new Error("An administrator with that email already exists. Use --reset to change the password.");
    await db.$transaction([
      db.adminUser.update({ where: { email }, data: { passwordHash, disabledAt: null, ...(name ? { name } : {}) } }),
      db.adminSession.deleteMany({ where: { userId: existing.id } }), // sign out everywhere
    ]);
    console.log(`✓ Password reset for ${email}. All existing sessions were signed out.`);
  } else {
    if (!name) throw new Error("A display name is required.");
    await db.adminUser.create({ data: { email, name, passwordHash, role: "ADMIN" } });
    console.log(`✓ Administrator created: ${email}`);
  }
}

main()
  .catch((error) => {
    console.error(`✗ ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
