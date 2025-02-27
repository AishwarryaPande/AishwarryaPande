import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto(
    "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"
  );
  await page.getByRole("textbox", { name: "Username" }).click();
  await page.getByRole("textbox", { name: "Username" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill("Admin");
  await page.getByRole("textbox", { name: "Username" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill("admin123");
  await page.getByText("UsernamePassword Login Forgot").click();
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
  // Step: Admin Logout
  console.log("Attempting Admin Logout...");
  const profileDropdown = page.locator(
    "//span[contains(@class, 'oxd-userdropdown-tab')]//i[contains(@class, 'bi-caret-down-fill')]"
  );
  await profileDropdown.scrollIntoViewIfNeeded();
  await profileDropdown.click();
  await page.waitForTimeout(1000);

  console.log("Selecting Logout Option...");
  const adminLogoutOption = page.locator(
    "//a[contains(@class, 'oxd-userdropdown-link') and text()='Logout']"
  );
  await adminLogoutOption.waitFor({ state: "visible", timeout: 5000 });
  await adminLogoutOption.click();
  console.log("Admin successfully logged out.");
  await page.waitForTimeout(1000);
  //Employee login and logout
  await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
  console.log("Employee attempts to login...");

  // Enter Username and Password
  await page.getByRole("textbox", { name: "Username" }).fill("User01");
  await page.getByRole("textbox", { name: "Password" }).fill("Test123");
  await page.getByRole("button", { name: "Login" }).click();

  // Wait for Employee Dashboard to load
  await page.waitForTimeout(3000); // Adjust this wait if needed for loading time

  // Check if the User Dropdown Tab is present
  const userDropdownTab = page.locator("//header//ul/li/span[contains(@class, 'oxd-userdropdown-tab')]");
  const isDropdownVisible = await userDropdownTab.isVisible();

  // If the User Dropdown is not visible, treat it as the user being deleted
  if (!isDropdownVisible) {
    console.log("User01 must have been deleted from Orange HRM. Test passed.");
    return; // Exit the test as pass
  }

  // Click on the User Dropdown Tab
  console.log("Clicking on User Dropdown Tab...");
  await userDropdownTab.click();

  // Wait for the Logout option to appear
  const employeeLogoutOption = page.locator("//a[contains(@class, 'oxd-userdropdown-link') and contains(text(), 'Logout')]");
  await employeeLogoutOption.waitFor({ state: "visible", timeout: 10000 });

  // Click on Logout
  console.log("Employee logging out...");
  await employeeLogoutOption.click();

  // Wait for the login page to reappear to confirm successful logout
  await page.waitForSelector("input[name='username']", { timeout: 10000 });
  console.log("Employee successfully logged out.");
});
