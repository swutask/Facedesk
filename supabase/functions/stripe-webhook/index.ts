// deno-lint-ignore-file no-explicit-any
import Stripe from "npm:stripe@16.8.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";
import { Resend } from "npm:resend@3.2.0";
import { CandidateConfirmation } from "../../emails/CandidateConfirmation.tsx";
import { EnterpriseBookingConfirmation } from "../../emails/EnterpriseBookingConfirmation.tsx";
import { SpaceProviderNotification } from "../../emails/SpaceProviderNotification.tsx";
import { CandidateOTP } from "../../emails/CandidateOTP.tsx";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20"
});
const supabase = createClient(Deno.env.get("SB_URL"), Deno.env.get("SB_SERVICE_ROLE_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
// Utility: Format duration
const formatDuration = (hours)=>hours === 1 ? `${hours} hr` : `${hours} hrs`;
// Utility: Send email with Resend
const sendEmail = async (to, subject, html)=>{
  try {
    await resend.emails.send({
      from: "FaceDesk <no-reply@updates.facedesk.co>",
      to,
      subject,
      html
    });
  } catch (err) {
    console.error(`❌ Error sending email to ${to}:`, err);
  }
};
serve(async (req)=>{
  if (req.method !== "POST") return new Response("Method not allowed", {
    status: 405
  });
  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return new Response("Bad signature", {
        status: 400
      });
    }
    console.log(`✅ Received event type: ${event.type}`);
    // Handle checkout.session.completed (optional logging)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Checkout session completed:", session.id);
    }
    // Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      // Expand charges for transfer data
      const fullPi = await stripe.paymentIntents.retrieve(pi.id, {
        expand: [
          "charges.data.balance_transaction",
          "charges.data.transfer_data"
        ]
      });
      const md = fullPi.metadata ?? {};
      console.log("✅ PaymentIntent succeeded. Metadata:", md);
      const amountRupees = (fullPi.amount || 0) / 100;
      const applicationFeeRupees = (fullPi.application_fee_amount || 0) / 100;
      const providerGross = Math.max(amountRupees - applicationFeeRupees, 0);
      // Determine destination account
      let destinationAccount = fullPi.transfer_data?.destination || md.provider_account_id;
      if (!destinationAccount) {
        const ch = fullPi.charges?.data?.[0];
        destinationAccount = ch?.transfer_data?.destination || destinationAccount;
      }
      if (!destinationAccount) console.error("❌ Missing destination account on PI:", fullPi.id);
      // Generate OTP valid for 15 minutes after interview start
// Generate OTP valid for 15 minutes after interview start
const otp = String(Math.floor(100000 + Math.random() * 900000));
const isoTime = md.time?.length === 5 ? `${md.time}:00` : md.time;
const interviewStart = new Date(`${md.date}T${isoTime}`);

// OTP expiry for DB (ISO string)
const otpExpiry = new Date(interviewStart.getTime() + 15 * 60 * 1000).toISOString();

// OTP expiry formatted for email (human-readable)
const otpExpiryFormatted = new Date(interviewStart.getTime() + 15 * 60 * 1000).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

// Insert candidate
const insertPayload = {
  full_name: md.candidateName,
  email_address: md.candidateEmail,
  government_id_type: md.idType,
  government_id_number: md.idNumber,
  interview_date: md.date,
  interview_time: md.time,
  duration: parseInt(md.durationHours || "1") || 1,
  room_id: md.roomId ?? null,
  special_requests: md.special_requests,
  custom_note: md.custom_note,
  otp,
  otp_expiry: otpExpiry, // store ISO in DB
  company_user_id: md.userIdOfLoggedIn,
  platform_fee: applicationFeeRupees,
  provider_gross: providerGross,
  stripe_account_id: destinationAccount,
  stripe_session_id: null,
  stripe_payment_intent_id: fullPi.id,
  price: amountRupees
};

const { data: inserted, error: insertErr } = await supabase
  .from("candidates")
  .insert(insertPayload)
  .select("*")
  .single();

if (insertErr) {
  console.error("❌ DB insert error:", insertErr);
  return new Response("Insert failed", { status: 200 });
}

console.log("✅ Candidate inserted:", inserted);

// Fetch room info if exists
let room = null;
if (md.roomId) {
  const { data: roomData, error: roomError } = await supabase
    .from("rooms")
    .select("user_id, room_name")
    .eq("id", md.roomId)
    .single();
  if (roomError) console.error("❌ Could not fetch room:", roomError);
  else room = roomData;
}

// --- Send candidate emails ---
if (md.candidateEmail) {
  await sendEmail(md.candidateEmail, "Your OTP for Interview Check-In", CandidateOTP({
    candidateName: md.candidateName,
    otp,
    otpExpiry: otpExpiryFormatted // send human-readable expiry
  }));

  await sendEmail(md.candidateEmail, "Your Interview is Confirmed", CandidateConfirmation({
    custom_note: md.custom_note,
    fullName: md.candidateName,
    roomName: room?.room_name ?? "Interview Room",
    date: md.date,
    time: md.time
  }));

  console.log("✅ Candidate emails sent.");
}
      // --- Enterprise Booking Confirmation ---
      console.log("userid", md.userIdOfLoggedIn);
      
      // --- Enterprise Booking Confirmation ---
if (md.userIdOfLoggedIn) {
  // Fetch enterprise preferences
  const { data: enterprisePrefData, error: prefErr } = await supabase
    .from("user_preferences")
    .select("booking_confirmations")
    .eq("user_id", md.userIdOfLoggedIn)
    .maybeSingle();

  if (prefErr) console.error("❌ Error fetching enterprise preferences:", prefErr);
  else if (enterprisePrefData?.booking_confirmations === true) {
    // Fetch enterprise user details
    const { data: enterpriseUserData, error: userErr } = await supabase
      .from("user_profiles")
      .select("email, first_name")
      .eq("id", md.userIdOfLoggedIn)
      .maybeSingle();

    if (!userErr && enterpriseUserData?.email) {
      const durationText = formatDuration(inserted.duration);
      const firstNameToUse = enterpriseUserData.first_name || "there";

      // Enterprise total price = candidate.price + platform_fee
      const enterpriseTotalPrice = Number(inserted.price || 0) + Number(inserted.platform_fee || 0);

      await sendEmail(
        enterpriseUserData.email,
        `Booking Confirmed – ${inserted.full_name}`,
        EnterpriseBookingConfirmation({
          booking: {
            candidateName: inserted.full_name,
            date: inserted.interview_date,
            time: inserted.interview_time,
            duration: durationText,
            totalAmount: enterpriseTotalPrice,
          },
          platform_fee: inserted.platform_fee,
          roomName: room?.room_name ?? "Interview Room",
          firstName: firstNameToUse,
        })
      );
      console.log("✅ Enterprise booking email sent with total price:", enterpriseTotalPrice);
    }
  } else console.log("ℹ️ Enterprise booking confirmations OFF. Email skipped.");
}

// --- Space Provider Alert ---
if (room?.user_id) {
  const { data: providerPref } = await supabase
    .from("user_preferences")
    .select("booking_confirmations")
    .eq("user_id", room.user_id)
    .maybeSingle();

  if (providerPref?.booking_confirmations === true) {
    const { data: provider } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("id", room.user_id)
      .maybeSingle();

    if (provider?.email) {
      const providerPrice = Number(room?.pricing?.hourlyRate || 0) * Number(inserted.duration || 1);
      await sendEmail(
        provider.email,
        `New Booking: ${room.room_name}`,
        SpaceProviderNotification({
          candidateName: inserted.full_name,
          room,
          price: providerPrice,
        })
      );
      console.log("✅ Space provider email sent with price:", providerPrice);
    }
  } else console.log("Provider booking confirmations are OFF. Email skipped.");
}
    }
    // Handle payment failure
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object;
      console.warn("❌ Payment failed:", pi.last_payment_error?.message);
    }
    return new Response("OK", {
      status: 200
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Server error", {
      status: 500
    });
  }
});
