// supabase/functions/provider-payouts/index.ts
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

// ---- Add this reusable CORS header block ----
const corsHeaders = (origin: string | null) => ({
  // Use caller origin if present, else *
  "Access-Control-Allow-Origin": origin ?? "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // Supabase client sends these automatically:
  // - authorization (Bearer <JWT>)
  // - apikey (<anon key>)
  // - x-client-info (sdk/version)
  // plus content-type
  "Access-Control-Allow-Headers":
    "authorization, apikey, x-client-info, content-type",
  "Access-Control-Max-Age": "86400",
});

serve(async (req) => {
  const origin = req.headers.get("Origin");

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders(origin) } });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeaders(origin) },
    });
  }

  try {
    const { provider_user_id } = await req.json();
    if (!provider_user_id) {
      return new Response(JSON.stringify({ error: "provider_user_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("stripe_account_id, stripe_details_submitted")
      .eq("id", provider_user_id)
      .single();

    if (error || !profile?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Stripe not connected for this provider" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }

    const accountId = profile.stripe_account_id as string;

    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    const payoutsRes = await stripe.payouts.list({ limit: 10 }, { stripeAccount: accountId });
    const account = await stripe.accounts.retrieve(accountId);

    const payouts = payoutsRes.data.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      arrival_date: p.arrival_date,
      created: p.created,
      description: p.description ?? null,
      method: p.method ?? null,
      type: p.type ?? null,
    }));

    const schedule = account.settings?.payouts?.schedule ?? null;

    return new Response(
      JSON.stringify({
        account_id: accountId,
        details_submitted: !!profile.stripe_details_submitted,
        balance,
        payouts,
        schedule,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
    );
  } catch (e) {
    console.error("provider-payouts error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
});
