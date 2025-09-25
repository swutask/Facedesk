// functions/get-payment-methods/index.ts
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
    const { customer_id } = await req.json();

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: "customer_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer_id,
      type: "card",
    });

    // Get default payment method from customer
    const customer = await stripe.customers.retrieve(customer_id);
    const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method;

    // Format payment methods with is_default flag
    const formattedPaymentMethods = paymentMethods.data.map((method) => ({
      id: method.id,
      brand: method.card?.brand || "unknown",
      last4: method.card?.last4 || "****",
      exp_month: method.card?.exp_month || 0,
      exp_year: method.card?.exp_year || 0,
      is_default: method.id === defaultPaymentMethodId,
    }));

    return new Response(
      JSON.stringify({ paymentMethods: formattedPaymentMethods }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error getting payment methods:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});