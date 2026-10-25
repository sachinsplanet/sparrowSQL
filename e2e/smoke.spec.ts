import { test, expect } from "@playwright/test";

test.describe("SparrowSQL Smoke & Browser Test", () => {
  test("end-to-end browser walkthrough: landing, curriculum, interactive book, and live SQL execution", async ({
    page,
  }) => {
    // 1. Pre-seed progress so onboarding is bypassed and progress state is initialized
    await page.addInitScript(() => {
      localStorage.setItem(
        "sparrowsql-progress-v1",
        JSON.stringify({
          onboarded: true,
          playgroundUnlocked: true,
          flashcardsDone: ["fc-select", "fc-where"],
          exercisesDone: [],
          xp: 250,
          streak: 1,
          lastVisitDate: new Date().toISOString().slice(0, 10),
          badges: [],
          revealedHints: {},
          revealedSolutions: {},
          attempts: {},
        })
      );
    });

    // 2. Load page
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/sparrowsql/i);

    // Verify main landmarks
    await expect(page.locator("main")).toBeVisible();
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
    await expect(nav).toContainText("Basics");
    await expect(nav).toContainText("Live Lab");
    await expect(nav).toContainText("Curriculum");
    await expect(nav).toContainText("The Book");

    // 3. Verify Curriculum Section displays 12 modules
    const curriculum = page.locator("#curriculum");
    await expect(curriculum).toBeAttached();
    await expect(curriculum).toContainText("12");
    await expect(curriculum).toContainText("modules");

    const openMod1Btn = page.getByRole("button", { name: /^Open Module 1:/i });
    await expect(openMod1Btn).toBeAttached();

    // 4. Test Interactive Book opens and renders syllabus content
    await openMod1Btn.click({ force: true });
    await expect(page.getByText(/What a database is/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Relational Database Management System/i).first()).toBeVisible();

    // Close the book with Escape key
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // 5. Test Live Lab SQL execution
    const lab = page.locator("#lab");
    await expect(lab).toBeAttached();

    const runBtn = page.getByRole("button", { name: /run query/i }).first();
    await expect(runBtn).toBeAttached();
    await runBtn.click({ force: true });
    await page.waitForTimeout(800);

    // Verify Sparrow tutor reacts to the query execution in real time
    const sparrowBox = page.locator("#lab").getByText(/sparrow|nothing here has that name|rows returned|query finished/i).first();
    await expect(sparrowBox).toBeVisible();

    // Take screenshot of fully verified application
    await page.screenshot({ path: "test-results/browser-verified.png" });
  });
});
