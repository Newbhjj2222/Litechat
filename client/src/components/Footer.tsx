import React from 'react';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  Phone, 
  Camera, 
  Users2, 
  Settings
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#f6f6f6] dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 w-full">
      <div className="container mx-auto px-2">
        {/* WhatsApp-style bottom nav */}
        <div className="flex justify-between py-3 px-2 border-b border-gray-300">
          <Link href="/chats" className="footer-link">
            <MessageSquare className="h-6 w-6 text-green-600" />
            <span className="text-green-700 font-medium">CHATS</span>
          </Link>
          
          <Link href="/status" className="footer-link">
            <Camera className="h-6 w-6 text-gray-500" />
            <span>STATUS</span>
          </Link>
          
          <Link href="/calls" className="footer-link">
            <Phone className="h-6 w-6 text-gray-500" />
            <span>CALLS</span>
          </Link>
        </div>
        
        {/* WhatsApp-style links section */}
        <div className="py-4 px-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">NetChat</h3>
              <ul className="space-y-1 text-sm">
                <li><Link href="/features" className="text-gray-600 hover:text-green-600">Features</Link></li>
                <li><Link href="/web" className="text-gray-600 hover:text-green-600">Web</Link></li>
                <li><Link href="/security" className="text-gray-600 hover:text-green-600">Security</Link></li>
                <li><Link href="/download" className="text-gray-600 hover:text-green-600">Download</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Company</h3>
              <ul className="space-y-1 text-sm">
                <li><Link href="/about" className="text-gray-600 hover:text-green-600">About</Link></li>
                <li><Link href="/privacy" className="text-gray-600 hover:text-green-600">Privacy</Link></li>
                <li><Link href="/help" className="text-gray-600 hover:text-green-600">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-green-600">Contact Us</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-3 border-t border-gray-300">
          <p>© {new Date().getFullYear()} NetChat. From Meta</p>
          <p className="mt-1">Messages and status updates expire automatically after 7 days.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;