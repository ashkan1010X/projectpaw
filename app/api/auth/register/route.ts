import { NextRequest, NextResponse, after } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isPasswordPwned } from '@/lib/hibp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { mailer, FROM_ADDRESS } from '@/lib/mailer';

function buildWelcomeEmail(name: string, appUrl: string) {
  const firstName = name.split(' ')[0] || name;
  const servicesUrl = `${appUrl}/services`;

  const preheader = `Welcome to ProjectPaw, ${firstName}! Your dog is in great hands.`;

  const text = [
    `Welcome to ProjectPaw, ${firstName}! 🐾`,
    '',
    "We're so glad you're here.",
    '',
    'You can now browse and book grooming, boarding, training, walking, vet visits, and more — all in one place.',
    '',
    `Browse services: ${servicesUrl}`,
    '',
    'Questions? Just reply to this email.',
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
    <title>Welcome to ProjectPaw</title>
  </head>
  <body style="margin:0; padding:0; background:#0f0d09; -webkit-font-smoothing:antialiased;">
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#0f0d09;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0d09;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background:#161310; border-radius:16px; overflow:hidden; box-shadow:0 4px 32px rgba(0,0,0,0.4);">

            <!-- Header -->
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#B2A4FF 0%,#A67C52 100%); padding:40px 24px 36px;">
                <div style="font-size:40px; line-height:1; margin-bottom:12px;">🐾</div>
                <h1 style="margin:0 0 6px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">Welcome, ${firstName}!</h1>
                <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:rgba(255,255,255,0.8); letter-spacing:0.04em;">Your dog is in great hands.</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 32px 8px;">
                <p style="margin:0 0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.65; color:#F5CBA7;">
                  We&rsquo;re so glad you&rsquo;re here. ProjectPaw connects you with vetted, certified professionals for every service your dog needs — all bookable in under 2 minutes.
                </p>
                <p style="margin:0 0 28px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.65; color:rgba(245,203,167,0.7);">
                  Browse grooming, boarding, training, walking, vet visits, daycare, and more below.
                </p>
              </td>
            </tr>

            <!-- Services grid -->
            <tr>
              <td style="padding:0 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    ${[
                      ['✂️', 'Grooming'],
                      ['🏠', 'Boarding'],
                      ['🎓', 'Training'],
                      ['🦮', 'Walking'],
                      ['🩺', 'Vet Visits'],
                      ['☀️', 'Daycare'],
                    ]
                      .map(
                        ([icon, label]) =>
                          `<td align="center" width="16%" style="padding:6px 4px;">
                            <div style="background:rgba(178,164,255,0.08); border:1px solid rgba(178,164,255,0.15); border-radius:10px; padding:10px 4px;">
                              <div style="font-size:18px; line-height:1; margin-bottom:4px;">${icon}</div>
                              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:10px; font-weight:600; color:rgba(245,203,167,0.65); letter-spacing:0.04em;">${label}</div>
                            </div>
                          </td>`,
                      )
                      .join('')}
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:0 32px 36px;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${servicesUrl}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="20%" stroke="f" fillcolor="#B2A4FF">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Browse Services</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-- -->
                <a href="${servicesUrl}" style="display:inline-block; background:#B2A4FF; background:linear-gradient(135deg,#B2A4FF 0%,#8b7dff 100%); color:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:16px 40px; border-radius:12px; letter-spacing:0.02em; box-shadow:0 4px 16px rgba(178,164,255,0.25);">Browse Services →</a>
                <!--<![endif]-->
              </td>
            </tr>

            <!-- Divider + footer note -->
            <tr>
              <td style="padding:0 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-top:1px solid rgba(245,203,167,0.1); padding-top:24px;">
                      <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:rgba(245,203,167,0.5);">
                        Questions? Just reply to this email — we&rsquo;re happy to help.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
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
  const { name, email, password } = (await req.json()) as {
    name: string;
    email: string;
    password: string;
  };

  // Rate limiting: 5 signups/hr per IP, 3/hr per email (stops bulk account creation)
  const ip = getClientIp(req);
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit({ bucket: 'register_ip', identifier: ip, max: 5, windowMinutes: 60 }),
    email
      ? checkRateLimit({ bucket: 'register_email', identifier: email.toLowerCase().trim(), max: 3, windowMinutes: 60 })
      : Promise.resolve({ allowed: true, remaining: 3, retryAfterSeconds: 0 }),
  ]);

  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
    return NextResponse.json(
      { message: 'Too many accounts created from this device. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  // HIBP check — block passwords known to have appeared in past data breaches.
  // Server-side enforcement (client also checks, but never trust the client).
  if (password && typeof password === 'string') {
    const pwn = await isPasswordPwned(password);
    if (pwn.pwned) {
      return NextResponse.json(
        {
          message: `This password has appeared in ${pwn.breachCount.toLocaleString()} known data breaches. Please choose a different password.`,
        },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { message: error?.message ?? 'Registration failed.' },
      { status: 400 },
    );
  }

  if (!data.session) {
    return NextResponse.json(
      {
        message:
          'Account created! Please check your email to confirm your address before signing in.',
      },
      { status: 202 },
    );
  }

  // Send welcome email after response — non-blocking, doesn't delay signup
  after(async () => {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://projectpaw.vercel.app';
      const { html, text } = buildWelcomeEmail(name, appUrl);
      await mailer.sendMail({
        from: FROM_ADDRESS,
        to: email,
        subject: `Welcome to ProjectPaw, ${name.split(' ')[0] || name}! 🐾`,
        html,
        text,
        headers: {
          'X-Entity-Ref-ID': `welcome-${data.user?.id ?? email}`,
          'Auto-Submitted': 'auto-generated',
        },
      });
    } catch (err) {
      console.error('[register] welcome email error:', err);
    }
  });

  return NextResponse.json({
    user: { name, email: data.user.email },
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
}
