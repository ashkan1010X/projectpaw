import { test, expect } from '@playwright/test';

// FAQ live-search box — verifies filtering, auto-expand, clear, and empty state
// across the 5 required viewports (Galaxy S20, iPhone SE, iPhone 14, iPad, Desktop).
const VIEWPORTS = [
  { name: 'Galaxy S20', width: 360, height: 800 },
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 },
];

for (const vp of VIEWPORTS) {
  test.describe(`FAQ search — ${vp.name} (${vp.width}px)`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('search input is visible and filters to a matching question', async ({ page }) => {
      await page.goto('/');

      const search = page.getByPlaceholder('Search questions…');
      await search.scrollIntoViewIfNeeded();
      await expect(search).toBeVisible();

      // A broad term matches several questions. They must appear as a COLLAPSED
      // list of titles — not a wall of auto-opened answers (the original bug).
      await search.fill('dog');
      const dogQ = page.getByRole('button', { name: /Who will be taking care of my dog/i });
      await expect(dogQ).toBeVisible();
      await expect(dogQ).toHaveAttribute('aria-expanded', 'false');

      // Clicking a result expands it.
      await dogQ.click();
      await expect(dogQ).toHaveAttribute('aria-expanded', 'true');

      // "refund" lives in the answer body of the cancellation question — confirm
      // it surfaces (we match answer text) and filters out non-matches.
      await search.fill('refund');
      await expect(
        page.getByRole('button', { name: /cancellation and refund policy/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /what payment methods do you accept/i }),
      ).toHaveCount(0);
    });

    test('auto-opens the answer once the search narrows to a single match', async ({ page }) => {
      await page.goto('/');
      const search = page.getByPlaceholder('Search questions…');
      await search.scrollIntoViewIfNeeded();

      // "reschedule" appears in exactly one question — once it's the only match,
      // showing its answer without an extra click is the intended convenience.
      await search.fill('reschedule');
      const rescheduleQ = page.getByRole('button', { name: /reschedule instead of cancelling/i });
      await expect(rescheduleQ).toBeVisible();
      await expect(rescheduleQ).toHaveAttribute('aria-expanded', 'true');
    });

    test('clear button restores the full list', async ({ page }) => {
      await page.goto('/');
      const search = page.getByPlaceholder('Search questions…');
      await search.scrollIntoViewIfNeeded();
      await search.fill('boarding');

      await page.getByRole('button', { name: 'Clear search' }).click();
      await expect(search).toHaveValue('');
      // Payment question is back after clearing.
      await expect(
        page.getByRole('button', { name: /what payment methods do you accept/i }),
      ).toBeVisible();
    });

    test('no-match query shows the empty state with an Email Sara CTA', async ({ page }) => {
      await page.goto('/');
      const search = page.getByPlaceholder('Search questions…');
      await search.scrollIntoViewIfNeeded();
      await search.fill('xyzzy-no-such-question');

      await expect(page.getByText(/No questions match/i)).toBeVisible();
      // Two "Email Sara" links exist when the empty state shows (the intro link
      // plus the empty-state CTA) — assert the empty-state one specifically.
      await expect(page.getByRole('link', { name: /Email Sara/i }).last()).toBeVisible();
    });
  });
}
