import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useSupabase } from "@/context/supabaseContext";
import { useEffect, useState } from "react";

export default function SelectRole() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { supabase, loading: supabaseLoading } = useSupabase(); // ✅ get loading flag too

  const [selectedRole, setSelectedRole] = useState<
    "enterprise" | "provider" | ""
  >("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if user already has a role

  useEffect(() => {
    if (user?.unsafeMetadata?.role) {
      const role = user.unsafeMetadata.role;
      if (role === "enterprise") navigate("/enterprise");
      else if (role === "provider") navigate("/provider");
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }

    if (!supabase || supabaseLoading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Step 1: Update Clerk metadata
      await user?.update({
        unsafeMetadata: { role: selectedRole },
      });

      // Step 2: Insert into Supabase
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          user_role: selectedRole,
        });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }

      // Step 3: Redirect
      navigate(selectedRole === "enterprise" ? "/enterprise" : "/provider");
    } catch (err) {
      console.error(err);
      setError("Failed to assign role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-100 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src="/Facedeskent.png"
                alt="FD"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mt-4">
            FaceDesk
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Select your desired role to continue
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4 text-left"
        >
          <label className="block p-4 bg-white rounded-lg border shadow hover:border-blue-500 group cursor-pointer">
            <input
              type="radio"
              name="role"
              value="enterprise"
              checked={selectedRole === "enterprise"}
              onChange={() => setSelectedRole("enterprise")}
              className="mr-3"
            />
            <span className="font-medium text-gray-900 group-hover:text-blue-600">
              Enterprise Dashboard
            </span>
            <p className="text-sm text-gray-500 ml-6">
              Book interview rooms and manage candidates
            </p>
          </label>

          <label className="block p-4 bg-white rounded-lg border shadow hover:border-purple-500 group cursor-pointer">
            <input
              type="radio"
              name="role"
              value="provider"
              checked={selectedRole === "provider"}
              onChange={() => setSelectedRole("provider")}
              className="mr-3"
            />
            <span className="font-medium text-gray-900 group-hover:text-purple-600">
              Space Provider Dashboard
            </span>
            <p className="text-sm text-gray-500 ml-6">
              Manage co-working spaces and bookings
            </p>
          </label>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading || supabaseLoading}
            className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading || supabaseLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </section>
  );
}
