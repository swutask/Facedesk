import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Calendar,
  Users,
  CreditCard,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface EnterpriseSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    to: "/enterprise/dashboard",
  },
  {
    id: "bookings",
    label: "My Bookings",
    icon: Calendar,
    to: "/enterprise/bookings",
  },
  {
    id: "candidates",
    label: "Candidates",
    icon: Users,
    to: "/enterprise/candidates",
  },
  {
    id: "billing",
    label: "Billing & Usage",
    icon: CreditCard,
    to: "/enterprise/billing",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    to: "/enterprise/settings",
  },
];

const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeId = (() => {
    const p = location.pathname;
    if (p === "/enterprise" || p === "/enterprise/") return "dashboard";
    if (p.startsWith("/enterprise/dashboard")) return "dashboard";
    if (p.startsWith("/enterprise/bookings")) return "bookings";
    if (p.startsWith("/enterprise/candidates")) return "candidates";
    if (p.startsWith("/enterprise/billing")) return "billing";
    if (p.startsWith("/enterprise/settings")) return "settings";
    return "dashboard";
  })();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300",
          isOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/Facedeskent.png"
                alt="FaceDesk Icon"
                className="w-full h-full object-cover"
              />
            </div>

            {isOpen && (
              <span className="text-xl font-bold text-gray-900">FaceDesk</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map(({ id, label, icon: Icon, to }) => {
            const isActive = activeId === id;
            return (
              <Button
                key={id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12",
                  isActive && "bg-blue-50 text-blue-700 border border-blue-200",
                  !isOpen && "px-3"
                )}
                onClick={() => navigate(to)}
              >
                <Icon className="w-5 h-5" />
                {isOpen && <span className="ml-3">{label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Toggle */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default EnterpriseSidebar;
