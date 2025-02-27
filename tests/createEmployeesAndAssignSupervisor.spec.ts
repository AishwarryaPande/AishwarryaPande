import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
require("dotenv").config({ path: path.resolve(__dirname, "../config/.env") });

const baseURL =
  process.env.BASE_URL ||
  "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login";

const adminCredentials = {
  username: "Admin",
  password: "admin123",
};

// Function to Generate Random Username
const generateRandomUsername = () => {
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `TestUser${randomSuffix}`;
};

// Initial Username
let firstEmployeeUsername = generateRandomUsername();
let secondEmployeeUsername = generateRandomUsername();
let employeePassword = "Test123";

test.setTimeout(180000); // Set to 180 seconds for complex scenarios

// Helper Function: Dismiss Popup if Present
const dismissPopupIfPresent = async (page) => {
  console.log("Checking for popups...");
  try {
    const popup = page.locator(".oxd-dialog-title");
    if (await popup.isVisible({ timeout: 3000 })) {
      console.log("Popup detected. Closing it...");
      await page.locator('button:has-text("Ok")').click();
      await page.waitForTimeout(1000);
      console.log("Popup closed.");
    } else {
      console.log("No popup found.");
    }
  } catch (error) {
    console.log("No popup present or error occurred while closing popup.");
  }
};

test.describe("Create Two Employees and Assign Supervisor", () => {
  test("Create Employees and Assign Supervisor", async ({ page }) => {
    // Step 1: Log in as Admin
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("textbox", { name: "Username" })
      .fill(adminCredentials.username);
    await page
      .getByRole("textbox", { name: "Password" })
      .fill(adminCredentials.password);
    await page.getByRole("button", { name: "Login" }).click();

    // Navigate to PIM and Employee List
    console.log("Navigating to PIM > Employee List...");
    await page.getByRole("link", { name: "PIM" }).click();
    await page.getByRole("link", { name: "Employee List" }).click();
    await page.waitForTimeout(2000);

    // Scroll into view for both rows
    console.log("Scrolling into view for the first and second row...");
    const firstRow = page.locator(".oxd-table-card").nth(0);
    const secondRow = page.locator(".oxd-table-card").nth(1);
    await firstRow.scrollIntoViewIfNeeded();
    await secondRow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Get Text of First and Second Row Employees
    firstEmployeeUsername =
      (await firstRow.locator(".oxd-table-cell:nth-child(3)").textContent()) ??
      "Unknown";
    secondEmployeeUsername =
      (await secondRow.locator(".oxd-table-cell:nth-child(3)").textContent()) ??
      "Unknown";

    console.log(`First Employee: ${firstEmployeeUsername}`);
    console.log(`Second Employee (Supervisor): ${secondEmployeeUsername}`);

    // Click on First Row Employee to Navigate to Details
    await firstRow.click();
    await page.waitForTimeout(2000);

    // Navigate to "Report-to" Section
    await page.getByText("Report-to").scrollIntoViewIfNeeded();
    await page.getByText("Report-to").click();

    // Check if a supervisor is already present
    const supervisorRow = page.locator("text=James  Butler"); // Change this to the specific supervisor name you want to check
    const isSupervisorPresent = await supervisorRow.isVisible();

    if (isSupervisorPresent) {
      // Click on the delete button next to the existing supervisor
      await page.getByRole("button", { name: "" }).click(); // Clicks on delete icon
      await page.getByRole("button", { name: " Yes, Delete" }).click(); // Confirms deletion
      await page.waitForTimeout(1000); // Wait for deletion to complete
    }

    // Click on "+ Add" under "Assigned Supervisors"
    await page.locator('div').filter({ hasText: /^Assigned Supervisors Add No Records FoundNameReporting MethodActions$/ }).getByRole('button').click();
    // Type Supervisor Name
    const supervisorField = page.getByRole("textbox", {
      name: "Type for hints...",
    });
    await supervisorField.fill(secondEmployeeUsername);
    await page.waitForTimeout(1000);
    await page
      .locator(".oxd-autocomplete-option")
      .filter({ hasText: secondEmployeeUsername })
      .click();
    //await page.waitForSelector(".oxd-autocomplete-dropdown", { timeout: 5000 });
    await page.locator("form i").click();
    await page.getByRole("option", { name: "Direct", exact: true }).click();
    await page.getByRole("button", { name: "Save" }).click();
    // Verify supervisor is assigned:
    await expect(page.getByText("Successfully Saved")).toBeVisible();
  });
});
