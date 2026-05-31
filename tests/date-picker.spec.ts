import { test, expect, type Page } from '@playwright/test';

// Smoke test for the DateTimePicker after its useSyncExternalStore refactor.
// The calendar/time popover renders via `{mounted && open && createPortal(...)}`,
// so if `mounted` never flips true the popover never appears and nobody can book.
// This drives the real picker inside the booking modal across all 5 viewports.

const VIEWPORTS = [
  { name: 'Galaxy S20', width: 360, height: 800 },
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 },
];

// Make the app think we're logged in (no refreshToken → auth-context trusts the
// stored token as-is and never tries to refresh), and stub the two fetches the
// booking modal makes so the fake token can't trigger a 401 → /login redirect.
async function signInAndStub(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'doguser',
      JSON.stringify({ name: 'Test User', email: 'test@example.com' }),
    );
    localStorage.setItem('token', 'smoke-test-token');
  });
  await page.route('**/api/pets', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ pets: [] }),
    }),
  );
  await page.route('**/api/bookings/availability**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ takenDatetimes: [] }),
    }),
  );
}

for (const vp of VIEWPORTS) {
  test.describe(`DateTimePicker — ${vp.name} (${vp.width}px)`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('opens the booking modal, the calendar popover appears, and a date + time can be picked', async ({
      page,
    }) => {
      await signInAndStub(page);
      await page.goto('/services');

      // The logged-in "Book Now" is a bare <button>; the logged-out variant is a
      // <button> wrapped in an <a href="/login">. Waiting for the un-wrapped one
      // is viewport-independent (works inside the mobile drawer too) and only
      // appears after client-side auth init, so its onClick is already wired —
      // no hydration race swallowing the click.
      const bookNow = page
        .locator('xpath=//button[normalize-space()="Book Now" and not(ancestor::a)]')
        .first();
      await expect(bookNow).toBeVisible();
      await bookNow.click();

      // The picker trigger lives in the modal's details step.
      const trigger = page.getByRole('button', { name: /Select date & time/i });
      await expect(trigger).toBeVisible();

      // Click it — this is the moment that proves `mounted && open` renders the portal.
      await trigger.click();
      await expect(page.getByText('Tap a date to pick a time')).toBeVisible();

      // Jump to next month so every day is in the future (enabled), then pick the 15th.
      await page.getByRole('button', { name: 'Next month' }).click();
      await page.getByRole('button', { name: '15', exact: true }).click();

      // Time step: confirm slots render, then pick the first available one.
      await expect(page.getByText('Select a time')).toBeVisible();
      const firstSlot = page.getByRole('button', { name: /^\d{1,2}:\d\d (AM|PM)$/ }).first();
      await firstSlot.click();

      // Selecting closes the popover and rewrites the trigger label from the
      // "Select date & time" placeholder to "Wkdy, Mon DD · H:MM AM/PM". The
      // placeholder is therefore gone, and a button showing the chosen date+time
      // is now visible — proving onChange fired and the value round-tripped.
      await expect(page.getByText('Select a time')).toHaveCount(0);
      await expect(trigger).toHaveCount(0);
      await expect(page.getByRole('button', { name: /·\s*\d{1,2}:\d\d (AM|PM)/ })).toBeVisible();
    });
  });
}
