"use client";

import { useActionState } from "react";
import { changeAdminPasswordAction, revokeOtherSessionsAction, updateAdminEmailAction } from "@/app/admin/actions/security";
import type { ActionState } from "@/lib/admin/action-state";
import { FieldError, FormMessage } from "./FormMessage";
import { Panel } from "./ui";

interface SecuritySettingsProps {
  currentEmail: string;
  adminName: string;
  activeSessionCount: number;
}

export function SecuritySettings({ currentEmail, adminName, activeSessionCount }: SecuritySettingsProps) {
  const [emailState, emailFormAction, isEmailPending] = useActionState<ActionState, FormData>(
    updateAdminEmailAction,
    { status: "idle" }
  );

  const [passwordState, passwordFormAction, isPasswordPending] = useActionState<ActionState, FormData>(
    changeAdminPasswordAction,
    { status: "idle" }
  );

  const [sessionState, sessionFormAction, isSessionPending] = useActionState<ActionState, FormData>(
    revokeOtherSessionsAction,
    { status: "idle" }
  );

  return (
    <div className="space-y-10">
      {/* ── 1. Security Level Status ── */}
      <section aria-labelledby="security-posture" className="border hairline bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3d6b4a]" />
              <h2 id="security-posture" className="font-sans text-base font-semibold">
                Security Level: Strict / Production Hardened
              </h2>
            </div>
            <p className="mt-1 font-sans text-xs text-muted">
              Active protection protocols guarding the Mohit Yenugwar Literary Archive administrator panel.
            </p>
          </div>
          <span className="inline-flex items-center rounded-xs border border-[#3d6b4a]/40 bg-[#3d6b4a]/10 px-2.5 py-1 font-sans text-xs font-medium text-[#2f5539]">
            Grade A+ Hardened
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border hairline bg-paper/60 p-4">
            <p className="eyebrow">Password Hashing</p>
            <p className="mt-1 font-sans text-sm font-semibold">Scrypt (Memory-Hard)</p>
            <p className="mt-1 font-sans text-xs text-muted">N=16384, r=8, p=1, 64-byte keylen, timing-safe equality</p>
          </div>
          <div className="border hairline bg-paper/60 p-4">
            <p className="eyebrow">Rate Limiting</p>
            <p className="mt-1 font-sans text-sm font-semibold">Sliding Windows</p>
            <p className="mt-1 font-sans text-xs text-muted">20 attempts/15m per IP · 5 attempts/15m per account</p>
          </div>
          <div className="border hairline bg-paper/60 p-4">
            <p className="eyebrow">Session Isolation</p>
            <p className="mt-1 font-sans text-sm font-semibold">Hashed Token DB</p>
            <p className="mt-1 font-sans text-xs text-muted">HttpOnly, SameSite, SHA-256 hashed storage, 7-day TTL</p>
          </div>
          <div className="border hairline bg-paper/60 p-4">
            <p className="eyebrow">HTTP Headers</p>
            <p className="mt-1 font-sans text-sm font-semibold">CSP & Frame Deny</p>
            <p className="mt-1 font-sans text-xs text-muted">Strict CSP, HSTS, X-Frame-Options DENY, noindex/nofollow</p>
          </div>
        </div>
      </section>

      {/* ── 2. Account Information & Change Forms ── */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Email Update Form */}
        <Panel title="Update Administrator Email">
          <form action={emailFormAction} className="space-y-4">
            <FormMessage state={emailState} />

            <div>
              <label className="field-label">Current Email</label>
              <input
                type="text"
                disabled
                value={currentEmail}
                className="input cursor-not-allowed bg-paper/50 opacity-80"
              />
              <p className="field-hint">Signed in as {adminName}</p>
            </div>

            <div>
              <label htmlFor="newEmail" className="field-label">
                New Email Address
              </label>
              <input
                id="newEmail"
                name="newEmail"
                type="email"
                required
                autoComplete="email"
                placeholder="new-email@example.com"
                className="input"
              />
              <FieldError id="newEmail-error" message={emailState.fieldErrors?.newEmail} />
            </div>

            <div>
              <label htmlFor="emailCurrentPassword" className="field-label">
                Current Password (to confirm identity)
              </label>
              <input
                id="emailCurrentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className="input"
              />
              <FieldError id="emailCurrentPassword-error" message={emailState.fieldErrors?.currentPassword} />
            </div>

            <button type="submit" disabled={isEmailPending} className="btn btn-primary w-full">
              {isEmailPending ? "Updating email…" : "Update Email"}
            </button>
          </form>
        </Panel>

        {/* Password Change Form */}
        <Panel title="Change Password">
          <form action={passwordFormAction} className="space-y-4">
            <FormMessage state={passwordState} />

            <div>
              <label htmlFor="currentPassword" className="field-label">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className="input"
              />
              <FieldError id="currentPassword-error" message={passwordState.fieldErrors?.currentPassword} />
            </div>

            <div>
              <label htmlFor="newPassword" className="field-label">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                placeholder="Minimum 12 characters"
                className="input"
              />
              <p className="field-hint">Minimum 12 characters. Use letters, numbers, and symbols.</p>
              <FieldError id="newPassword-error" message={passwordState.fieldErrors?.newPassword} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="field-label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                className="input"
              />
              <FieldError id="confirmPassword-error" message={passwordState.fieldErrors?.confirmPassword} />
            </div>

            <button type="submit" disabled={isPasswordPending} className="btn btn-primary w-full">
              {isPasswordPending ? "Updating password…" : "Change Password"}
            </button>
          </form>
        </Panel>
      </div>

      {/* ── 3. Session Management ── */}
      <Panel title="Active Admin Sessions">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm">
              There are currently <strong className="tabular-nums">{activeSessionCount}</strong> active session(s)
              logged into this account.
            </p>
            <p className="mt-1 font-sans text-xs text-muted">
              If you suspect an unauthorized login or left a public computer signed in, you can invalidate all sessions
              except your current one.
            </p>
          </div>
          <form action={sessionFormAction}>
            <button
              type="submit"
              disabled={isSessionPending || activeSessionCount <= 1}
              className="btn btn-secondary text-xs"
            >
              {isSessionPending ? "Revoking…" : "Sign out all other sessions"}
            </button>
          </form>
        </div>
        <div className="mt-3">
          <FormMessage state={sessionState} />
        </div>
      </Panel>

      {/* ── 4. Comprehensive Guide on Changing Credentials ── */}
      <section aria-labelledby="credential-guide" className="border hairline bg-paper p-6">
        <h2 id="credential-guide" className="font-sans text-sm font-semibold uppercase tracking-wider text-ink">
          Guide: 3 Ways to Change Password / Email
        </h2>
        <p className="mt-1 font-sans text-xs text-muted">
          You have multiple reliable methods to manage admin credentials depending on your workflow:
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="border hairline bg-surface p-4">
            <span className="font-display text-sm font-bold text-accent">Option 1</span>
            <h3 className="mt-1 font-sans text-sm font-semibold">Web Dashboard (Recommended)</h3>
            <p className="mt-2 font-sans text-xs text-muted">
              The simplest method. Use the two forms above on this page:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 font-sans text-xs text-muted">
              <li>Enter your current password</li>
              <li>Provide your new email or 12+ character password</li>
              <li>Click update; changes apply immediately</li>
            </ol>
          </div>

          <div className="border hairline bg-surface p-4">
            <span className="font-display text-sm font-bold text-accent">Option 2</span>
            <h3 className="mt-1 font-sans text-sm font-semibold">Terminal CLI Script</h3>
            <p className="mt-2 font-sans text-xs text-muted">
              Ideal for emergency recovery if you ever lose your password:
            </p>
            <div className="mt-2 rounded-xs bg-ink/5 p-2 font-mono text-[11px] text-ink">
              npm run admin:reset
            </div>
            <p className="mt-2 font-sans text-xs text-muted">
              This triggers an interactive prompt or direct flags:
            </p>
            <div className="mt-1 rounded-xs bg-ink/5 p-2 font-mono text-[11px] text-ink">
              npm run admin:reset -- --email user@example.com --password YourNewPassword123!
            </div>
          </div>

          <div className="border hairline bg-surface p-4">
            <span className="font-display text-sm font-bold text-accent">Option 3</span>
            <h3 className="mt-1 font-sans text-sm font-semibold">Environment Variables & Seed</h3>
            <p className="mt-2 font-sans text-xs text-muted">
              Configure in your hosting platform (Vercel) or local <code className="text-xs">.env</code>:
            </p>
            <div className="mt-2 rounded-xs bg-ink/5 p-2 font-mono text-[11px] text-ink">
              ADMIN_EMAIL=&quot;...&quot;<br />
              ADMIN_PASSWORD=&quot;...&quot;
            </div>
            <p className="mt-2 font-sans text-xs text-muted">
              Then run <code className="text-xs">npm run admin:create -- --reset</code> to sync into PostgreSQL.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
