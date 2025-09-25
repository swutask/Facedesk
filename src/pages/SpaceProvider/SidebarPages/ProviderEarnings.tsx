import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/clerk-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DollarSign } from "lucide-react";
import { TrendingUp } from "lucide-react";
import { Calendar } from "lucide-react";
import { CreditCard } from "lucide-react";

import { useSupabase } from "@/context/supabaseContext";

import { startOfMonth } from "date-fns";
import { endOfMonth } from "date-fns";
import { subMonths } from "date-fns";

/**
 * Types
 */
type StripeInfo = {
  stripe_account_id?: string;
  stripe_details_submitted?: boolean;
  onboarding_url?: string | null;
  login_url?: string | null;
  error?: string;
};

type CandidateRow = {
  provider_gross?: number | string | null;
  created_at: string;
  room_id: string;
  duration: string;
};

type RoomRow = {
  id: string;
};

/**
 * Component
 */
const ProviderEarnings: React.FC = () => {
  const { isLoaded, user } = useUser();
  const { supabase } = useSupabase();

  const [earningLoading, setEarningLoading] = useState<boolean>(true);

  const [pendingLoading, setpendingLoading] = useState<boolean>(true);

  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState<number>(0);
  const [percentageChange, setPercentageChange] = useState<string>("0");
  const [stripeInfo, setStripeInfo] = useState<StripeInfo | null>(null);
  const [pendingPayoutRupees, setPendingPayoutRupees] = useState<number>(0);
  const [payouts, setPayouts] = useState<
    Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      arrival_date: number;
      created: number;
      description: string | null;
      method: string | null;
      type: string | null;
    }>
  >([]);
  const [payoutSchedule, setPayoutSchedule] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  // 1) New helpers & state
  const currencySymbol = (code?: string) => {
    if (!code) return "";
    const m: Record<string, string> = {
      inr: "₹",
      usd: "$",
      eur: "€",
      gbp: "£",
    };
    return m[code.toLowerCase()] ?? code.toUpperCase() + " ";
  };

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const run = async () => {
      try {
        /**
         * Resolve identity from Clerk
         */
        console.log("Hey")
        const providerId: string | null = user?.id ?? null;
        const email: string | null =
          user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;

        if (!providerId) {
          console.warn("No authenticated user from Clerk.");
          setLoading(false);
          return;
        }

        if (supabase) {
          const { data: info, error: fnErr } = await supabase.functions.invoke(
            "ensure-connected-account",
            {
              body: {
                provider_user_id: providerId,
                provider_email: email,
              },
            }
          );

          console.log("stripe info:", info);

          if (fnErr) {
            console.error("ensure-connected-account error:", fnErr);
          } else {
            setStripeInfo(info ?? null);
            // After you set stripeInfo

            const { data: payoutsData, error: payoutsErr } =
              await supabase.functions.invoke("provider-payouts", {
                body: { provider_user_id: providerId },
              });
            if (!payoutsErr && payoutsData) {
              // pending INR (Stripe returns arrays per currency)
              const pending = (payoutsData.balance?.pending ?? []) as Array<{
                amount: number;
                currency: string;
              }>;
              const pendingInr = pending.find((x) => x.currency === "usd");
              setPendingPayoutRupees((pendingInr?.amount ?? 0) / 100);

              setPayouts(payoutsData.payouts ?? []);
              setPayoutSchedule(payoutsData.schedule ?? null);
            } else {
              console.error("provider-payouts error:", payoutsErr);
            }

            setpendingLoading(false); // ✅ Done loading pending payout
          }
        }

        // Start fetching earnings data here — set earningLoading = true
        setEarningLoading(true);

        const now = new Date();

        const startOfThisMonthStr = startOfMonth(now).toISOString();
        const endOfThisMonthStr = endOfMonth(now).toISOString();

        const startOfLastMonthStr = startOfMonth(
          subMonths(now, 1)
        ).toISOString();
        const endOfLastMonthStr = endOfMonth(subMonths(now, 1)).toISOString();

        const { data, error } = await supabase
          .from("candidates")
          .select("provider_gross, duration, interview_date");

        if (error) {
          console.error("Error fetching candidate data:", error);
          return;
        }

        const allCandidates = data || [];

        const parseDurationToHours = (durationStr: string): number => {
          const [hours, minutes, seconds] = durationStr.split(":").map(Number);
          return hours + minutes / 60 + seconds / 3600;
        };

        const total = allCandidates.reduce((acc, item) => {
          const gross = Number(item.provider_gross || 0);
          const durationHours = parseDurationToHours(
            item.duration || "00:00:00"
          );
          return acc + gross;
        }, 0);

        const thisMonthTotal = allCandidates
          .filter(
            (item) =>
              item.interview_date >= startOfThisMonthStr &&
              item.interview_date <= endOfThisMonthStr
          )
          .reduce((acc, item) => {
            const gross = Number(item.provider_gross || 0);
            const durationHours = parseDurationToHours(
              item.duration || "00:00:00"
            );
            return acc + gross;
          }, 0);

        const lastMonthTotal = allCandidates
          .filter(
            (item) =>
              item.interview_date >= startOfLastMonthStr &&
              item.interview_date <= endOfLastMonthStr
          )
          .reduce((acc, item) => {
            const gross = Number(item.provider_gross || 0);
            const durationHours = parseDurationToHours(
              item.duration || "00:00:00"
            );
            return acc + gross;
          }, 0);

        const percent =
          lastMonthTotal === 0
            ? 100
            : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

        setTotalEarnings(total);
        setThisMonthEarnings(thisMonthTotal);
        setPercentageChange(percent.toFixed(2) / 2);
        setEarningLoading(false); // done earnings loading
      } catch (err) {
        console.error("ProviderEarnings init error:", err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isLoaded, user, supabase]);

  const convertUsdToInr = (usdCents: number, rate: number = 88.17) => {
    // Stripe gives amount in cents
    const usd = usdCents / 100;
    return usd * rate;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h1>

      {!loading && stripeInfo && !stripeInfo.stripe_details_submitted && (
        <Card>
          <CardHeader>
            <CardTitle>Finish setting up payouts</CardTitle>
          </CardHeader>

          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Connect your bank via Stripe to start receiving payouts.
              </p>

              {stripeInfo.error && (
                <p className="text-sm text-red-600 mt-1">{stripeInfo.error}</p>
              )}
            </div>

            <div className="flex gap-2">
              {stripeInfo.onboarding_url && (
                <Button asChild>
                  <a href={stripeInfo.onboarding_url}>Complete Stripe Setup</a>
                </Button>
              )}

              {stripeInfo.login_url && (
                <Button variant="outline" asChild>
                  <a
                    href={stripeInfo.login_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Stripe Dashboard
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {earningLoading ? (
                <svg
                  className="animate-spin h-6 w-6 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                `₹${totalEarnings.toLocaleString()}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {earningLoading ? (
                <svg
                  className="animate-spin h-6 w-6 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                `₹${thisMonthEarnings.toLocaleString()}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(percentageChange) >= 0 ? "+" : ""}
              {percentageChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payout
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {pendingLoading ? (
                <svg
                  className="animate-spin h-6 w-6 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                `₹${convertUsdToInr(
                  pendingPayoutRupees * 100
                ).toLocaleString()}`
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {pendingLoading
                ? "Loading payout schedule..."
                : payoutSchedule?.interval
                ? `Schedule: ${payoutSchedule.interval}`
                : "Payout schedule unknown"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bank Account Details
          </CardTitle>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {stripeInfo?.stripe_details_submitted
                ? "Connected via Stripe Express"
                : "Not connected"}
            </p>
            
            <Badge
              className={`mt-2 ${
                stripeInfo?.stripe_details_submitted && stripeInfo?.card_payments !== 'inactive'
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {stripeInfo?.stripe_details_submitted && stripeInfo?.card_payments !== 'inactive'
                ? "Verified"
                : "Action Required"}
            </Badge>
          </div>

          {stripeInfo?.login_url && (
            <Button variant="outline" asChild>
              <a href={stripeInfo.login_url} target="_blank" rel="noreferrer">
                Open Stripe Dashboard
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>

        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-gray-600">No payouts yet.</p>
          ) : (
            payouts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {new Date(p.arrival_date * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {p.method ? p.method : "standard"} • {p.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    ₹{(p.amount / 100).toLocaleString()}
                  </p>
                  <Badge className="bg-green-100 text-green-800">
                    {p.status === "paid" ? "Paid" : p.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderEarnings;
