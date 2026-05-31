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

      // "refund" lives in the answer body of the cancellation question — confirm
      // it surfaces even though the word isn't in the question title.
      await search.fill('refund');

      const cancellationTrigger = page.getByRole('button', {
        name: /cancellation and refund policy/i,
      });
      await expect(cancellationTrigger).toBeVisible();
      // Auto-expanded while a query is active → its answer panel is shown.
      await expect(cancellationTrigger).toHaveAttribute('aria-expanded', 'true');

      // A non-matching question is filtered out of the DOM.
      await expect(
        page.getByRole('button', { name: /what payment methods do you accept/i }),
      ).toHaveCount(0);
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
