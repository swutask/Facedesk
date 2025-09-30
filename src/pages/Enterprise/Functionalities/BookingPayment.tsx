import { useState, useEffect } from "react";
import * as yup from "yup";

import { loadStripe } from "@stripe/stripe-js";
import {
  Calendar,
  Clock,
  ArrowLeft,
  MapPin,
  Star,
  Shield,
  User,
  Mail,
  CreditCard,
  FileText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import BookingHeader from "@/components/BookingHeader";
import { useSupabase } from "@/context/supabaseContext";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useUser } from "@clerk/clerk-react";
import bookingSchema from "@/validations/bookingSchema";
import Booking from "./Booking";
import { useLocation } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const toMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const BookingPayment = () => {
  const location = useLocation();
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const stripe = useStripe();
  const elements = useElements();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [usingSavedPayment, setUsingSavedPayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [addingNewCard, setAddingNewCard] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    idType: "",
    idNumber: "",
    sendEmail: true,
    customNote: "",
    date: "",
    time: "",
    duration: "1", 
    specialRequests: "",
    termsAccepted: false,
  });

  const [selectedSpace, setSelectedSpace] = useState(null);
  const [loading, setLoading] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null); // Fetched coupon object
  const [couponError, setCouponError] = useState("");

  interface FormErrors {
    candidateName?: string;
    candidateEmail?: string;
    idType?: string;
    idNumber?: string;
    date?: string;
    time?: string;
    duration?: string;
    termsAccepted?: string;
  }
  const [errors, setErrors] = useState<FormErrors>({});

  const queryParams = new URLSearchParams(location.search);
  const dateTimeParam = queryParams.get("date"); // e.g. 2025-09-19T17:34
  const durationParam = queryParams.get("duration");

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
      if (data?.paymentMethods) {
        setPaymentMethods(data?.paymentMethods);
        // Select the default payment method if available
        const defaultMethod = data?.paymentMethods.find(
          (method: any) => method.is_default
        );
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod.id);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load saved payment methods");
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const ensurePaymentMethodsDisplayable = async (customerId: string) => {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      for (const pm of paymentMethods?.data) {
        if (pm.allow_redisplay !== "always") {
          await stripe.paymentMethods?.update(pm.id, {
            allow_redisplay: "always",
          });
        }
      }
    } catch (error) {
      console.error("Error updating payment methods:", error);
    }
  };

  useEffect(() => {
    if (dateTimeParam) {
      try {
        const dateObj = new Date(dateTimeParam);

        if (!isNaN(dateObj.getTime())) {
          const formattedDate = dateObj.toISOString().split("T")[0];
          const formattedTime = dateObj.toTimeString().slice(0, 5); // "HH:MM"
          setFormData((prev) => ({
            ...prev,
            date: formattedDate,
            time: formattedTime,
          }));
        }
      } catch (e) {
        console.warn("Invalid dateTimeParam:", dateTimeParam);
      }
    }

    if (durationParam) {
      setFormData((prev) => ({
        ...prev,
        duration: durationParam,
      }));
    }
  }, [dateTimeParam, durationParam]);

  useEffect(() => {
    const fetchCustomerInfo = async () => {
      try {
        // Call your backend to get customer ID
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
          // await ensurePaymentMethodsDisplayable(data.customer_id);
          await fetchPaymentMethods(data.customer_id);
        }
      } catch (error) {
        console.error("Error fetching customer info:", error);
      }
    };

    if (user) {
      fetchCustomerInfo();
    }
  }, [user]);

  // --- Replace your existing fetchSpace useEffect with this ---
  useEffect(() => {
    const parseFirstMediaUrl = (row: any): string | null => {
      if (!row) return null;

      const isImageUrl = (url: string) =>
        /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(url);

      // prefer row.media (array of objects)
      if (Array.isArray(row.media)) {
        const obj = row.media.find(
          (m: any) => m && typeof m.url === "string" && isImageUrl(m.url)
        );
        if (obj) return obj.url;
      }

      // fallback to media_urls (may be JSON strings or plain urls)
      if (Array.isArray(row.media_urls)) {
        for (const entry of row.media_urls) {
          try {
            if (typeof entry === "string") {
              const parsed = JSON.parse(entry);
              if (
                parsed &&
                typeof parsed.url === "string" &&
                isImageUrl(parsed.url)
              )
                return parsed.url;

              if (isImageUrl(entry)) return entry;
            } else if (
              typeof entry === "object" &&
              entry?.url &&
              isImageUrl(entry.url)
            ) {
              return entry.url;
            }
          } catch (e) {
            if (typeof entry === "string" && isImageUrl(entry)) return entry;
          }
        }
      }

      if (typeof row.image_url === "string" && isImageUrl(row.image_url))
        return row.image_url;

      return null;
    };

    if (supabase) {
      const fetchSpace = async () => {
        if (!id) return;
        setLoading(true);
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching room data:", error);
          setLoading(false);
          return;
        }

        const firstMedia = parseFirstMediaUrl(data);
        // attach a single 'image' property for UI use (keeps rest of object intact)
        const spaceWithImage = {
          ...data,
          image: firstMedia || data.image_url || "/placeholder.svg",
        };

        setSelectedSpace(spaceWithImage);
        setLoading(false);
      };

      fetchSpace();
    }
  }, [id, supabase]);

  const handleInputChange = (field: string, value: any) => {
    if (typeof value === "string") {
      if (field === "candidateEmail") {
        value = value.replace(/\s+/g, "");
      } else if (
        ["candidateName", "idNumber", "specialRequests", "customNote"].includes(
          field
        )
      ) {
        value = value.replace(/^\s+/, "");
      }
    }

    // Update form data
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear the specific error when user types/selects
    setErrors((prevErrors) => ({
      ...prevErrors,
      [field]: "", // Clear the error for this field
    }));
  };

  const handlePayment = async () => {
    const isValid = await validateForm();
    if (!isValid) {
      toast.error("Please fill in all the Fields.");
      return;
    }

    if (!formData.termsAccepted) {
      toast.warn("Please accept the terms to continue.");
      return;
    }

    if (!selectedSpace?.availability) {
      toast.error("Room availability information is missing.");
      return;
    }

    const selectedDate = new Date(formData.date);
    const selectedWeekday = selectedDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const isWorkingDay =
      selectedSpace.availability.workingDays[selectedWeekday];
    const isHoliday = selectedSpace.holidays?.includes(formData.date);

    if (!isWorkingDay) {
      toast.error(`The space is not available on ${selectedWeekday}.`);
      return;
    }

    if (isHoliday) {
      toast.error(
        "The selected date is a holiday. Please choose another date."
      );
      return;
    }

    const selectedStart = toMinutes(formData.time);
    const selectedEnd = selectedStart + parseInt(formData.duration) * 60;

    const availabilityStart = toMinutes(
      selectedSpace.availability.timeRange.start
    );
    const availabilityEnd = toMinutes(selectedSpace.availability.timeRange.end);

    if (selectedStart < availabilityStart || selectedEnd > availabilityEnd) {
      const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const date = new Date();
        date.setHours(h, m, 0, 0);
        return date.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      };

      const selectedStartStr = formatTime(selectedStart);
      const selectedEndStr = formatTime(selectedEnd);
      const availableStartStr = formatTime(availabilityStart);
      const availableEndStr = formatTime(availabilityEnd);

      toast.error(
        `Selected time (${selectedStartStr} - ${selectedEndStr}) is outside the room's available hours (${availableStartStr} - ${availableEndStr}).`
      );
      return;
    }

    // ✅ Check for Time Conflicts
    const { data: existingBookings, error } = await supabase
      .from("candidates")
      .select("interview_time, duration")
      .eq("room_id", selectedSpace.id)
      .eq("interview_date", formData.date);

    if (error) {
      console.error("Error checking availability:", error);
      toast.error("Could not check room availability. Try again.");
      return;
    }

    const newStartMinutes = toMinutes(formData.time);
    const newEndMinutes = newStartMinutes + parseInt(formData.duration) * 60;

    const hasConflict = existingBookings.some((booking) => {
      const existingStartMinutes = toMinutes(booking.interview_time);
      const existingDurationHours = parseFloat(booking.duration);
      const existingEndMinutes =
        existingStartMinutes + existingDurationHours * 60;

      return (
        newStartMinutes < existingEndMinutes &&
        newEndMinutes > existingStartMinutes
      );
    });

    if (hasConflict) {
      toast.error(
        "The selected time slot is already booked. Please choose another time."
      );
      return;
    }

    try {
      setBookingLoading(true);

      let paymentMethodId = selectedPaymentMethod;

      // If adding a new card, create a payment method
      if (addingNewCard && elements) {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error("Card details not complete");
          setBookingLoading(false);
          return;
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });

        if (error) {
          toast.error(error.message || "Failed to create payment method");
          setBookingLoading(false);
          return;
        }
        

        paymentMethodId = paymentMethod.id;

        // Save the payment method if requested
        if (savePaymentMethod && customerId) {
          try {
            await fetch(
              "https://nlrrjygzhhlrichlnswl.functions.supabase.co/save-payment-method",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer_id: customerId,
                  payment_method_id: paymentMethodId,
                  is_default: true, // Set as default if requested
                }),
              }
            );
          } catch (error) {
            console.error("Error saving payment method:", error);
            // Continue with payment even if saving fails
          }
        }
      }

      if (!paymentMethodId) {
        toast.error("Please select a payment method");
        setBookingLoading(false);
        return;
      }

      const payload = {
        full_name: formData.candidateName,
        email_address: formData.candidateEmail,
        government_id_type: formData.idType,
        government_id_number: formData.idNumber,
        interview_date: formData.date,
        interview_time: formData.time,
        duration: `${formData.duration} hours`,
        price: finalTotal,
        room_id: selectedSpace?.id,
        special_requests: formData.specialRequests,
        custom_note: formData.customNote,
        hourlyRate: selectedSpace?.pricing?.hourlyRate,
        companyUserId: user?.primaryEmailAddress?.emailAddress,
        userIdOfLoggedIn: user?.id,
        customer_id: customerId,
        discount: discountAmount,
        payment_method_id: paymentMethodId,
        using_saved_pm: !addingNewCard,
      };

      const res = await fetch(
        "https://nlrrjygzhhlrichlnswl.functions.supabase.co/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      setBookingLoading(false);

      if (data.requires_action && data.client_secret) {
        // complete 3DS challenge on-session
        const result = await stripe.confirmCardPayment(data.client_secret);
        if (result.error) {
          toast.error(result.error.message || "Authentication failed.");
          return;
        }
        toast.success("Payment successful!");
        navigate("/enterprise/booking/confirm", {
          state: { payment_intent_id: result.paymentIntent?.id },
        });
        return;
      }

      if (data.success) {
        toast.success("Payment successful!");
        navigate("/enterprise/booking/confirm", {
          state: { payment_intent_id: data.payment_intent_id },
        });
      } else {
        toast.error("Payment failed. Please try again.");
      }
    } catch (err) {
      setBookingLoading(false);
      toast.error("Network error. Please try again.");
      console.error("Network error:", err);
    }
  };

  const validateForm = async () => {
    try {
      await bookingSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (validationError) {
      const formattedErrors: FormErrors = {};
      validationError.inner.forEach((error) => {
        formattedErrors[error.path as keyof FormErrors] = error.message;
      });
      setErrors(formattedErrors);
      return false;
    }
  };

  const totalPrice =
    selectedSpace?.pricing?.hourlyRate && formData.duration
      ? selectedSpace.pricing.hourlyRate * parseInt(formData.duration)
      : 0;

  const platformFee = Math.round(totalPrice * 0.05);

  //
  const applyCoupon = async () => {
    setCouponError("");
    setCoupon(null);

    const trimmedCode = couponCode.trim();

    // Step 1: Check if coupon exists
    const { data: foundCoupon, error } = await supabase
      .from("coupon")
      .select("*")
      .eq("coupon_code", trimmedCode)
      .limit(1)
      .single();

    if (error || !foundCoupon) {
      setCouponError("Coupon is not valid.");
      return;
    }

    // Step 2: Check if coupon is expired
    const now = new Date();
    const expiry = new Date(foundCoupon.expires_at);

    if (expiry < now) {
      setCouponError("Coupon has expired.");
      return;
    }

    if(foundCoupon.condition_price > totalPrice ){
      console.log("coupon",foundCoupon.condition_price,platformFee)
      setCouponError("Coupon can not be applied for this amount");
      return;
    }

    // All good!
    setCoupon(foundCoupon);
    toast.success(
      `Coupon "${trimmedCode}" applied! ₹${foundCoupon.discount} off.`
    );
  };

  const discountAmount = coupon?.discount || 0;
  const finalTotal = totalPrice - discountAmount + platformFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {bookingLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 cursor-not-allowed">
          <div className="w-16 h-16 border-4 border-dotted border-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      <BookingHeader step={2} />
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Form */}
          <div className="col-span-2 space-y-6">
            {/* Candidate Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Candidate Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="candidateName">Full Name *</Label>
                    <Input
                      id="candidateName"
                      value={formData.candidateName}
                      onChange={(e) =>
                        handleInputChange("candidateName", e.target.value)
                      }
                      placeholder="Enter candidate's full name"
                    />
                    {errors.candidateName && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.candidateName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="candidateEmail">Email Address *</Label>
                    <Input
                      id="candidateEmail"
                      type="email"
                      value={formData.candidateEmail.replace(/\s+/g, "")}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\s+/g, "");
                        handleInputChange("candidateEmail", value);
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        handleInputChange("candidateEmail", value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault();
                        }
                      }}
                      placeholder="candidate@example.com"
                    />

                    {errors.candidateEmail && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.candidateEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="idType">Government ID Type *</Label>
                    <Select
                      value={formData.idType}
                      onValueChange={(value) =>
                        handleInputChange("idType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                        <SelectItem value="pan">PAN Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="license">Driving License</SelectItem>
                        <SelectItem value="voter">Voter ID</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.idType && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.idType}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="idNumber">Government ID Number *</Label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) =>
                        handleInputChange("idNumber", e.target.value)
                      }
                      placeholder="Enter ID number"
                    />
                    {errors.idNumber && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.idNumber}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customNote">
                    Custom note for candidate (optional)
                  </Label>
                  <Textarea
                    id="customNote"
                    value={formData.customNote}
                    onChange={(e) =>
                      handleInputChange("customNote", e.target.value)
                    }
                    placeholder="Add any special instructions or notes for the candidate..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Time & Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                    />

                    {errors.date && (
                      <p className="text-red-600 text-sm mt-1">{errors.date}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="time">Start Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        handleInputChange("time", e.target.value)
                      }
                    />
                    {errors.time && (
                      <p className="text-red-600 text-sm mt-1">{errors.time}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration *</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) =>
                        handleInputChange("duration", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedSpace?.pricing?.maxDuration
                              ? `Select duration (1 to ${
                                  selectedSpace.pricing.maxDuration
                                } hour${
                                  selectedSpace.pricing.maxDuration > 1
                                    ? "s"
                                    : ""
                                })`
                              : "Select duration"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedSpace?.pricing?.maxDuration &&
                          Array.from(
                            {
                              length: parseInt(
                                selectedSpace.pricing.maxDuration
                              ),
                            },
                            (_, i) => i + 1
                          ).map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {hour} Hour{hour > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {errors.duration && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.duration}
                      </p>
                    )}
                  </div>
                </div>

                {formData.date && formData.time && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Booking Window:</strong>{" "}
                      {new Date(
                        `2000-01-01T${formData.time}:00`
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      -{" "}
                      {new Date(
                        new Date(`2000-01-01T${formData.time}:00`).getTime() +
                          parseInt(formData.duration) * 60 * 60 * 1000
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      on{" "}
                      {new Date(formData.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Special Requests (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.specialRequests}
                  onChange={(e) =>
                    handleInputChange("specialRequests", e.target.value)
                  }
                  placeholder="Any special requirements or notes for the space provider (e.g., wheelchair access, specific setup needs)..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Terms & Consent */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) =>
                      handleInputChange("termsAccepted", checked)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      Candidate agrees to attend in person and consents to
                      surveillance during the interview.
                    </Label>
                    <p className="text-xs text-gray-600">
                      By proceeding, you confirm that the candidate has been
                      informed and consents to the
                      <a
                        href="#"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        FaceDesk Terms of Booking
                      </a>
                    </p>
                    {errors.termsAccepted && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.termsAccepted}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Room Summary & Payment */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Room Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Room Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <img
                      src={selectedSpace?.image}
                      alt={selectedSpace?.room_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {selectedSpace?.room_name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {"No reviews yet"}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {selectedSpace?.formatted_address}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>

                    <Badge variant="outline">
                      {selectedSpace?.room_type || "Room Type"}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/enterprise/booking")}
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Change Room
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Method Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingPaymentMethods ? (
                    <div className="text-center py-4">
                      Loading payment methods...
                    </div>
                  ) : paymentMethods?.length > 0 ? (
                    <RadioGroup
                      value={selectedPaymentMethod || ""}
                      onValueChange={(value) => {
                        setSelectedPaymentMethod(value);
                        setAddingNewCard(false);
                      }}
                    >
                      <div className="space-y-3">
                        {paymentMethods?.map((method) => (
                          <div
                            key={method.id}
                            className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50"
                          >
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label
                              htmlFor={method.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium capitalize">
                                    {method.brand}
                                  </span>{" "}
                                  ending in {method.last4}
                                  {method.is_default && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Expires {method.exp_month}/{method.exp_year}
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No saved payment methods
                    </p>
                  )}

                  <div className="pt-4 border-t">
                    <div
                      className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
                      onClick={() => setAddingNewCard(true)}
                    >
                      <RadioGroup
                        value="new-card"
                        id="new-card"
                        checked={addingNewCard}
                      />
                      <Label
                        htmlFor="new-card"
                        className="cursor-pointer flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add new card
                      </Label>
                    </div>

                    {addingNewCard && (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div className="mb-4">
                          <Label>Card Details</Label>
                          <div className="mt-2 p-3 border rounded-md">
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
                                },
                              }}
                            />
                          </div>
                        </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="save-card"
                          checked={savePaymentMethod}
                          onCheckedChange={(checked) =>
                            setSavePaymentMethod(!!checked)
                          }
                        />
                        <Label
                          htmlFor="save-card"
                          className="text-sm cursor-pointer"
                        >
                            Save this card for future payments and set it as default
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Hourly Rate × {formData.duration} hours</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Platform Fee</span>
                      <span>₹{platformFee}</span>
                    </div>
                    {coupon && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Coupon "{coupon.coupon_code}"</span>
                        <span>-₹{coupon.discount}</span>
                      </div>
                    )}

                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{finalTotal}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Enter coupon code (optional)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Prevent form submission if inside a form
                          applyCoupon(); // Call your apply logic here
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={applyCoupon}
                    >
                      Apply Coupon
                    </Button>

                    {coupon && (
                      <p className="text-sm text-green-600">
                        Coupon "{coupon.coupon_code}" applied! ₹
                        {coupon.discount} off.
                      </p>
                    )}
                    {couponError && (
                      <p className="text-sm text-red-600">{couponError}</p>
                    )}
                  </div>

                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handlePayment}
                    disabled={
                      !formData.candidateName ||
                      !formData.candidateEmail ||
                      !formData.termsAccepted ||
                      (!selectedPaymentMethod && !addingNewCard)
                    }
                  >
                    Pay & Confirm Booking
                  </Button>
                  <p className="text-xs text-center text-gray-600">
                    Secure payment powered by Stripe
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPayment;
