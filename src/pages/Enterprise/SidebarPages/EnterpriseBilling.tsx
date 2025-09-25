import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Download,
  Plus,
  TrendingUp,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useSupabase } from "@/context/supabaseContext";
import { useUser } from "@clerk/clerk-react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { log } from "node:console";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

const PaginationControls = ({ table, data }) => {
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} of {data.length} results
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm text-gray-600">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const EnterpriseBilling = () => {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const stripe = useStripe();
  const elements = useElements();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<
    string | null
  >(null);

  const [usageStats, setUsageStats] = useState({
    currentPlan: "Professional",
    monthlyLimit: 100,
    used: 0,
    remaining: 100,
    nextBillingDate: "2024-07-15",
  });

  const [loadingUsage, setLoadingUsage] = React.useState(true);

  const [thisMonthTotal, setThisMonthTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(true);

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<
    string | null
  >(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [deletingPaymentMethod, setDeletingPaymentMethod] = useState<
    string | null
  >(null);

  const providerId = user?.id;
  const providerEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();

  useEffect(() => {
    const fetchCustomerId = async () => {
      try {
        const response = await fetch(
          "https://nlrrjygzhhlrichlnswl.functions.supabase.co/create-stripe-customer",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider_id: user?.id,
              email: user?.primaryEmailAddress?.emailAddress?.toLowerCase(),
            }),
          }
        );

        const data = await response.json();
        if (data.customer_id) {
          setCustomerId(data.customer_id);
          fetchPaymentMethods(data.customer_id);
        }
      } catch (error) {
        console.error("Error fetching customer ID:", error);
        setError("Failed to load customer information");
      }
    };

    if (user) {
      fetchCustomerId();
    }
  }, [user]);

  useEffect(() => {
    const fetchInvoices = async (custId: string) => {
      console.log("Fetching invoices for customer:", custId);
      setLoadingInvoices(true);
      setError(null);

      try {
        const url = `https://nlrrjygzhhlrichlnswl.supabase.co/functions/v1/Get-Invoices?customerId=${custId}`;
        console.log("Fetching from URL:", url);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", res.status);
        if (!res.ok) {
          throw new Error(`Fetch failed: ${res.statusText}`);
        }

        const data = await res.json();
        setInvoices(Array.isArray(data?.invoices) ? data.invoices : []);
        console.log("Fetched invoice data:", data);

        const invoicesArray = Array.isArray(data)
          ? data
          : Array.isArray(data.invoices)
          ? data.invoices
          : Array.isArray(data.data)
          ? data.data
          : [];

          setInvoices(invoicesArray.filter((inv) => inv.type === "invoice"));
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to fetch invoices.");
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
        console.log("Done loading invoices");
      }
    };

    if (customerId) {
      fetchInvoices(customerId);
    }
  }, [customerId]);

  const fetchPaymentMethods = async (customerId: string) => {
    setLoadingPaymentMethods(true);
    try {
      const response = await fetch(
        "https://nlrrjygzhhlrichlnswl.functions.supabase.co/get-payment-methods",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId }),
        }
      );

      const data = await response.json();
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods);

        // Find the default payment method
        const defaultMethod = data.paymentMethods.find(
          (method: PaymentMethod) => method.is_default
        );
        if (defaultMethod) {
          setDefaultPaymentMethod(defaultMethod.id);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setError("Failed to load payment methods");
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!stripe || !elements || !customerId) {
      setError("Stripe not initialized or customer ID missing");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the backend to create a SetupIntent and get the client_secret
      const response = await fetch(
        "https://nlrrjygzhhlrichlnswl.functions.supabase.co/create-payment-method-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId }),
        }
      );

      const { client_secret } = await response.json();

      // Get the CardElement from Elements
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("CardElement not available");
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(
        client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.fullName || "User",
              email: providerEmail,
            },
          },
        }
      );

      if (error) {
        throw error;
      }

      if (setupIntent.status === "succeeded") {
        // Save the payment method to your backend (Supabase)
        await savePaymentMethodToBackend(setupIntent.payment_method);
        setSuccess("Payment method successfully added");

        // Clear the card element
        if (cardElement) {
          cardElement.clear();
        }
      }
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      setError(error.message || "Failed to add payment method");
    } finally {
      setLoading(false);
    }
  };

  // Save payment method ID to Supabase
  const savePaymentMethodToBackend = async (paymentMethodId: string) => {
    try {
      
      const response = await fetch(
        "https://nlrrjygzhhlrichlnswl.functions.supabase.co/save-payment-method",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customerId,
            payment_method_id: paymentMethodId,
            is_default: paymentMethods.length === 0, // Set as default if it's the first payment method
          }),
        }
      );
      
      const data = await response.json();
      if (data.success) {
        // Refresh the payment methods list
        if (customerId) {
          fetchPaymentMethods(customerId);
        }
      } else {
        throw new Error(data.error || "Failed to save payment method");
      }
    } catch (error: any) {
      console.error("Error saving payment method:", error);
      setError(error.message || "Failed to save payment method");
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      const response = await fetch(
        "https://nlrrjygzhhlrichlnswl.functions.supabase.co/set-default-payment-method",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customerId,
            payment_method_id: paymentMethodId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setDefaultPaymentMethod(paymentMethodId);
        setSuccess("Default payment method updated");

        // Update the local state to reflect the change
        setPaymentMethods((prev) =>
          prev.map((method) => ({
            ...method,
            is_default: method.id === paymentMethodId,
          }))
        );
      } else {
        throw new Error(data.error || "Failed to set default payment method");
      }
    } catch (error: any) {
      console.error("Error setting default payment method:", error);
      setError(error.message || "Failed to set default payment method");
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    setDeletingPaymentMethod(paymentMethodId);
    try {
      const response = await fetch(
        "https://nlrrjygzhhlrichlnswl.functions.supabase.co/delete-payment-method",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customerId,
            payment_method_id: paymentMethodId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Payment method deleted");
        setDeleteModalOpen(false);
        // Refresh the payment methods list
        if (customerId) {
          fetchPaymentMethods(customerId);
        }
      } else {
        throw new Error(data.error || "Failed to delete payment method");
      }
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      setError(error.message || "Failed to delete payment method");
    } finally {
      setDeletingPaymentMethod(null);
    }
  };

  const openDeleteModal = (paymentMethodId: string) => {
    setPaymentMethodToDelete(paymentMethodId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setPaymentMethodToDelete(null);
  };

  useEffect(() => {
    const fetchUsage = async () => {
      if (!supabase) {
        console.error("Supabase client is not initialized");
        setLoadingUsage(false);
        return;
      }
      setLoadingUsage(true);
      const { count, error } = await supabase
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .in("interview_status", ["upcoming", "in-progress", "completed"]);

      if (!error) {
        const used = count || 0;
        const monthlyLimit = 100;
        const remaining = Math.max(monthlyLimit - used, 0);

        setUsageStats((prev) => ({
          ...prev,
          used,
          remaining,
        }));
      } else {
        console.error("Error fetching usage:", error);
      }
      setLoadingUsage(false);
    };
    fetchUsage();
  }, [supabase]);

  useEffect(() => {
    async function fetchTotals() {
      if (!supabase) {
        console.error("Supabase client is not initialized");
        setLoadingTotal(false);
        return;
      }

      setLoadingTotal(true);

      // Get current date info
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day of last month

      // Helper to convert date to ISO string (for supabase)
      const toISO = (date) => date.toISOString();

      // Query sum of prices this month
      let { data: thisMonthData, error: thisMonthError } = await supabase
        .from("candidates")
        .select("price", { count: "exact" })
        .gte("created_at", toISO(thisMonthStart))
        .lte(
          "created_at",
          toISO(new Date(now.getFullYear(), now.getMonth() + 1, 1))
        );

      // Query sum of prices last month
      let { data: lastMonthData, error: lastMonthError } = await supabase
        .from("candidates")
        .select("price")
        .gte("created_at", toISO(lastMonthStart))
        .lte("created_at", toISO(thisMonthStart));

      if (thisMonthError || lastMonthError) {
        console.error(
          "Error fetching data from Supabase:",
          thisMonthError || lastMonthError
        );
        setLoadingTotal(false);
        return;
      }

      // Sum prices for this month
      const sumThisMonth = thisMonthData.reduce(
        (acc, row) => acc + row.price,
        0
      );

      // Sum prices for last month
      const sumLastMonth = lastMonthData.reduce(
        (acc, row) => acc + row.price,
        0
      );

      setThisMonthTotal(sumThisMonth);
      setLastMonthTotal(sumLastMonth);
      setLoadingTotal(false);
    }

    fetchTotals();
  }, [supabase]);

  const percentageChange =
    lastMonthTotal === 0
      ? 100 // if no last month data, show 100% increase
      : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!supabase) {
        console.error("Supabase client is not initialized");
        setLoadingTransactions(false);
        return;
      }

      setLoadingTransactions(true);

      const { data, error } = await supabase
        .from("candidates")
        .select(
          `
        id,
        full_name,
        created_at,
        price,
        room_id,
        room:rooms!candidates_room_id_fkey (
          room_name
        )
      `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        setRecentTransactions([]);
      } else {
        const formatted = data.map((c) => ({
          id: c.id,
          description: `Room booking - ${c.room?.room_name || "Unknown Room"}`,
          candidate: c.full_name,
          date: new Date(c.created_at).toISOString().split("T")[0],
          amount: `₹${parseFloat(c.price).toLocaleString("en-IN")}`,
        }));
        setRecentTransactions(formatted);
      }

      setLoadingTransactions(false);
    };

    fetchTransactions();
  }, [supabase]);

  // Define columns for transactions table
  const transactionColumns = [
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "candidate",
      header: "Candidate",
    },
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "amount",
      header: "Amount",
    },
  ];

  // Define columns for invoices table
  const invoiceColumns = [
    {
      accessorKey: "id",
      header: "Invoice ID",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue() ?? "—"}</span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue() ?? "—"}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() ?? "—"}</span>
      ),
    },
    {
      accessorKey: "hosted_invoice_url",
      header: "Actions",
      cell: ({ row }) =>
        row.original.hosted_invoice_url ? (
          <a
            href={row.original.hosted_invoice_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">N/A</span>
        ),
    },
  ];

  // Create tables with pagination
  const transactionsTable = useReactTable({
    data: recentTransactions,
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const invoicesTable = useReactTable({
    data: invoices,
    columns: invoiceColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-6">
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Delete Payment Method
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this payment method? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                disabled={deletingPaymentMethod !== null}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  paymentMethodToDelete &&
                  handleDeletePaymentMethod(paymentMethodToDelete)
                }
                disabled={deletingPaymentMethod !== null}
              >
                {deletingPaymentMethod ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Display error and success messages */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPaymentMethods ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 bg-gray-300 rounded w-20"></div>
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) :  paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {method.brand.toUpperCase()} •••• •••• ••••{" "}
                        {method.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {method.is_default ? (
                      <Badge className="bg-green-100 text-green-800">
                        Default
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefaultPaymentMethod(method.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteModal(method.id)}
                      disabled={deletingPaymentMethod === method.id}
                    >
                      {deletingPaymentMethod === method.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : paymentMethods.length === 0 && (
            <p className="text-sm text-gray-600">
              No payment methods added yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method */}
      <Card id="add-payment-method">
        <CardHeader>
          <CardTitle>Add Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
              className="p-4 border border-gray-300 rounded"
            />
            <Button
              onClick={handleAddPaymentMethod}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? "Adding..." : "Add Payment Method"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Plan & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {usageStats.currentPlan}
                </h3>
                <p className="text-sm text-gray-600">
                  ₹199/month per interview
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next billing date</p>
                <p className="font-medium">{usageStats.nextBillingDate}</p>
              </div>
              <Button variant="outline" className="w-full">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsage ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-24" />
                <div className="h-2 bg-gray-200 rounded-full w-full" />
                <div className="h-4 bg-gray-300 rounded w-32" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {usageStats.used}
                  </span>
                  <span className="text-sm text-gray-600">
                    of {usageStats.monthlyLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (usageStats.used / usageStats.monthlyLimit) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {usageStats.remaining} interviews remaining
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTotal ? (
              <p>Loading...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{thisMonthTotal.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Total spent this month</p>
                <p
                  className={`text-xs ${
                    percentageChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {percentageChange >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(percentageChange).toFixed(2)}% from last month
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {/* Recent Transactions */}
      {/* Recent Transactions */}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            // Skeleton Loader
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4">
                  <div className="h-4 bg-gray-200 rounded col-span-2" />
                  <div className="h-4 bg-gray-200 rounded col-span-1" />
                  <div className="h-4 bg-gray-200 rounded col-span-1" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  {transactionsTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {transactionsTable.getRowModel().rows?.length ? (
                    transactionsTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={transactionColumns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <PaginationControls
                table={transactionsTable}
                data={recentTransactions}
              />
            </>
          ) : (
            <div className="text-center text-sm text-gray-500 py-4">
              No recent transactions found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <div className="text-center py-4 text-sm text-gray-500">
              Loading invoices...
            </div>
          ) : invoices.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  {invoicesTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {invoicesTable.getRowModel().rows?.length ? (
                    invoicesTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={invoiceColumns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <PaginationControls table={invoicesTable} data={invoices} />
            </>
          ) : (
            <div className="text-center text-sm text-gray-500 py-4">
              No invoices found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterpriseBilling;
