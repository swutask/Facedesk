import React, { useState, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";

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

const ProviderSettings = () => {
  const { user, isLoaded } = useUser(); // Clerk hook to get current user
  const userId = user?.id; // Get user ID from Clerk
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleUpdateProfile = async () => {
    if (!isLoaded || !user) return;

    // Update Supabase Profile
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Error updating Supabase profile: " + error.message);
      return;
    }

    try {
      // Update Clerk User Profile
      await user.update({
        firstName: firstName,
        lastName: lastName,
      });

      // Optional: If updating password
      if (currentPassword && newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("New password and confirmation do not match.");
          return;
        }
        try {
          await updatePassword({
            currentPassword: currentPassword,
            newPassword: newPassword,
          });
          toast.success("Password updated successfully!");
        } catch (error) {
          // Handle reverification required or other errors
          console.error("Error updating password:", error);
          if (error.code === "session_reverification_required") {
            // Handle reverification logic
            console.log("Reverification required");
          } else {
            toast.error(`Error updating password: ${error.message}`);
          }
        }
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Error updating Clerk profile: " + error.message);
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

  const [preferences, setPreferences] = useState<Preferences | null>(null);

  const fetchPreferences = async () => {
    if (supabase) {
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
    }
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
        .ilike("id", user.id); // Case-insensitive match
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
        supabase.from("rooms").select("id").eq("user_id", user.id),
        supabase
          .from("user_preferences")
          .select("user_id")
          .eq("user_id", user.id),
        supabase.from("company").select("id").eq("user_id", user.id),
      ]);

      console.log("Pre-deletion check results:");
      console.log("User profiles:", checks[0].data?.length || 0);
      console.log("Candidates:", checks[1].data?.length || 0);
      console.log("Rooms:", checks[2].data?.length || 0);
      console.log("Preferences:", checks[3].data?.length || 0);
      console.log("Company:", checks[4].data?.length || 0);

      // Delete data
      const deletions = await Promise.all([
        supabase.from("candidates").delete().eq("company_user_id", user.id),
        supabase.from("rooms").delete().eq("user_id", user.id),
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
      if (!user?.id) return;
      await user.delete();
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
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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

export default ProviderSettings;
