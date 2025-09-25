// deno-lint-ignore-file no-explicit-any
import Stripe from "npm:stripe@16.8.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";
import { Resend } from "npm:resend@3.2.0";
import { CandidateConfirmation } from "../../emails/CandidateConfirmation.tsx";
import { EnterpriseBookingConfirmation } from "../../emails/EnterpriseBookingConfirmation.tsx";
import { SpaceProviderNotification } from "../../emails/SpaceProviderNotification.tsx";
import { CandidateOTP } from "../../emails/CandidateOTP.tsx";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
const supabase = createClient(Deno.env.get("SB_URL"), Deno.env.get("SB_SERVICE_ROLE_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return new Response("Bad signature", { status: 400 });
    }

    console.log(`✅ Received event type: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      console.log("Checkout session completed:", event.data.object.id);
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const fullPi = await stripe.paymentIntents.retrieve(pi.id, {
        expand: ["charges.data.balance_transaction", "charges.data.transfer_data"],
      });

      const md = fullPi.metadata ?? {};
      const amountRupees = (fullPi.amount || 0) / 100;
      const applicationFeeRupees = (fullPi.application_fee_amount || 0) / 100;
      const destinationAccount = fullPi.transfer_data?.destination || md.provider_account_id || fullPi.charges?.data?.[0]?.transfer_data?.destination;

      const providerGross = Math.max(amountRupees - applicationFeeRupees, 0);
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const isoTime = md.time?.length === 5 ? `${md.time}:00` : md.time;
      const interviewStart = new Date(`${md.date}T${isoTime}`);
      const otpExpiry = new Date(interviewStart.getTime() + 15 * 60 * 1000).toISOString();

      // Insert candidate
      const insertPayload = {
        full_name: md.candidateName,
        email_address: md.candidateEmail,
        government_id_type: md.idType,
        government_id_number: md.idNumber,
        interview_date: md.date,
        interview_time: md.time,
        duration: `${parseInt(md.durationHours || "1") || 1} hours`,
        room_id: md.roomId ?? null,
        special_requests: md.special_requests,
        custom_note: md.custom_note,
        otp,
        otp_expiry: otpExpiry,
        company_user_id: md.userIdOfLoggedIn,
        platform_fee: applicationFeeRupees,
        provider_gross: providerGross,
        stripe_account_id: destinationAccount,
        stripe_session_id: null,
        stripe_payment_intent_id: fullPi.id,
        price: amountRupees,
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

      console.log("✅ Candidate inserted with OTP:", inserted);

      // --- Send Emails ---
      try {
        if (md.candidateEmail) {
          // 1️⃣ Candidate OTP
          await resend.emails.send({
            from: "FaceDesk <no-reply@updates.facedesk.co>",
            to: md.candidateEmail,
            subject: "Your OTP for Interview Check-In",
            html: CandidateOTP({ candidateName: md.candidateName, otp, otpExpiry }),
          });
        }

        // 2️⃣ Fetch room info safely
        let room = null;
        if (md.roomId) {
          const { data: roomData, error: roomError } = await supabase
            .from("rooms")
            .select("user_id, room_name")
            .eq("id", md.roomId)
            .single();

          if (roomError) console.error("❌ Error fetching room:", roomError);
          else room = roomData;
        }

        // 3️⃣ Candidate confirmation email
        if (md.candidateEmail && room) {
          await resend.emails.send({
            from: "FaceDesk <no-reply@updates.facedesk.co>",
            to: md.candidateEmail,
            subject: "Your Interview is Confirmed",
            html: CandidateConfirmation({
              custom_note: md.custom_note,
              fullName: md.candidateName,
              roomName: room?.room_name ?? "Interview Room",
              date: md.date,
              time: md.time,
            }),
          });
          console.log("✅ Candidate confirmation email sent.");
        }

        // 4️⃣ Enterprise Booking Receipt
        if (md.companyUserId) {
          const { data: enterprisePref } = await supabase
            .from("user_preferences")
            .select("booking_confirmations")
            .eq("user_id", md.companyUserId)
            .single();

          if (enterprisePref?.booking_confirmations) {
            await resend.emails.send({
              from: "FaceDesk <billing@updates.facedesk.co>",
              to: md.companyUserId,
              subject: `Booking Confirmed – ${md.candidateName}`,
              html: EnterpriseBookingConfirmation({
                booking: md,
                platform_fee: applicationFeeRupees,
                provider_gross: providerGross,
              }),
            });
            console.log("✅ Enterprise booking receipt sent.");
          } else console.log("Enterprise booking confirmations are OFF.");
        }

        // 5️⃣ Space Provider Alert
        if (room?.user_id) {
          const { data: providerPref, error: providerPrefError } = await supabase
            .from("user_preferences")
            .select("booking_confirmations")
            .eq("user_id", room.user_id)
            .single();

          if (providerPrefError) console.error("❌ Error fetching provider preferences:", providerPrefError);
          else if (providerPref?.booking_confirmations) {
            const { data: provider, error: providerError } = await supabase
              .from("user_profiles")
              .select("email")
              .eq("id", room.user_id)
              .single();

            if (!provider?.email || providerError) console.error("❌ Could not fetch provider email");
            else {
              await resend.emails.send({
                from: "FaceDesk <alerts@updates.facedesk.co>",
                to: provider.email,
                subject: `New Booking: ${room.room_name}`,
                html: SpaceProviderNotification({ candidateName: md.candidateName, room }),
              });
              console.log("✅ Space provider alert email sent.");
            }
          } else console.log("Provider booking confirmations are OFF.");
        }
      } catch (mailErr) {
        console.error("❌ Email sending error:", mailErr);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      console.warn("Payment failed:", event.data.object.last_payment_error?.message);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Server error", { status: 500 });
  }
});
