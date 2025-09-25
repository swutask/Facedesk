// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import Stripe from "npm:stripe@16.8.0";

/* ---------- Env ---------- */
const SUPABASE_URL =
  Deno.env.get("SB_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE =
  Deno.env.get("SB_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const APP_PUBLIC_URL = Deno.env.get("APP_PUBLIC_URL") ?? "http://localhost:5173";

const stripe = STRIPE_KEY
  ? new Stripe(STRIPE_KEY, { apiVersion: "2024-06-20" })
  : (null as unknown as Stripe);
const supabase = (SUPABASE_URL && SERVICE_ROLE)
  ? createClient(SUPABASE_URL, SERVICE_ROLE)
  : (null as any);

/* ---------- CORS helpers ---------- */
function corsBase(req: Request) {
  const origin = req.headers.get("origin") ?? "*";
  const acrh =
    req.headers.get("access-control-request-headers") ??
    "authorization,content-type,apikey,x-client-info,prefer,x-supabase-authorization";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": acrh,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin, Access-Control-Request-Headers",
  };
}
function jsonHeaders(base: Record<string, string>) {
  return { ...base, "Content-Type": "application/json" };
}

/* ---------- Server ---------- */
serve(async (req) => {
  const base = corsBase(req);

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: base });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders(base),
    });
  }

  // Misconfig guard
  if (!SUPABASE_URL || !SERVICE_ROLE || !STRIPE_KEY || !supabase || !stripe) {
    console.error("Missing required envs", {
      hasSUPABASE_URL: !!SUPABASE_URL,
      hasSERVICE_ROLE: !!SERVICE_ROLE,
      hasSTRIPE_KEY: !!STRIPE_KEY,
    });
    return new Response(
      JSON.stringify({ error: "Server misconfigured: missing env vars" }),
      { status: 500, headers: jsonHeaders(base) },
    );
  }

  // Parse body
  let provider_user_id: string | undefined;
  try {
    const body = await req.json();
    provider_user_id = body?.provider_user_id;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: jsonHeaders(base),
    });
  }
  if (!provider_user_id) {
    return new Response(JSON.stringify({ error: "provider_user_id required" }), {
      status: 400,
      headers: jsonHeaders(base),
    });
  }

  try {
    // Fetch provider profile
    const { data: profile, error: profErr } = await supabase
      .from("user_profiles")
      .select("id, email, stripe_account_id, stripe_details_submitted")
      .eq("id", provider_user_id)
      .single();

    if (profErr || !profile) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 404,
        headers: jsonHeaders(base),
      });
    }

    let accountId = profile.stripe_account_id as string | null;
    let detailsSubmitted = !!profile.stripe_details_submitted;

    // Create Stripe account if missing
    if (!accountId) {
      const acct = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: profile.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });
      accountId = acct.id;
      detailsSubmitted = !!acct.details_submitted;



      const { error: upErr } = await supabase
        .from("user_profiles")
        .update({
          stripe_account_id: accountId,
          stripe_details_submitted: detailsSubmitted,
        })
        .eq("id", provider_user_id);
      if (upErr) throw upErr;
    } else {
      // Refresh status from Stripe
      try {
        const acct = await stripe.accounts.retrieve(accountId);
        
        console.log("cap",acct.capabilities)
        const nowSubmitted = !!acct.details_submitted;
        if (nowSubmitted !== detailsSubmitted) {
          detailsSubmitted = nowSubmitted;
          const { error: upErr } = await supabase
            .from("user_profiles")
            .update({ stripe_details_submitted: detailsSubmitted })
            .eq("id", provider_user_id);
          if (upErr) throw upErr;
        }
      } catch (err) {
        console.warn("Stripe retrieve failed for account:", accountId, err);
      }
    }

    // Build links
    let onboardingUrl: string | null = null;
    let loginUrl: string | null = null;

    if (!detailsSubmitted) {
      const link = await stripe.accountLinks.create({
        account: accountId!,
        refresh_url: `${APP_PUBLIC_URL}/provider/earnings?refresh=1`,
        return_url: `${APP_PUBLIC_URL}/provider/earnings?return=1`,
        type: "account_onboarding",
      });
      onboardingUrl = link.url;
    } else {
      // Only after onboarding can we create a login link
      try {
        const login = await stripe.accounts.createLoginLink(accountId!);
        loginUrl = login.url;
      } catch {
        loginUrl = null;
      }
    }

    // Best-effort mirror to rooms
    try {
      await supabase
        .from("rooms")
        .update({ provider_stripe_account_id: accountId })
        .eq("user_id", provider_user_id);
    } catch {
      // ignore
    }

    const acct = await stripe.accounts.retrieve(accountId);

    return new Response(
      JSON.stringify({
        stripe_account_id: accountId,
        stripe_details_submitted: detailsSubmitted,
        onboarding_url: onboardingUrl,
        login_url: loginUrl,
        card_payments: acct.capabilities.card_payments, 
  
      }),
      { status: 200, headers: jsonHeaders(base) },
    );
  } catch (e) {
    console.error("ensure-connected-account error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: jsonHeaders(base),
    });
  }
});



  