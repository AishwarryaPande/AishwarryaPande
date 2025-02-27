import { test, expect } from "@playwright/test";

test("Admin Login and Create New Employee", async ({ page }) => {
  // Arrange for Admin
  const baseURL =
    "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login";
  const adminUsername = "Admin";
  const adminPassword = "admin123";

  // Act - Navigate to Login Page
  await page.goto(baseURL);

  // Wait for the full page to load
  console.log("⏳ Waiting for the page to fully load...");
  await page.waitForLoadState("networkidle");

  // Retry mechanism for dynamic loading
  for (let attempt = 0; attempt < 3; attempt++) {
    console.log(`🔁 Attempt ${attempt + 1}: Looking for Username input...`);

    // Check if Username input is visible before interacting
    const usernameInput = page.getByPlaceholder("Username");

    if (await usernameInput.isVisible({ timeout: 10000 })) {
      await usernameInput.fill(adminUsername);
      await page.getByPlaceholder("Password").fill(adminPassword);
      await page.getByRole("button", { name: "Login" }).click();
      console.log("✅ Admin Login Successful");
      break;
    } else {
      console.log("⚠️ Username input not found, retrying...");
      await page.waitForTimeout(3000); // Wait before retrying
    }
  }

  // Act - Navigate to PIM Module and Add Employee
  console.log("🔎 Navigating to PIM Module...");
  await page.getByRole("link", { name: "PIM" }).click();
  await page.getByRole("button", { name: "Add" }).click();

  // Arrange - Employee Details
  const firstName = "John";
  const middleName = "A";
  const lastName = "Doe";
  const employeeId = `EMP${Math.random()
    .toString(36)
    .substring(2, 9)
    .toUpperCase()}`;

  // Act - Fill Employee Details Form
  console.log("👤 Adding a New Employee...");
  await page.getByRole("textbox", { name: "First Name" }).fill(firstName);
  await page.getByRole("textbox", { name: "Middle Name" }).fill(middleName);
  await page.getByRole("textbox", { name: "Last Name" }).fill(lastName);
  await page.locator("form").getByRole("textbox").nth(4).fill(employeeId);

  // Save the employee
  await page.getByRole("button", { name: "Save" }).click();

  // Assert - Verify Employee Added Successfully
  await page.waitForSelector(`text=${firstName} ${lastName}`, {
    timeout: 10000,
  });
  console.log(`✅ Employee Added: ${firstName} ${lastName}`);

  // Act - Admin Logout
  console.log("Attempting Admin Logout...");
  const profileDropdown = page.locator(
    "//span[contains(@class, 'oxd-userdropdown-tab')]//i[contains(@class, 'bi-caret-down-fill')]"
  );
  await profileDropdown.scrollIntoViewIfNeeded();
  await profileDropdown.click();
  await page.waitForTimeout(1000);

  console.log("Selecting Logout Option...");
  const logoutOption = page.locator(
    "//a[contains(@class, 'oxd-userdropdown-link') and text()='Logout']"
  );
  await logoutOption.waitFor({ state: "visible", timeout: 5000 });
  await logoutOption.click();
  console.log("Admin successfully logged out.");

  // Assert - Admin Logout Success
  await page.waitForSelector('button:has-text("Login")', { timeout: 10000 });
  console.log("✅ Admin Logout Successful");
});
