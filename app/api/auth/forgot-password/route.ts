import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mailer, FROM_ADDRESS } from '@/lib/mailer';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Rate-limit policy (matches industry norms: GitHub = 3/hr per email, Stripe = similar)
const PER_EMAIL_MAX = 3;
const PER_EMAIL_WINDOW_MIN = 60;
const PER_IP_MAX = 10;
const PER_IP_WINDOW_MIN = 60;

function buildResetEmail(resetUrl: string) {
  const preheader =
    "Reset your ProjectPaw password — this link expires in 1 hour. Didn't ask for this? You can ignore this email.";

  const text = [
    'Reset your ProjectPaw password',
    '',
    'We received a request to reset the password for your ProjectPaw account.',
    'Open this link to choose a new password (expires in 1 hour):',
    '',
    resetUrl,
    '',
    "If you didn't request a password reset, you can safely ignore this email — your password won't change.",
    '',
    '— The ProjectPaw team 🐾',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>Reset your ProjectPaw password</title>
  </head>
  <body style="margin:0; padding:0; background:#0f0d09; -webkit-font-smoothing:antialiased;">
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#0f0d09;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0d09;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#161310; border-radius:16px; overflow:hidden; box-shadow:0 4px 32px rgba(0,0,0,0.4);">
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#B2A4FF 0%,#A67C52 100%); padding:36px 24px;">
                <div style="font-size:32px; line-height:1; margin-bottom:8px;">🐾</div>
                <h1 style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.3px;">Reset your password</h1>
                <p style="margin:6px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:rgba(255,255,255,0.8); letter-spacing:0.04em;">ProjectPaw</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 12px;">
                <p style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#F5CBA7;">Hi there 👋</p>
                <p style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#F5CBA7;">We received a request to reset the password for your ProjectPaw account.</p>
                <p style="margin:0 0 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:rgba(245,203,167,0.7);">Click the button below to choose a new password. This link expires in <strong style="color:#F5CBA7;">1&nbsp;hour</strong>.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 36px;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="20%" stroke="f" fillcolor="#B2A4FF">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Reset Password</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- -->
                <a href="${resetUrl}" style="display:inline-block; background:#B2A4FF; background:linear-gradient(135deg,#B2A4FF 0%,#8b7dff 100%); color:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:16px 40px; border-radius:12px; letter-spacing:0.02em; box-shadow:0 4px 16px rgba(178,164,255,0.25);">Reset Password →</a>
                <!--<![endif]-->
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-top:1px solid rgba(245,203,167,0.1); padding-top:24px;">
                      <p style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:rgba(245,203,167,0.55);"><strong style="color:rgba(245,203,167,0.75);">Didn't request this?</strong> You can safely ignore this email — your password won't change unless you click the link above.</p>
                      <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.6; color:rgba(245,203,167,0.4);">Button not working? Copy and paste this link into your browser:<br/><span style="color:rgba(245,203,167,0.55); word-break:break-all;">${resetUrl}</span></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="background:rgba(245,203,167,0.03); padding:20px 32px;">
                <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; color:rgba(245,203,167,0.4);">Sent with care from <strong style="color:rgba(245,203,167,0.6);">ProjectPaw</strong> 🐾</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, text };
}

export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: 'A valid email is required.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const ip = getClientIp(req);

  // Rate limit: per-email (stops bombing one user) AND per-IP (stops enumeration sweeps)
  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit({
      bucket: 'forgot_password_email',
      identifier: normalizedEmail,
      max: PER_EMAIL_MAX,
      windowMinutes: PER_EMAIL_WINDOW_MIN,
    }),
    checkRateLimit({
      bucket: 'forgot_password_ip',
      identifier: ip,
      max: PER_IP_MAX,
      windowMinutes: PER_IP_WINDOW_MIN,
    }),
  ]);

  const blocked = !emailLimit.allowed || !ipLimit.allowed;
  if (blocked) {
    const retryAfter = Math.max(emailLimit.retryAfterSeconds, ipLimit.retryAfterSeconds);
    const minutes = Math.ceil(retryAfter / 60);
    return NextResponse.json(
      {
        message: `Too many reset requests. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(PER_EMAIL_MAX),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://projectpaw.vercel.app';

  // CRITICAL — defer the actual email work until AFTER the response is sent.
  // This makes the response time constant regardless of whether the email
  // exists in Supabase, closing the timing-attack enumeration leak (OWASP V2.2.5).
  after(async () => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: { redirectTo: `${origin}/reset-password` },
      });

      if (error || !data?.properties?.action_link) {
        // No account or invalid email — silent no-op (already returned 200)
        if (error && error.status !== 422 && error.status !== 400) {
          console.error('[forgot-password] generateLink error:', error.message);
        }
        return;
      }

      const { html, text } = buildResetEmail(data.properties.action_link);

      await mailer.sendMail({
        from: FROM_ADDRESS,
        to: normalizedEmail,
        subject: 'Reset your ProjectPaw password',
        html,
        text,
        headers: {
          'X-Entity-Ref-ID': `pw-reset-${Date.now()}`,
          'Auto-Submitted': 'auto-generated',
        },
      });
    } catch (err) {
      console.error('[forgot-password] post-response error:', err);
    }
  });

  // Constant-time 200 — same response whether email exists, doesn't exist,
  // is invalid in Supabase, etc. Prevents account enumeration (OWASP V2.2.5).
  return NextResponse.json({
    message: "If an account exists for that email, we've sent a reset link.",
  });
}
