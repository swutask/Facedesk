import React, { useState,useEffect, } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  User,
  Bell,
  Shield,
  Users,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useReverification, useUser } from "@clerk/clerk-react";
import { useSupabase } from "@/context/supabaseContext";
import { toast } from "react-toastify";

import { companySchema } from "@/validations/companydetailSchema";
import { useNavigate } from "react-router-dom";



import * as yup from "yup";
import { log } from "node:console";



type NotificationPreferences = {
  interviewReminders: boolean;
  candidateCheckins: boolean;
  bookingConfirmations: boolean;
  weeklyReports: boolean;
};

// Define DefaultPreferences type
type DefaultPreferences = {
  showOnlyVerifiedRooms: boolean;
  requireIdVerification: boolean;
  autoRecordInterviews: boolean;
};

// Define Preferences type combining the above two
type Preferences = {
  notifications: NotificationPreferences;
  defaults: DefaultPreferences;
};

const defaultPreferences: Preferences = {
  notifications: {
    interviewReminders: true,
    candidateCheckins: true,
    bookingConfirmations: true,
    weeklyReports: true,
  },
  defaults: {
    showOnlyVerifiedRooms: true,
    requireIdVerification: true,
    autoRecordInterviews: true,
  },
};


const passwordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("newPassword"), null], "Passwords must match"),
});



const EnterpriseSettings = () => {
  const { user, isLoaded } = useUser(); // Clerk hook to get current user
  const userId = user?.id; // Get user ID from Clerk
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  // for company details
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");


  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [currentPassword, setCurrentPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });


  

   const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>(
    {}
  );

  const deleteUser = React.useCallback(async () => user?.delete(), [user]);
const deleteUserWithReverification = useReverification(deleteUser);


  console.log("uinncc" + companyEmail);

  const handleInsertCompany = async () => {   // INsert company detail
    if (!userId) {
      toast.error("User not logged in.");
      return;
    }

    // Clear previous errors
    setCompanyErrors({});

    try {
      // Validate input fields
      await companySchema.validate(
        {
          companyName,
          companyEmail,
          companyAddress,
          companyPhone,
          companyWebsite,
        },
        { abortEarly: false }
      );

      

      // If validation passes, insert or update company in Supabase
      const { data, error } = await supabase
        .from("company")
        .upsert(
          {
            company_name: companyName || null,
            company_email: companyEmail || null,
            address: companyAddress || null,
            phone: companyPhone || null,
            website: companyWebsite || null,
            user_id: userId,
          },
          { onConflict: ["user_id"] }
        )
        .select("*")
        .single();

      if (error) {
        toast.error("Failed to save company: " + error.message);
        return;
      }

      toast.success("Company saved successfully!");

      // Optionally reset error state (already done above)
      setCompanyErrors({});
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((e: yup.ValidationError) => {
          if (e.path) errors[e.path] = e.message;
        });
        setCompanyErrors(errors);
      } else {
        toast.error("Unexpected error while saving company.");
        console.error(err);
      }
    }
  };

  // fetch company details
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      console.log("User ID:", userId);

      if (!userId || !supabase || !isLoaded) {
        console.warn("fetchCompanyDetails: Missing dependencies");
        return;
      }

      console.log("Loading company data...");

      try {
        const { data, error } = await supabase
          .from("company")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching company data:", error.message);
          return;
        }

        if (data) {
          setCompanyName(data.company_name ?? "");
          setCompanyEmail(data.company_email ?? "");
          setCompanyAddress(data.address ?? "");
          setCompanyPhone(data.phone ?? "");
          setCompanyWebsite(data.website ?? "");
        } else {
          // No data found: reset fields
          setCompanyName("");
          setCompanyEmail("");
          setCompanyAddress("");
          setCompanyPhone("");
          setCompanyWebsite("");
        }
      } catch (err: any) {
        console.error("Unexpected error fetching company data:", err);
      }
    };

    fetchCompanyDetails();
  }, [isLoaded, userId, supabase]);
  



