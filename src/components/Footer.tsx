
import { Facebook, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FD</span>
              </div>
              <span className="text-2xl font-bold text-white">FaceDesk</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Revolutionizing remote interviews with verified, monitored spaces that ensure integrity and fairness.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400 transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 FaceDesk. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
