import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }

  const { data: booking, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id, service_name, dog_name, datetime, status')
    .eq('id', id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ message: 'Already cancelled' }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('Cancel update error:', updateError);
    return NextResponse.json({ message: 'Failed to cancel booking' }, { status: 500 });
  }

  const parsedDate = new Date(booking.datetime);
  const formattedDate = isNaN(parsedDate.getTime())
    ? booking.datetime
    : parsedDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0f0d09; color: #F5CBA7; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: white; letter-spacing: -0.5px;">Booking Cancelled</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 14px;">ProjectPaw</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-family: sans-serif; font-size: 15px; color: #F5CBA7; margin: 0 0 24px;">
          Your booking for <strong>${booking.dog_name}</strong> has been cancelled.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55); width: 40%;">Service</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${booking.service_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Dog</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(245,203,167,0.1); font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${booking.dog_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.55);">Date & Time</td>
            <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #F5CBA7; font-weight: bold;">${formattedDate}</td>
          </tr>
        </table>
        <p style="margin: 32px 0 0; font-family: sans-serif; font-size: 13px; color: rgba(245,203,167,0.45); text-align: center;">
          Want to rebook? Visit your dashboard anytime.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ProjectPaw" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Booking Cancelled — ${booking.service_name} for ${booking.dog_name}`,
      html,
    });
  } catch (err) {
    console.error('Cancellation email error:', err);
    // Non-blocking — DB already updated, just log
  }

  return NextResponse.json({ success: true });
}
