import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireApiRole } from '@/lib/auth-server';
import { serviceDatabaseConfigured } from '@/lib/supabase-config';
import { serviceWrite } from '@/lib/supabase-rest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(request, 'ADMIN');
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const payload = await request.json().catch(() => ({}));
  const to = String(payload.to || '').trim();
  const subject = String(payload.subject || '').trim();
  const message = String(payload.body || '').trim();
  if (!to || !/^\S+@\S+\.\S+$/.test(to)) return NextResponse.json({ error: 'Nincs érvényes gyártói e-mail-cím.' }, { status: 400 });
  if (!subject || !message) return NextResponse.json({ error: 'A tárgy és a levél szövege kötelező.' }, { status: 400 });

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.MAIL_FROM_EMAIL || user;
  if (!host || !user || !pass || !fromEmail) {
    return NextResponse.json({ error: 'Az SMTP nincs beállítva. Töltsd ki az SMTP_* és MAIL_FROM_EMAIL környezeti változókat.' }, { status: 503 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: { user, pass },
    });
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'BulkPact'}" <${fromEmail}>`,
      to,
      subject,
      text: message,
      replyTo: fromEmail,
    });

    if (serviceDatabaseConfigured()) {
      await serviceWrite('email_messages', {
        method: 'POST',
        body: JSON.stringify({
          recipient: to,
          subject,
          body: message,
          message_id: info.messageId || null,
          status: 'SENT',
          sent_by: auth.session.user.id,
        }),
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'A levél küldése sikertelen.' }, { status: 500 });
  }
}
