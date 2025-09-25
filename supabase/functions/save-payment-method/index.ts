// functions/save-payment-method/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@16.8.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

// Initialize Stripe
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { customer_id, payment_method_id, is_default = false } = await req.json();

    if (!customer_id || !payment_method_id) {
      return new Response(
        JSON.stringify({ error: "customer_id and payment_method_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: customer_id,
    });

    // Set as default if requested
    if (is_default) {
      await stripe.customers.update(customer_id, {
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error saving payment method:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});