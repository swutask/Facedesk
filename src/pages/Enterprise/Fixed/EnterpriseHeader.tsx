import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Bell, User, Menu } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

interface EnterpriseHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const EnterpriseHeader = ({
  sidebarOpen,
  setSidebarOpen,
}: EnterpriseHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          onClick={() => navigate("/enterprise/booking")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Book a Room
        </Button>

        <Button variant="ghost" size="sm">
          <Bell className="w-5 h-5" />
        </Button>

        {/* <Button variant="ghost" size="sm">
          <User className="w-5 h-5" />
        </Button> */}

        <UserButton
          userProfileMode="navigation"
          userProfileUrl="/enterprise/settings"
          appearance={{
            elements: {
              userButtonPopoverFooter: {
                display: "none", // hides "Manage account"
              },
            },
          }}
        />
      </div>
    </header>
  );
};

export default EnterpriseHeader;
