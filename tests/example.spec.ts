import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await expect(page).toHaveTitle(/ShelfLife/);
});


test('has Log In button', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const loginButton = page.locator('button', { hasText: /Log In/i });
  
  await expect(loginButton).toBeVisible();
});


test('has Sign Up button', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const signUpButton = page.locator('button', { hasText: /Sign Up/i });

  await expect(signUpButton).toBeVisible();
});

test('has email and password fields', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const emailField = page.getByRole('textbox', { name: /email/i });
  await expect(emailField).toBeVisible();

  const passwordField = page.getByRole('textbox', { name: /password/i });
  await expect(passwordField).toBeVisible();
});

test('test with environment variables for sensitive data', async ({ page }) => {
  const email: string = process.env.TEST_EMAIL || '';  
  const password: string = process.env.TEST_PASSWORD || '';  

  if (!email || !password) {
    throw new Error('Environment variables TEST_EMAIL or TEST_PASSWORD are not set');
  }

  await page.goto('http://localhost:3000', { timeout: 0 });
  const emailField = page.getByRole('textbox', { name: 'Email:' });
  await emailField.fill(email);

  const passwordField = page.getByRole('textbox', { name: 'Password:' });
  await passwordField.fill(password);

  const loginButton = page.getByRole('button', { name: 'Log in' });
  await loginButton.click();

  await page.waitForLoadState('networkidle', { timeout: 0 });

  await page.goto('http://localhost:3000/dashboard', { timeout: 0 });

});

test('login authentication flow', async ({ page }) => {
  // Setup
  const email = process.env.TEST_EMAIL || '';
  const password = process.env.TEST_PASSWORD || '';

  // Login
  await page.goto('http://localhost:3000');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Click login and wait for either:
  // 1. Successful redirect to dashboard
  // 2. Success message appearing
  await page.click('button:has-text("Log in")');

  // Take a screenshot to see what happened
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'after-login.png' });

  try {
    // Check if we see the "Redirecting" message
    const redirectingMessage = await page
      .locator('text=Redirecting you to the dashboard')
      .isVisible();
    if (redirectingMessage) {
      console.log('Client auth flow detected - waiting for redirect');
      // Wait longer for the redirect to happen (timeout + buffer)
      await page.waitForTimeout(3000);
    }
  } catch (e) {
    // No message visible, continue
  }

  // Check final URL - should be dashboard by now regardless of flow
  console.log('Current URL after auth handling:', page.url());
  await expect(page).toHaveURL(/dashboard/);
});
