
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, User, Menu, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';

interface ProviderHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ProviderHeader = ({ sidebarOpen, setSidebarOpen }: ProviderHeaderProps) => {
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
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => navigate('/provider/add-room')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Room
        </Button>
        
        <Button variant="ghost" size="sm">
          <Bell className="w-5 h-5" />
        </Button>
         <UserButton
          userProfileMode="navigation"
          userProfileUrl="/provider/settings"
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

export default ProviderHeader;
