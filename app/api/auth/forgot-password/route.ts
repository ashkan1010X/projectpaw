import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mailer, FROM_ADDRESS } from '@/lib/mailer';

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
    <!-- preheader (hidden, shows in inbox preview) -->
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#0f0d09;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0d09;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#161310; border-radius:16px; overflow:hidden; box-shadow:0 4px 32px rgba(0,0,0,0.4);">

            <!-- Header -->
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#B2A4FF 0%,#A67C52 100%); padding:36px 24px;">
                <div style="font-size:32px; line-height:1; margin-bottom:8px;">🐾</div>
                <h1 style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.3px;">
                  Reset your password
                </h1>
                <p style="margin:6px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:rgba(255,255,255,0.8); letter-spacing:0.04em;">
                  ProjectPaw
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 32px 12px;">
                <p style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#F5CBA7;">
                  Hi there 👋
                </p>
                <p style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#F5CBA7;">
                  We received a request to reset the password for your ProjectPaw account.
                </p>
                <p style="margin:0 0 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:rgba(245,203,167,0.7);">
                  Click the button below to choose a new password. This link expires in <strong style="color:#F5CBA7;">1&nbsp;hour</strong>.
                </p>
              </td>
            </tr>

            <!-- CTA Button (bulletproof for Outlook) -->
            <tr>
              <td align="center" style="padding:0 32px 36px;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="20%" stroke="f" fillcolor="#B2A4FF">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Reset Password</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- -->
                <a href="${resetUrl}"
                   style="display:inline-block; background:#B2A4FF; background:linear-gradient(135deg,#B2A4FF 0%,#8b7dff 100%); color:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:16px 40px; border-radius:12px; letter-spacing:0.02em; box-shadow:0 4px 16px rgba(178,164,255,0.25);">
                  Reset Password →
                </a>
                <!--<![endif]-->
              </td>
            </tr>

            <!-- Divider + safety copy -->
            <tr>
              <td style="padding:0 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-top:1px solid rgba(245,203,167,0.1); padding-top:24px;">
                      <p style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:rgba(245,203,167,0.55);">
                        <strong style="color:rgba(245,203,167,0.75);">Didn't request this?</strong>
                        You can safely ignore this email — your password won't change unless you click the link above.
                      </p>
                      <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.6; color:rgba(245,203,167,0.4);">
                        Button not working? Copy and paste this link into your browser:<br/>
                        <span style="color:rgba(245,203,167,0.55); word-break:break-all;">${resetUrl}</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background:rgba(245,203,167,0.03); padding:20px 32px;">
                <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; color:rgba(245,203,167,0.4);">
                  Sent with care from <strong style="color:rgba(245,203,167,0.6);">ProjectPaw</strong> 🐾
                </p>
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

  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://projectpaw.vercel.app';

  // Always return the same response — prevents account enumeration (OWASP ASVS V2.2.5)
  const successResponse = NextResponse.json({
    message: "If an account exists for that email, we've sent a reset link.",
  });

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${origin}/reset-password` },
    });

    // No account / invalid email → silently succeed (no enumeration leak)
    if (error || !data?.properties?.action_link) {
      if (error && error.status !== 422 && error.status !== 400) {
        console.error('[forgot-password] generateLink error:', error.message);
      }
      return successResponse;
    }

    const { html, text } = buildResetEmail(data.properties.action_link);

    await mailer.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Reset your ProjectPaw password',
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': `pw-reset-${Date.now()}`,
        'Auto-Submitted': 'auto-generated',
      },
    });
  } catch (err) {
    console.error('[forgot-password] unexpected error:', err);
    // Still return success — never leak failure details to the client
  }

  return successResponse;
}
