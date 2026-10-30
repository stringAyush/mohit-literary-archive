/**
 * Utility to easily reset or update administrator email and password from the terminal.
 *
 * Usage:
 *   # Interactive mode:
 *   npm run admin:reset
 *
 *   # Direct command-line flags:
 *   npm run admin:reset -- --email current@example.com --new-email new@example.com --password NewSecurePassword123!
 */
import "./load-env";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { z } from "zod";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/auth/password";
import { db } from "../src/lib/db";

function getArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

async function ask(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  if (hidden) {
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
  console.log("=== Mohit Yenugwar Literary Archive: Admin Credential Manager ===");

  // Find all current admins in DB
  const admins = await db.adminUser.findMany({ select: { id: true, email: true, name: true } });

  if (admins.length === 0) {
    console.log("No administrator accounts currently found. Please run 'npm run admin:create' first.");
    return;
  }

  let targetAdmin = admins[0];
  const flagEmail = getArg("--email");
  if (flagEmail) {
    const match = admins.find((a) => a.email.toLowerCase() === flagEmail.toLowerCase());
    if (match) targetAdmin = match;
    else {
      throw new Error(`No administrator found with email: ${flagEmail}`);
    }
  } else if (admins.length > 1) {
    console.log("Multiple administrator accounts found:");
    admins.forEach((a, i) => console.log(`  [${i + 1}] ${a.email} (${a.name})`));
    const chosenIndex = parseInt(await ask("Select account number to update [1]: ")) || 1;
    targetAdmin = admins[chosenIndex - 1] ?? admins[0];
  }

  console.log(`Managing account: ${targetAdmin.email} (${targetAdmin.name})`);

  const newEmailInput = getArg("--new-email") || (await ask(`New email (leave blank to keep current [${targetAdmin.email}]): `));
  const newPasswordInput = getArg("--password") || (await ask(`New password (min ${MIN_PASSWORD_LENGTH} chars, leave blank to keep unchanged): `, true));

  const updates: { email?: string; passwordHash?: string } = {};

  if (newEmailInput && newEmailInput !== targetAdmin.email) {
    if (!z.string().email().safeParse(newEmailInput).success) {
      throw new Error(`Invalid email format: ${newEmailInput}`);
    }
    const duplicate = await db.adminUser.findUnique({ where: { email: newEmailInput.toLowerCase() } });
    if (duplicate && duplicate.id !== targetAdmin.id) {
      throw new Error(`Email ${newEmailInput} is already registered to another account.`);
    }
    updates.email = newEmailInput.toLowerCase();
  }

  if (newPasswordInput) {
    if (newPasswordInput.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    updates.passwordHash = await hashPassword(newPasswordInput);
  }

  if (Object.keys(updates).length === 0) {
    console.log("No changes requested. Exiting.");
    return;
  }

  await db.$transaction([
    db.adminUser.update({
      where: { id: targetAdmin.id },
      data: updates,
    }),
    db.adminSession.deleteMany({
      where: { userId: targetAdmin.id },
    }),
  ]);

  console.log("✓ Administrator credentials successfully updated.");
  if (updates.email) console.log(`  New Email: ${updates.email}`);
  if (updates.passwordHash) console.log("  Password: Updated (all existing sessions invalidated for security)");
}

main()
  .catch((err) => {
    console.error(`✗ Error: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
