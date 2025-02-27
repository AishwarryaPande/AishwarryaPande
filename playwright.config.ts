import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();
export default defineConfig({
  testDir: './tests', // Directory where test files are located
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'html-report' }]], // Test result reporters
  use: {
    baseURL: 'https://opensource-demo.orangehrmlive.com/', // Base URL for the tests
    headless: true,
    //viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
   
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    /*{
      name: "webkit",
      use: {
        
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 720 },
      }, */
  ],
});