import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "e2e-admin@example.test", password: "e2e-password-long-enough" };
const TITLE = "Evening Ledger";
const SLUG = "evening-ledger";
const TEXT = "The lamps come on\none by one,\n\nlike names remembered late.";

async function expectNotPublic(page: Page) {
  const response = await page.request.get(`/works/${SLUG}`);
  expect(response.status()).toBe(404);
  const archive = await page.request.get("/works");
  expect(await archive.text()).not.toContain(TITLE);
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain(`/works/${SLUG}`);
}

test("draft → review → publish → edit → unpublish", async ({ page, browser }) => {
  // 1. Log in as an administrator.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email address").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  // 2. Create a draft.
  await page.goto("/admin/works/new");
  await page.getByLabel(/^Title \(optional/).fill(TITLE);
  await page.getByLabel("Text", { exact: true }).fill(TEXT);
  await page.getByLabel("Form", { exact: true }).selectOption("POEM");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/admin\/works\/[^/]+\?done=created$/);
  const editUrl = page.url().replace(/\?.*$/, "");

  // 3. Preview it.
  await page.getByRole("link", { name: "Preview" }).click();
  await expect(page.getByText("not visible to readers")).toBeVisible();
  await expect(page.getByText("like names remembered late.")).toBeVisible();

  // 4. It is not public: not in a logged-out browser, the archive or the sitemap.
  const visitor = await browser.newPage();
  await visitor.goto(`/works/${SLUG}`);
  await expect(visitor.getByRole("heading", { name: "This page has not been written." })).toBeVisible();
  await expectNotPublic(visitor);

  // Publishing is refused before review.
  await page.goto(editUrl);
  await expect(page.getByRole("button", { name: "Publish now" })).toBeDisabled();

  // 5. Complete the review requirements.
  await page.getByLabel("Submitted by the writer").check();
  await page.getByLabel("Evidence of permission").fill("Sent by the writer by email for this archive (E2E test).");
  await page.getByLabel(/I confirm this is the writer/).check();
  await page.getByRole("button", { name: "Approve for publication" }).click();
  await expect(page.getByText("Approved. Authorship, permission")).toBeVisible();

  // 6. Publish.
  await expect(page.getByRole("button", { name: "Publish now" })).toBeEnabled();
  await page.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByText("Published. The work is now live")).toBeVisible();

  // 7. Its permanent address, the archive and the sitemap now include it.
  await visitor.goto(`/works/${SLUG}`);
  await expect(visitor.getByRole("heading", { name: TITLE })).toBeVisible();
  await expect(visitor.getByText("like names remembered late.")).toBeVisible();
  await visitor.goto("/works");
  await expect(visitor.getByText(TITLE).first()).toBeVisible();
  expect(await (await visitor.request.get("/sitemap.xml")).text()).toContain(`/works/${SLUG}`);

  // 8. Edit it and check the version history.
  await page.goto(editUrl);
  await page.getByLabel("Text", { exact: true }).fill(`${TEXT}\nAnd the street forgives the day.`);
  await page.getByLabel(/Reason for this change/).fill("Added the closing line");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/^Saved\. A new version/)).toBeVisible();
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByRole("link", { name: /Version 2 \(current\)/ })).toBeVisible();
  await expect(page.getByText("Added the closing line").first()).toBeVisible();
  await visitor.goto(`/works/${SLUG}`);
  await expect(visitor.getByText("And the street forgives the day.")).toBeVisible();

  // 9. Unpublish: it disappears from the public site and the sitemap.
  await page.goto(editUrl);
  await page.getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByText(/^Unpublished\./)).toBeVisible();
  await expectNotPublic(visitor);
});

test("admin pages are protected on the server", async ({ browser }) => {
  const page = await browser.newPage();
  for (const path of ["/admin", "/admin/works", "/admin/review", "/admin/import"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  // A forged cookie gets past the quick middleware check but not the server check.
  await page.context().addCookies([{ name: "archive_session", value: "forged", url: "http://localhost:3100" }]);
  await page.goto("/admin/works");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("scheduler endpoint requires the secret", async ({ request }) => {
  expect((await request.post("/api/cron/publish-scheduled")).status()).toBe(401);
  const ok = await request.post("/api/cron/publish-scheduled", { headers: { Authorization: "Bearer e2e-cron-secret-32-characters-long" } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ ok: true, published: [] });
});
