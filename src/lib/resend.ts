import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Wrapper function for sending emails via Resend.
 * 
 * @param to - Recipient email (string or string[])
 * @param subject - Subject line for the email
 * @param react - React email template component
 * @param from - Optional "from" address (defaults to .env RESEND_FROM_EMAIL)
 */
export async function sendMail({
  to,
  subject,
  react,
  from = process.env.RESEND_FROM_EMAIL || "FaceDesk <no-reply@updates.facedesk.co>",
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    console.log("Email sent:", data?.id || data);
    return data;
  } catch (error: any) {
    console.error("Resend email error:", error);
    throw new Error(error.message || "Failed to send email");
  }
}
