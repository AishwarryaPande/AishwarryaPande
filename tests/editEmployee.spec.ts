import { test, expect } from "@playwright/test";

test("should search for A, select first option, and edit Employee ID", async ({
  page,
}) => {
  // Arrange
  const baseURL =
    "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login";
  const adminCredentials = {
    username: "Admin",
    password: "admin123",
  };
  const newEmployeeId = "454564";

  // Navigate to the login page
  await page.goto(baseURL);

  // Login as Admin
  await page
    .getByRole("textbox", { name: "Username" })
    .fill(adminCredentials.username);
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(adminCredentials.password);
  await page.getByRole("button", { name: "Login" }).click();

  // Navigate to PIM Section
  await page.getByRole("link", { name: "PIM" }).waitFor({ state: "visible" });
  await page.getByRole("link", { name: "PIM" }).click();

  // Search for Employee Name starting with "A"
  const employeeSearchInput = page
    .getByRole("textbox", { name: "Type for hints..." })
    .first();
  await employeeSearchInput.waitFor({ state: "visible" });
  await employeeSearchInput.click();
  await employeeSearchInput.fill("A");
  await page.waitForTimeout(3000); // Wait for the action to complete

  // ✅ Pick the First Option from the Dropdown
  const firstOption = page.locator(".oxd-autocomplete-option").first();
  await firstOption.waitFor({ state: "visible" });
  await firstOption.click();

  // Click on Search Button
  await page.getByRole("button", { name: "Search" }).click();

  // ✅ Locate the Edit button within the correct row
  const editButton = page
    .locator("tr")
    .filter({ hasText: "A" })
    .locator('button:has-text("")');

  // ✅ Scroll Mechanism: Scroll Down Until Records are Visible
  let isVisible = false;
  let scrollAttempts = 0;
  const maxScrollAttempts = 20;
  const scrollStep = 300; // Scroll step for each attempt

  while (!isVisible && scrollAttempts < maxScrollAttempts) {
    isVisible = await editButton.isVisible();

    if (!isVisible) {
      // ✅ Scroll Down by a step
      await page.evaluate((step) => window.scrollBy(0, step), scrollStep);
      await page.waitForTimeout(300); // Short wait to allow scroll to complete
      scrollAttempts++;
      console.log(`Scrolling... Attempt ${scrollAttempts}`);
    }
  }

  // ✅ Ensure the Edit button is visible before clicking
  await page.getByRole("button", { name: "" }).click();

  // ✅ Edit the Employee ID
  const employeeIdInput = page
    .locator("div")
    .filter({ hasText: /^Employee IdOther Id$/ })
    .getByRole("textbox")
    .nth(1);
  await employeeIdInput.waitFor({ state: "visible" });
  await employeeIdInput.fill(newEmployeeId);

  // ✅ Save the changes
  const saveButton = page
    .locator("form")
    .filter({ hasText: "Employee Full NameEmployee" })
    .getByRole("button");
  await saveButton.waitFor({ state: "visible" });
  await saveButton.click();

  // ✅ Assert: Verify success message
  const successToast = page.locator("div.oxd-toast-container");
  await expect(successToast).toContainText("Successfully Updated", {
    timeout: 15000,
  });
});
