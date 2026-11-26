import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const access = await getAdminClient();
  if (access.response) return access.response;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    throw error;
  }

  const recipient = typeof body?.to === "string" ? body.to.trim() : "";
  if (recipient.length > 254 || !emailPattern.test(recipient)) {
    return NextResponse.json({ error: "Enter a valid recipient email address." }, { status: 400 });
  }

  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const username = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const sender = process.env.SMTP_FROM?.trim() || username;
  const senderName = process.env.SMTP_SENDER_NAME?.trim() || "PT Outjourney";
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !username || !password || !sender) {
    return NextResponse.json(
      { error: "Email is not configured. Set the server-side SMTP environment variables and redeploy." },
      { status: 503 },
    );
  }
  if (!emailPattern.test(sender)) {
    return NextResponse.json({ error: "The configured SMTP sender address is invalid." }, { status: 503 });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: username, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  try {
    await transporter.verify();
    const result = await transporter.sendMail({
      from: { name: senderName, address: sender },
      to: recipient,
      subject: "Outjourney email configuration test",
      text: "This test email confirms that Outjourney can send email using its configured SMTP server.",
    });
    return NextResponse.json({ sent: true, to: recipient, messageId: result.messageId });
  } catch (error) {
    console.error("Outjourney SMTP test failed.", error);
    return NextResponse.json(
      { error: "The SMTP server could not verify or deliver the test email. Check the server-side SMTP settings." },
      { status: 502 },
    );
  } finally {
    transporter.close();
  }
}
