// supabase/functions/send-email/index.js
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // you can replace * with your domain later
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const response = await resend.emails.send({
      from: "FaceDesk <no-reply@updates.facedesk.co>",
      to,
      subject,
      html,
    });

    return new Response(
      JSON.stringify({ success: true, response }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Error sending email:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
