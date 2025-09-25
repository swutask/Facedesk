import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import EnterpriseHeader from "@/pages/Enterprise/Fixed/EnterpriseHeader";
import EnterpriseSidebar from "../Fixed/EnterpriseSidebar";

const EnterpriseLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !user) navigate("/login");
  }, [isLoaded, user, navigate]);

  if (!isLoaded) return null; // or a loader/skeleton

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <EnterpriseSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        <EnterpriseHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 p-6">
          {/* Child routes render here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EnterpriseLayout;
