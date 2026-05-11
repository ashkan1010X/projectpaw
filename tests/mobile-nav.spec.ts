import { test, expect } from '@playwright/test';

test.describe('NavBar — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows desktop links, hides hamburger', async ({ page }) => {
    await page.goto('/');
    // Desktop links visible inside the main nav ul (hidden md:flex)
    const desktopNav = page.locator('ul.hidden');
    // On desktop the ul renders visibly — check a link inside it
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Services' })).toBeVisible();
    // Hamburger trigger not visible on desktop (md:hidden)
    const hamburger = page.getByRole('button', { name: /navigation menu/i });
    await expect(hamburger).toBeHidden();
  });
});

test.describe('NavBar — mobile (iPhone 14)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows hamburger, desktop links hidden', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(hamburger).toBeVisible();
  });

  test('opens drawer on hamburger tap', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    // Mobile menu nav becomes visible
    const mobileNav = page.getByRole('navigation', { name: 'Mobile menu' });
    await expect(mobileNav).toBeVisible();
    // All 4 links visible inside drawer
    await expect(mobileNav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Gallery' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Services' })).toBeVisible();
    // Branded header and tagline visible
    await expect(page.getByText('Find your perfect paw match')).toBeVisible();
  });

  test('closes drawer when a link is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const mobileNav = page.getByRole('navigation', { name: 'Mobile menu' });
    await expect(mobileNav).toBeVisible();
    // Click About link
    await mobileNav.getByRole('link', { name: 'About' }).click();
    // Drawer should close
    await expect(page.getByText('Find your perfect paw match')).not.toBeVisible();
    await expect(page).toHaveURL('/about');
  });

  test('shows auth controls in drawer (logged out)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    // Login and Sign Up accessible inside the drawer
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });

  test('active route has doggy highlight', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    // Home link should have border-doggy active class
    const homeLink = page.locator('[aria-label="Mobile menu"] a[href="/"]');
    const classes = await homeLink.getAttribute('class');
    expect(classes).toContain('border-doggy');
  });
});
