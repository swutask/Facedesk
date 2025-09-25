import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Calendar,
  CreditCard,
  CheckCircle,
  Bed,
  Menu,
  X,
  HelpCircle,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

interface ProviderSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ProviderSidebar = ({ isOpen, setIsOpen }: ProviderSidebarProps) => {
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/provider/dashboard",
    },
    { id: "rooms", label: "My Rooms", icon: Bed, path: "/provider/rooms" },
    {
      id: "bookings",
      label: "Bookings",
      icon: Calendar,
      path: "/provider/bookings",
    },
    {
      id: "earnings",
      label: "Earnings & Payouts",
      icon: CreditCard,
      path: "/provider/earnings",
    },
    {
      id: "verification",
      label: "Verification Center",
      icon: CheckCircle,
      path: "/provider/verification",
    },
    {
      id: "support",
      label: "Terms & Support",
      icon: HelpCircle,
      path: "/provider/support",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/provider/settings", 
    },
  ];

  // Treat both /provider and /provider/dashboard as active for "Dashboard"
  const isRouteActive = (path: string) => {
    if (path === "/provider/dashboard") {
      return (
        location.pathname === "/provider" ||
        location.pathname.startsWith("/provider/dashboard")
      );
    }
    return location.pathname.startsWith(path);
  };

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
                src="/Facedeskprv.png"
                alt="FaceDesk Icon"
                className="w-full h-full object-cover"
              />
            </div>
            {isOpen && (
              <span className="text-xl font-bold text-gray-900">
                FaceDesk Partner
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.path);

            return (
              <Button
                key={item.id}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12",
                  active &&
                    "bg-green-50 text-green-700 border border-green-200",
                  !isOpen && "px-3"
                )}
              >
                <NavLink to={item.path}>
                  <Icon className="w-5 h-5" />
                  {isOpen && <span className="ml-3">{item.label}</span>}
                </NavLink>
              </Button>
            );
          })}
        </nav>

        {/* Toggle button */}
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

export default ProviderSidebar;