// update password
  const updatePassword = useReverification(async (params) => {
    // Update password using Clerk's updatePassword method
    return await user?.updatePassword(params);
  });

  

  // Team members array (could be fetched dynamically from your backend)
  const teamMembers = [
    {
      id: 1,
      name: "Alex Thompson",
      email: "alex@company.com",
      role: "Admin",
      status: "active",
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah@company.com",
      role: "Recruiter",
      status: "active",
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike@company.com",
      role: "Recruiter",
      status: "pending",
    },
  ];

  const validatePasswordFields = async () => {
    try {
      await passwordSchema.validate(
        { newPassword, confirmPassword },
        { abortEarly: false }
      );
      setPasswordErrors({ newPassword: "", confirmPassword: "" });
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) errors[e.path] = e.message;
        });
        setPasswordErrors(errors as typeof passwordErrors);
      }
      return false;
    }
  };

  const handleUpdateProfile = async () => {
    if (!isLoaded || !user) {
      toast.error("User not loaded. Please try again.");
      return;
    }

    let profileUpdateSuccess = false;
    let passwordUpdateSuccess = false;

    try {
      // Update Supabase profile
      const { error: supabaseError } = await supabase
        .from("user_profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", user.id);

      if (supabaseError) {
        toast.error(
          "Error updating Supabase profile: " + supabaseError.message
        );
        return;
      }

      // Update Clerk profile
      await user.update({ firstName, lastName });
      profileUpdateSuccess = true;

      // Check if password change is requested
      const isUpdatingPassword =
        currentPassword.trim() && newPassword.trim() && confirmPassword.trim();

      if (isUpdatingPassword) {
        const isValid = await validatePasswordFields(); // Use your reusable function
        if (!isValid) return;

        try {
          await updatePassword({
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
          });

          passwordUpdateSuccess = true;
          toast.success("Profile updated successfully!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } catch (err) {
          console.error("Error updating password:", err);

          if (
            err.code === "incorrect_password" ||
            err.message?.toLowerCase().includes("wrong password") ||
            err.status === 401
          ) {
            toast.error("Current password is incorrect.");
          } else if (err.code === "session_reverification_required") {
            toast.error("Session expired. Please reverify to change password.");
          } else {
            toast.error(`Error updating password: ${err.message || err}`);
          }
          return; // If password update fails, no profile update should happen.
        }
      }

      // If only the profile was updated
      if (profileUpdateSuccess && !passwordUpdateSuccess) {
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error("Error updating Clerk profile: " + err.message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-800";
      case "Recruiter":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // prefernces
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  const fetchPreferences = async () => {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching preferences:", error.message);
      setPreferences(defaultPreferences); // fallback to defaults on error
    } else if (data) {
      setPreferences({
        notifications: {
          interviewReminders: data.interview_reminders,
          candidateCheckins: data.candidate_checkins,
          bookingConfirmations: data.booking_confirmations,
          weeklyReports: data.weekly_reports,
        },
        defaults: {
          showOnlyVerifiedRooms: data.show_only_verified_rooms,
          requireIdVerification: data.require_id_verification,
          autoRecordInterviews: data.auto_record_interviews,
        },
      });
    } else {
      setPreferences(defaultPreferences);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPreferences();
  }, [userId, supabase]);



  useEffect(() => {
    if (!preferences) return;

    const insertData = {
      user_id: userId,
      interview_reminders: preferences.notifications.interviewReminders,
      candidate_checkins: preferences.notifications.candidateCheckins,
      booking_confirmations: preferences.notifications.bookingConfirmations,
      weekly_reports: preferences.notifications.weeklyReports,
      show_only_verified_rooms: preferences.defaults.showOnlyVerifiedRooms,
      require_id_verification: preferences.defaults.requireIdVerification,
      auto_record_interviews: preferences.defaults.autoRecordInterviews,
    };

    const savePreferences = async () => {
      const { error } = await supabase
        .from("user_preferences")
        .upsert(insertData, { onConflict: ["user_id"] });

      if (error) {
        console.error("Error saving preferences:", error.message);
        toast.error("Failed to save preferences.");
      } else {
        console.log("Preferences saved successfully");
      }
    };

    savePreferences();
  }, [preferences, userId, supabase]);

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: !preferences.notifications[key],
      },
    });
  };

  const handleDefaultToggle = (key: keyof DefaultPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      defaults: {
        ...preferences.defaults,
        [key]: !preferences.defaults[key],
      },
    });
  };


    const handleDeleteAccountInSupabase = async () => {
       if (!user?.id || !supabase) return false;
   
       try {
         console.log("Attempting to delete user with ID:", user.id); // Log user ID for debugging
   
         const { data, error } = await supabase.from("user_profiles").select("*");
         console.log("All users:", data);
         
         // Case-insensitive check for user profile
         const { data: profile, error: profileCheckError } = await supabase
           .from("user_profiles")
           .select("id")
           .ilike("id", user.id) // Case-insensitive match
           // .single();
   
         if (profileCheckError) {
           console.error("Error checking user profile:", profileCheckError);
           // If profile doesn't exist, we can still proceed with other deletions
         } else if (!profile) {
           console.log("User profile not found, proceeding with other deletions");
         }
         // Check and delete related data
         const checks = await Promise.all([
           supabase.from("user_profiles").select("id").eq("id", user.id),
           supabase.from("candidates").select("id").eq("company_user_id", user.id),
           supabase
             .from("user_preferences")
             .select("user_id")
             .eq("user_id", user.id),
           supabase.from("company").select("id").eq("user_id", user.id),
         ]);
   
         console.log("Pre-deletion check results:");
         console.log("User profiles:", checks[0].data?.length || 0);
         console.log("Candidates:", checks[1].data?.length || 0);
         console.log("Preferences:", checks[2].data?.length || 0);
         console.log("Company:", checks[3].data?.length || 0);   

         // Delete data
         const deletions = await Promise.all([
           supabase.from("user_preferences").delete().eq("user_id", user.id),
           supabase.from("company").delete().eq("user_id", user.id),
           supabase.from("user_profiles").delete().eq("id", user.id),
         ]);
   
         console.log("Deletion results:");
         deletions.forEach((result, index) => {
           console.log(
             `Deletion ${index}:`,
             result.error ? result.error : "Success"
           );
         });
   
         toast.success("Account deletion process completed.");
         return true;
       } catch (error) {
         console.error("Error in account deletion:", error);
         toast.error("Failed to delete account. Please try again later.");
         return false;
       }
     };
   
     const handleDeleteAccountFromClerk = async () => {
       try {
         await deleteUserWithReverification();
         navigate("/login");
       } catch (error) {
         console.error("Error deleting user in Clerk:", error);
       }
     };
   
     const handleDeleteAccount = async () => {
       if (!user?.id) return;
   
       try {
         await handleDeleteAccountInSupabase();
         await handleDeleteAccountFromClerk();
       } catch (error) {
         console.error("Error deleting account:", error);
       }
     };

  return (
    <div className="space-y-6 max-w-4xl">

 {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowDeleteModal(false); // Close the modal
              }}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)} // Close the modal without deleting
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteAccount} // Proceed with account deletion
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <CardTitle>Company Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) =>
                  setCompanyName(e.target.value.replace(/^\s+/, ""))
                }
              />
              {companyErrors.companyName && (
                <p className="text-sm text-red-600 mt-1">
                  {companyErrors.companyName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="company-email">Company Email</Label>
              <Input
                id="company-email"
                type="email"
                value={companyEmail}
                onChange={(e) => {
                  const rawValue = e.target.value;

                  // Strip leading space(s)
                  if (rawValue.length === 1 && rawValue.startsWith(" ")) {
                    // Block single leading space
                    return;
                  }

                  // Block paste with leading spaces
                  const cleanedValue = rawValue.replace(/^\s+/, "");
                  setCompanyEmail(cleanedValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === " " && companyEmail.length === 0) {
                    e.preventDefault();
                  }
                }}
                
              />

              {companyErrors.companyEmail && (
                <p className="text-sm text-red-600 mt-1">
                  {companyErrors.companyEmail}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="company-address">Address</Label>
            <Input
              id="company-address"
              value={companyAddress}
              onChange={(e) =>
                setCompanyAddress(e.target.value.replace(/^\s+/, ""))
              }
            />
            {companyErrors.companyAddress && (
              <p className="text-sm text-red-600 mt-1">
                {companyErrors.companyAddress}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-phone">Phone</Label>
              <Input
                id="company-phone"
                value={companyPhone}
                onChange={(e) =>
                  setCompanyPhone(e.target.value.replace(/^\s+/, ""))
                }
              />
              {companyErrors.companyPhone && (
                <p className="text-sm text-red-600 mt-1">
                  {companyErrors.companyPhone}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                value={companyWebsite}
                onChange={(e) =>
                  setCompanyWebsite(e.target.value.replace(/^\s+/, ""))
                }
              />
              {companyErrors.companyWebsite && (
                <p className="text-sm text-red-600 mt-1">
                  {companyErrors.companyWebsite}
                </p>
              )}
            </div>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleInsertCompany}
          >
            Update Company Details
          </Button>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <CardTitle>Profile Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user?.primaryEmailAddress?.emailAddress}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={passwordErrors.newPassword ? "border-red-500" : ""}
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={
                  passwordErrors.confirmPassword ? "border-red-500" : ""
                }
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => handleUpdateProfile()}
            className="bg-[#16A34A] hover:bg-[#15803D]"
          >
            Update Profile
          </Button>
        </CardContent>
      </Card>
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Interview Reminders</h4>
              <p className="text-sm text-gray-600">
                Get notified 1 hour before interviews
              </p>
            </div>
            <Switch
              checked={preferences?.notifications?.interviewReminders}
              onCheckedChange={() =>
                handleNotificationToggle("interviewReminders")
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Candidate Check-ins</h4>
              <p className="text-sm text-gray-600">
                Notify when candidates check into rooms
              </p>
            </div>
            <Switch
              checked={preferences?.notifications?.candidateCheckins}
              onCheckedChange={() =>
                handleNotificationToggle("candidateCheckins")
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Booking Confirmations</h4>
              <p className="text-sm text-gray-600">
                Email confirmations for new bookings
              </p>
            </div>
            <Switch
              checked={preferences?.notifications?.bookingConfirmations}
              onCheckedChange={() =>
                handleNotificationToggle("bookingConfirmations")
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Weekly Reports</h4>
              <p className="text-sm text-gray-600">
                Summary of interview activity
              </p>
            </div>
            <Switch
              checked={preferences?.notifications?.weeklyReports}
              onCheckedChange={() => handleNotificationToggle("weeklyReports")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Default Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Default Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Show Only Verified Rooms</h4>
              <p className="text-sm text-gray-600">
                Only display FaceDesk verified spaces
              </p>
            </div>
            <Switch
              checked={preferences?.defaults?.showOnlyVerifiedRooms}
              onCheckedChange={() =>
                handleDefaultToggle("showOnlyVerifiedRooms")
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Require ID Verification</h4>
              <p className="text-sm text-gray-600">
                Candidates must verify ID before interviews
              </p>
            </div>
            <Switch
              checked={preferences?.defaults?.requireIdVerification}
              onCheckedChange={() =>
                handleDefaultToggle("requireIdVerification")
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto-record Interviews</h4>
              <p className="text-sm text-gray-600">
                Automatically record all interviews
              </p>
            </div>
            <Switch
              checked={preferences?.defaults?.autoRecordInterviews}
              onCheckedChange={() =>
                handleDefaultToggle("autoRecordInterviews")
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <CardTitle>Team Members</CardTitle>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getRoleBadge(member.role)}>
                    {member.role}
                  </Badge>
                  <Badge className={getStatusBadge(member.status)}>
                    {member.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h4 className="font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-700">
                Permanently delete your account and all data
              </p>
            </div>
           <Button
                         variant="destructive"
                         size="sm"
                         onClick={() => {
                           setShowDeleteModal(true); // Show confirmation modal
                         }}
                       >
                         Delete Account
                       </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterpriseSettings;
