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
  return `Aishwarryapande${randomSuffix}`;
};

// Initial Username
let newUsername = generateRandomUsername();
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

test.describe("Complete Workflow: User Creation, Leave Credit, Application, and Approval in OrangeHRM", () => {
  test("Create User, Credit Leave, Apply Leave, Approve Leave", async ({
    page,
    context,
  }) => {
    // Step 1: Log in as Admin and Create User
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("textbox", { name: "Username" })
      .fill(adminCredentials.username);
    await page
      .getByRole("textbox", { name: "Password" })
      .fill(adminCredentials.password);
    await page.getByRole("button", { name: "Login" }).click();

    await page.getByRole("link", { name: "Admin" }).click();
    await page.getByRole("button", { name: " Add" }).click();

    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(
        `Attempt ${
          attempt + 1
        }: Trying to create user with username: ${newUsername}`
      );

      await page.getByText("-- Select --").first().click();
      await page.getByRole("option", { name: "ESS" }).click();
      await page
        .getByRole("textbox", { name: "Type for hints..." })
        .fill("ora");
      await page.getByText("Orange Test").click();
      await page.getByText("-- Select --").click();
      await page.getByRole("option", { name: "Enabled" }).click();

      await page.getByRole("textbox").nth(2).clear();
      await page.getByRole("textbox").nth(2).fill(newUsername);

      await page.getByRole("textbox").nth(3).clear();
      await page.getByRole("textbox").nth(3).fill(employeePassword);
      await page.getByRole("textbox").nth(4).clear();
      await page.getByRole("textbox").nth(4).fill(employeePassword);
      await page.getByRole("button", { name: "Save" }).click();

      await dismissPopupIfPresent(page); // Global Popup Dismissal

      try {
        await expect(page.getByText("Successfully Saved")).toBeVisible({
          timeout: 10000,
        });
        console.log("User creation success message visible.");
        break;
      } catch (error) {
        const alreadyExists = await page
          .locator("text=Already exists")
          .isVisible();
        if (alreadyExists) {
          console.log(
            "Username already exists. Generating a new username and retrying..."
          );
          newUsername = generateRandomUsername();
          await page.waitForTimeout(2000);
        } else {
          console.error("User creation failed for another reason.");
          throw error;
        }
      }
    }

    // Step 2: Credit Leave Entitlement
    console.log("Navigating to Add Leave Entitlement...");
    await page.getByRole("link", { name: "Leave" }).click();
    await page.getByText("Entitlements").click();
    await page.getByRole("menuitem", { name: "Add Entitlements" }).click();

    console.log('Searching for "Orange Test"...');
    await page
      .locator('input[placeholder="Type for hints..."]')
      .fill("Orange Test");
    await page.waitForTimeout(2000);

    await page
      .locator(".oxd-autocomplete-dropdown")
      .waitFor({ state: "visible", timeout: 5000 });
    await page
      .locator(".oxd-autocomplete-option")
      .filter({ hasText: "Orange Test" })
      .click();
    await page.waitForTimeout(3000);

    await page.getByText("-- Select --").click();
    await page.getByRole("option", { name: "CAN - Personal" }).click();
    await page.getByRole("textbox").nth(2).click();
    await page.getByRole("textbox").nth(2).fill("5");
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    console.log(
      'Leave entitlement successfully added for the user "Orange Test".'
    );

    await dismissPopupIfPresent(page);

    // Step: Admin Logout
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

    await dismissPopupIfPresent(page);

    // Step 4: Applying for Leave
    await page.goto(baseURL);
    await page.getByRole("textbox", { name: "Username" }).fill(newUsername);
    await page
      .getByRole("textbox", { name: "Password" })
      .fill(employeePassword);
    await page.getByRole("button", { name: "Login" }).click();

    // New: Dismiss Credential Popup if Present
    await dismissPopupIfPresent(page);
    await page.getByRole("link", { name: "Leave" }).click();
    await page.getByRole("link", { name: "Apply" }).click();
    await page.getByText("-- Select --").click();
    await page.getByRole("option", { name: "CAN - Personal" }).click();
    await page.locator("form i").nth(2).click(); // Date Picker
    await page.getByRole("button", { name: "" }).click(); // Next Month

    // File to store the last selected date
    const lastDateFile = "./lastDate.txt";
    let lastSelectedDate = 3; // Default to 3 if no file is present

    // Read the last selected date from file
    if (fs.existsSync(lastDateFile)) {
      lastSelectedDate = parseInt(fs.readFileSync(lastDateFile, "utf8"), 10);
      console.log(`Last selected date was: ${lastSelectedDate}`);
    }

    // Function to check if the date is a weekend
    const isWeekend = (date) => {
      const dayOfWeek = date.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
    };

    // Get Today's Date
    const today = new Date();
    let dayToSelect = lastSelectedDate + 1; // Start from the next day after the last selected

    // Reset to 1st if end of the month is reached
    const daysInCurrentMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    if (dayToSelect > daysInCurrentMonth) {
      dayToSelect = 1;
      console.log("End of the month reached. Resetting to 1st of next month.");
      await page.getByRole("button", { name: "" }).click(); // Move to Next Month
    }

    // Loop to find the next available weekday
    while (true) {
      const dateToCheck = new Date(
        today.getFullYear(),
        today.getMonth(),
        dayToSelect
      );

      if (!isWeekend(dateToCheck)) {
        await page.getByText(dayToSelect.toString(), { exact: true }).click();
        console.log(`Selected ${dayToSelect} (Weekday)`);
        break;
      } else {
        console.log(`${dayToSelect} is a weekend, moving to next day...`);
        dayToSelect++;

        // If end of month is reached, move to next month
        if (dayToSelect > daysInCurrentMonth) {
          dayToSelect = 1;
          console.log(
            "End of the month reached. Resetting to 1st of next month."
          );
          await page.getByRole("button", { name: "" }).click(); // Move to Next Month
        }
      }
    }

    // Save the selected date to the file
    fs.writeFileSync(lastDateFile, dayToSelect.toString());
    console.log(`Saved ${dayToSelect} as the last selected date.`);

    // Enter Comments
    await page.locator("textarea").click();
    await page.locator("textarea").fill("Sick");

    // Submit the Leave Application
    await page.getByRole("button", { name: "Apply" }).click();
    console.log("Leave Application Submitted.");
    // Employee Logout after Applying Leave
    console.log("Logging out...");
    await page.locator("span").filter({ hasText: "Orange Test" }).click();
    await page.getByRole("menuitem", { name: "Logout" }).click();
    console.log("Employee successfully logged out.");

    // Step 5: Admin Approves Leave
    console.log("Logging in as Admin to Approve Leave...");
    await page.goto(baseURL);
    // Login as Admin
    await page.getByRole("textbox", { name: "Username" }).fill("Admin");
    await page.getByRole("textbox", { name: "Username" }).press("Tab");
    await page.getByRole("textbox", { name: "Password" }).fill("admin123");
    await page.locator("form div").filter({ hasText: "Login" }).click();
    console.log("Admin logged in successfully.");

    // Navigate to Leave Section
    await page.getByRole("link", { name: "Leave" }).click();
    console.log("Navigated to Leave Section.");
    // Scroll to Approve Button
    console.log("Scrolling to Approve button...");
    const approveButton = page.getByRole("button", { name: "Approve" }).first();
    await approveButton.scrollIntoViewIfNeeded(); // Scroll into view if needed
    await page.waitForTimeout(1000); // Wait for scrolling animation

    // Click the Approve button with force
    await approveButton.click({ force: true });
    console.log("Clicked on Approve button.");
    await page.waitForTimeout(1000); // Wait for the action to complete
    console.log("Leave Approved Successfully.");
  });
});
