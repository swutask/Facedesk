// src/pages/SpaceProvider/ProviderLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import ProviderHeader from "@/pages/SpaceProvider/Fixed/ProviderHeader";
import ProviderSidebar from "../Fixed/ProviderSidebar";

const ProviderLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isLoaded && !user) navigate("/login");
  }, [isLoaded, user, navigate]);

  if (!isLoaded) return null; // or a skeleton/loader

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ProviderSidebar
        // optional: pass a prop to highlight active based on location in the sidebar itself
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        <ProviderHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 p-6">
          {/* This renders the matched child route */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;
