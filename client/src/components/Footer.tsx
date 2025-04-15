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
        {/* WhatsApp-style bottom nav - fixed at bottom on mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="flex justify-around py-2 px-2">
            <Link href="/chats" className="footer-link">
              <MessageSquare className="h-6 w-6 text-[#25d366]" />
              <span className="text-[#075e54] text-[10px] font-medium">CHATS</span>
            </Link>
            
            <Link href="/status" className="footer-link">
              <Camera className="h-6 w-6 text-gray-500" />
              <span className="text-[#303030] text-[10px]">STATUS</span>
            </Link>
            
            <Link href="/calls" className="footer-link">
              <Phone className="h-6 w-6 text-gray-500" />
              <span className="text-[#303030] text-[10px]">CALLS</span>
            </Link>
          </div>
        </div>
        
        {/* Desktop nav tabs */}
        <div className="hidden md:flex justify-between py-3 px-2 border-b border-gray-300">
          <Link href="/chats" className="footer-link">
            <MessageSquare className="h-6 w-6 text-[#25d366]" />
            <span className="text-[#075e54] font-medium">CHATS</span>
          </Link>
          
          <Link href="/status" className="footer-link">
            <Camera className="h-6 w-6 text-gray-500" />
            <span className="text-[#303030]">STATUS</span>
          </Link>
          
          <Link href="/calls" className="footer-link">
            <Phone className="h-6 w-6 text-gray-500" />
            <span className="text-[#303030]">CALLS</span>
          </Link>
        </div>
        
        {/* WhatsApp-style links section */}
        <div className="py-4 px-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-[#075e54] mb-2 text-sm md:text-base">NetChat</h3>
              <ul className="space-y-1 text-xs md:text-sm">
                <li><Link href="/features" className="text-[#303030] hover:text-[#25d366]">Features</Link></li>
                <li><Link href="/web" className="text-[#303030] hover:text-[#25d366]">Web</Link></li>
                <li><Link href="/security" className="text-[#303030] hover:text-[#25d366]">Security</Link></li>
                <li><Link href="/download" className="text-[#303030] hover:text-[#25d366]">Download</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#075e54] mb-2 text-sm md:text-base">Company</h3>
              <ul className="space-y-1 text-xs md:text-sm">
                <li><Link href="/about" className="text-[#303030] hover:text-[#25d366]">About</Link></li>
                <li><Link href="/privacy" className="text-[#303030] hover:text-[#25d366]">Privacy</Link></li>
                <li><Link href="/help" className="text-[#303030] hover:text-[#25d366]">Help Center</Link></li>
                <li><Link href="/contact" className="text-[#303030] hover:text-[#25d366]">Contact Us</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs text-[#4a4a4a] dark:text-gray-400 py-3 mb-14 md:mb-0 border-t border-gray-300">
          <p>© {new Date().getFullYear()} NetChat. From Meta</p>
          <p className="mt-1">Messages and status updates expire automatically after 7 days.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;