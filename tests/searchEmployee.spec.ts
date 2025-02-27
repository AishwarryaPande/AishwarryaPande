import { test, expect } from "@playwright/test";
test.setTimeout(60000); // Increase timeout to 60 seconds
test("Search Employee using Employee List", async ({ page }) => {
  // Arrange
  const baseURL =
    "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login";
  const adminCredentials = {
    username: "Admin",
    password: "admin123",
  };
  const employeeName = "James";
  const fullName = "James Butler";

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

  // Act
  // Navigate to Employee List under PIM
  await page.getByRole("link", { name: "PIM" }).click();

  // Search for Employee using Type for hints...
  await page
    .getByRole("textbox", { name: "Type for hints..." })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Type for hints..." })
    .first()
    .fill(employeeName);
    await page.waitForTimeout(1000);
  // Select the employee from the dropdown
  await page.getByRole("option", { name: fullName }).locator("span").click();
  await page.getByRole("button", { name: "Search" }).click();

  // Assert
  // Verify the search result contains the employee's name
  await expect(page.getByText(employeeName)).toBeVisible();
});
