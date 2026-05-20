/**
 * Escape user-supplied strings before interpolating into HTML email templates.
 *
 * We hand-write HTML for transactional emails (Nodemailer doesn't sanitize),
 * so any `${userInput}` inside a template literal needs to pass through here
 * to prevent HTML/CSS injection in the rendered email (Gmail blocks JS but
 * still renders tags/styles → fake links, scam layouts, broken UI).
 */
export function escapeHtml(input: string | null | undefined): string {
  if (input == null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
