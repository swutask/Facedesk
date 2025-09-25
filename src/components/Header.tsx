import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect if current route is login or register
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

      const handleClick = () => {
        navigate("/");
      };

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center"
              onClick={handleClick}
            >
              <span className="text-white font-bold text-sm">FD </span>
            </div>
            <span className="text-2xl font-bold text-gray-900">FaceDesk</span>
          </div>

          {/* Nav links — hidden on /login and /register */}
          {!isAuthPage && (
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                How It Works
              </a>
              <a
                href="#benefits"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Benefits
              </a>
              <a
                href="#for-whom"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Solutions
              </a>
              <a
                href="#trust"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Security
              </a>
            </nav>
          )}

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-blue-600"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              onClick={() => navigate("/register")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
