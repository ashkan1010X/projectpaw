import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase-admin';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function buildResetHtml(resetUrl: string) {
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #B2A4FF, #A67C52); padding: 32px; text-align: center;">
        <p style="margin: 0 0 8px; font-family: sans-serif; font-size: 28px;">🐾</p>
        <h1 style="margin: 0; font-size: 24px; color: white; letter-spacing: -0.5px; font-family: sans-serif;">Reset your password</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.75); font-family: sans-serif; font-size: 14px;">ProjectPaw</p>
      </div>
      <div style="padding: 36px 32px;">
        <p style="font-family: sans-serif; font-size: 15px; color: #F5CBA7; margin: 0 0 8px; line-height: 1.6;">
          We received a request to reset the password for your ProjectPaw account.
        </p>
        <p style="font-family: sans-serif; font-size: 15px; color: rgba(245,203,167,0.65); margin: 0 0 32px; line-height: 1.6;">
          Click the button below to choose a new password. This link expires in&nbsp;<strong style="color:#F5CBA7;">1&nbsp;hour</strong>.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a
            href="${resetUrl}"
            style="display: inline-block; background: linear-gradient(135deg, #B2A4FF, #8b7dff); color: white; font-family: sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; letter-spacing: 0.02em;"
          >
            Reset Password →
          </a>
        </div>
        <div style="border-top: 1px solid rgba(245,203,167,0.1); padding-top: 24px;">
          <p style="font-family: sans-serif; font-size: 12px; color: rgba(245,203,167,0.4); margin: 0 0 8px; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email — your password won't change.
          </p>
          <p style="font-family: sans-serif; font-size: 12px; color: rgba(245,203,167,0.35); margin: 0; line-height: 1.6;">
            Having trouble with the button? Copy and paste this link into your browser:<br/>
            <span style="color: rgba(245,203,167,0.5); word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
  }

  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://projectpaw.vercel.app';

  // Always return success — prevents account enumeration (OWASP)
  const successResponse = NextResponse.json({
    message: "If an account exists for that email, we've sent a reset link.",
  });

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${origin}/reset-password` },
    });

    if (error || !data?.properties?.action_link) {
      // No account for this email — silently return success
      return successResponse;
    }

    const resetUrl = data.properties.action_link;

    await transporter.sendMail({
      from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your ProjectPaw password',
      html: buildResetHtml(resetUrl),
    });
  } catch (err) {
    console.error('Password reset email error:', err);
    // Still return success to prevent enumeration
  }

  return successResponse;
}
