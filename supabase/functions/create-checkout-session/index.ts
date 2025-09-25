// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.8.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

// Fallback so Stripe always gets valid URLs in local dev
const APP_PUBLIC_URL =
  Deno.env.get("APP_PUBLIC_URL") ?? "http://localhost:5173";

/** Helper: safe integer (paise) from rupees number */
function toPaise(amountInRupees: number): number {
  return Math.round(
    (Number.isFinite(amountInRupees) ? amountInRupees : 0) * 100
  );
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await req.json();

    const {
      full_name,
      email_address,
      government_id_type,
      government_id_number,
      interview_date,
      interview_time,
      duration, // e.g. "2" or "2 hours" — we parse
      room_id,
      special_requests,
      custom_note,
      hourlyRate, // rupees
      companyUserId,
      userIdOfLoggedIn,
      customer_id,
      payment_method_id,
      // NEW (optional): tell server whether you used a saved PM (off_session)
      using_saved_pm = true,
      // discount rupees applied ONLY to platform fee
      discount = 0,
    } = body;

    if (!room_id) {
      return new Response(JSON.stringify({ error: "room_id is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Fetch the provider's connected account ID for this room
    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .select("id, user_id, room_name, provider_stripe_account_id")
      .eq("id", room_id)
      .single();

    if (roomErr || !room) {
      console.error("Room lookup failed:", roomErr);
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // If not mirrored on the room, fall back to user_profiles
    let destinationAccount: string | null =
      (room.provider_stripe_account_id as string | null) ?? null;

    if (!destinationAccount) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("stripe_account_id")
        .eq("id", room.user_id)
        .single();
      destinationAccount = profile?.stripe_account_id ?? null;
    }

    console.log("dsaf", destinationAccount);

    // Calculate pricing (rupees → paise)
    const hours = parseInt(String(duration), 10) || 1;
    const rateRupees = Number(hourlyRate || 0);

    if (!rateRupees || rateRupees <= 0) {
      return new Response(
        JSON.stringify({ error: "hourlyRate missing/invalid" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Room subtotal (for provider)
    const roomSubtotalRupees = rateRupees * hours;

    // Platform fee (customer pays this on top of room)
    const platformFeeRupees = Math.max(
      Math.round(roomSubtotalRupees * 0.05),
      1
    );

    // Discount applies ONLY to platform fee
    const discountRupees = Math.max(Number(discount) || 0, 0);

    // Convert to paise
    const roomSubtotalPaise = toPaise(roomSubtotalRupees);
    const platformFeePaise = toPaise(platformFeeRupees);
    const discountPaise = toPaise(discountRupees);

    // The amount the customer pays = room + (platform fee - discount)
    const amountCustomerPaysPaise =
      roomSubtotalPaise + platformFeePaise - discountPaise;

    // Build PaymentIntent params
    const paymentIntentParams: any = {
      amount: amountCustomerPaysPaise,
      currency: "inr",
      customer: customer_id,
      payment_method: payment_method_id,
      confirm: true,

      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      // If it's a saved PM, we can attempt off_session. For a new card, keep on_session.
      off_session: !!using_saved_pm,
      metadata: {
        candidateName: full_name ?? "",
        candidateEmail: email_address ?? "",
        idType: government_id_type ?? "",
        idNumber: government_id_number ?? "",
        date: interview_date ?? "",
        time: interview_time ?? "",
        durationHours: String(hours),
        roomId: String(room_id),
        special_requests: (special_requests ?? "").slice(0, 500),
        custom_note: (custom_note ?? "").slice(0, 500),
        room_subtotal_rupees: String(roomSubtotalRupees),
        platform_fee_rupees: String(platformFeeRupees),
        discount_rupees: String(discountRupees),
        provider_account_id: destinationAccount ?? "",
        companyUserId: companyUserId ?? "",
        userIdOfLoggedIn: userIdOfLoggedIn ?? "",
      },
    };

    console.log("This is the payment intent params", paymentIntentParams);
    // Destination & application fee for Connect (destination charge)
    if (destinationAccount) {
      paymentIntentParams.application_fee_amount = amountCustomerPaysPaise; // <- after discount!
      paymentIntentParams.transfer_data = { destination: destinationAccount };
    }

    console.log("no error");

    const pi = await stripe.paymentIntents.create(paymentIntentParams);

    // Handle SCA if needed
    if (
      pi.status === "requires_action" &&
      pi.next_action?.type === "use_stripe_sdk"
    ) {
      return new Response(
        JSON.stringify({
          requires_action: true,
          client_secret: pi.client_secret,
          payment_intent_id: pi.id,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 200,
        }
      );
    }

    // ------------------------  ADDED: create a mirror Invoice  ------------------------
    // Only after a successful charge, create an Invoice record with same amounts and mark it paid
    let invoiceInfo: any = null;
    if (pi.status === "succeeded") {
      try {
        // 1) Create invoice items (what the customer sees on the invoice)
        await stripe.invoiceItems.create(
          {
            customer: customer_id,
            currency: "inr",
            amount: roomSubtotalPaise,
            description: `Room booking — ${
              room.room_name ?? room_id
            } (x${hours}h)`,
            metadata: {
              room_id: String(room_id),
              hours: String(hours),
              origin_pi: pi.id,
            },
          },
          { idempotencyKey: `ii_room_${pi.id}` }
        );

        // 2) Platform fee (full, before discount)
        await stripe.invoiceItems.create(
          {
            customer: customer_id,
            currency: "inr",
            amount: platformFeePaise,
            description: "Platform fee",
            metadata: { origin_pi: pi.id },
          },
          { idempotencyKey: `ii_fee_${pi.id}` }
        );

        // 3) Discount as negative line item (if any)
        if (discountPaise > 0) {
          await stripe.invoiceItems.create(
            {
              customer: customer_id,
              currency: "inr",
              amount: -discountPaise, // 👈 negative amount subtracts
              description: `Discount (₹${discountRupees})`,
              metadata: { origin_pi: pi.id },
            },
            { idempotencyKey: `ii_discount_${pi.id}` }
          );
        } // 2) Create the invoice (no extra charge – we'll mark paid out-of-band)
        const inv = await stripe.invoices.create(
          {
            customer: customer_id,
            collection_method: "send_invoice", // we will mark paid immediately
            days_until_due: 0,
            auto_advance: true,
            pending_invoice_items_behavior: "include",
            ...(destinationAccount ? { on_behalf_of: destinationAccount } : {}),
            metadata: {
              origin_pi: pi.id,
              candidateName: full_name ?? "",
              candidateEmail: email_address ?? "",
              idType: government_id_type ?? "",
              idNumber: government_id_number ?? "",
              date: interview_date ?? "",
              time: interview_time ?? "",
              room_subtotal_rupees: String(amountCustomerPaysPaise),
              discount_rupees: String(discountRupees),
              provider_account_id: destinationAccount ?? "",
              companyUserId: companyUserId ?? "",
              userIdOfLoggedIn: userIdOfLoggedIn ?? "",
            },
          },
          { idempotencyKey: `inv_${pi.id}` }
        );

        // 3) Finalize the invoice to generate the PDF + hosted URL
        const finalized = await stripe.invoices.finalizeInvoice(inv.id, {
          idempotencyKey: `inv_finalize_${pi.id}`,
        });

        // 4) Mark as paid (no new charge) to reflect your already-captured PaymentIntent
        const paid = await stripe.invoices.pay(
          finalized.id,
          { paid_out_of_band: true },
          { idempotencyKey: `inv_pay_oob_${pi.id}` }
        );

        invoiceInfo = {
          invoice_id: paid.id,
          invoice_number: paid.number,
          hosted_invoice_url: paid.hosted_invoice_url,
          invoice_pdf: paid.invoice_pdf,
          status: paid.status,
        };

        // Optional: store invoice id back on the PI (handy for debugging/reporting)
        try {
          await stripe.paymentIntents.update(pi.id, {
            metadata: { ...(pi.metadata || {}), invoice_id: paid.id },
          });
        } catch (_) {}
      } catch (e) {
        console.error("Mirror invoice creation failed for PI:", pi.id, e);
        // Do not fail the request; payment already succeeded.
      }
    }
    // ----------------------  END ADDED: create a mirror Invoice  ----------------------

    // Succeeded immediately
    return new Response(
      JSON.stringify({
        success: pi.status === "succeeded",
        payment_intent_id: pi.id,
        client_secret: pi.client_secret,
        // ADDED: expose invoice (if created)
        invoice_id: invoiceInfo?.invoice_id ?? null,
        invoice_number: invoiceInfo?.invoice_number ?? null,
        hosted_invoice_url: invoiceInfo?.hosted_invoice_url ?? null,
        invoice_pdf: invoiceInfo?.invoice_pdf ?? null,
        invoice_status: invoiceInfo?.status ?? null,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 200,
      }
    );
  } catch (err) {
    console.error("❌ create-payment-intent error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
