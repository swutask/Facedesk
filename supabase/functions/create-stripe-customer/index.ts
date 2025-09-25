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

// CORS Headers for allowing cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins or you can specify the origin if required
  "Access-Control-Allow-Methods": "POST, OPTIONS", // Allow POST and OPTIONS methods
  "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow specific headers
};

serve(async (req) => {
  // Handle preflight CORS request (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Handle POST request (creating Stripe customer)
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    console.log("📬 Request received to create Stripe customer");
    const { provider_id, email } = await req.json();

    const { data: providerData, error } = await supabase
      .from("user_profiles")
      .select("id, stripe_customer_id")
      .eq("id", provider_id)
      .single();

    if (error || !providerData) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    let customer_id = providerData.stripe_customer_id;

    console.log("Existing customer ID:", customer_id);
    if (!customer_id) {
      const customer = await stripe.customers.create({
        email: email,
      });
      
      customer_id= customer.id;

      const methods = await stripe.paymentMethods.list({
        customer: customer_id,
        type: "card",
      });

      for (const pm of methods.data) {
        console.log("Before:", pm.id, pm.allow_redisplay);
        await stripe.paymentMethods.update(pm.id, {
          allow_redisplay: "always",
        });
        console.log("Updated:", pm.id, pm.allow_redisplay);
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", provider_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Error updating customer ID" }),
          { status: 500, headers: corsHeaders }
        );
      }

      customer_id = customer.id;
    }

    console.log("✅ Stripe customer ID:", customer_id);

    return new Response(JSON.stringify({ customer_id }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("❌ Error creating Stripe customer:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
