import React from 'react';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  Phone, 
  Camera, 
  Users2, 
  Settings, 
  HelpCircle, 
  Lock, 
  Info
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 w-full">
      <div className="container mx-auto">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-6 md:grid-cols-8">
            <Link href="/chats" className="footer-link">
              <MessageSquare className="h-5 w-5" />
              <span>Chats</span>
            </Link>
            
            <Link href="/calls" className="footer-link">
              <Phone className="h-5 w-5" />
              <span>Calls</span>
            </Link>
            
            <Link href="/status" className="footer-link">
              <Camera className="h-5 w-5" />
              <span>Status</span>
            </Link>
            
            <Link href="/groups" className="footer-link">
              <Users2 className="h-5 w-5" />
              <span>Groups</span>
            </Link>
            
            <Link href="/settings" className="footer-link">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            
            <Link href="/help" className="footer-link">
              <HelpCircle className="h-5 w-5" />
              <span>Help</span>
            </Link>
            
            <Link href="/privacy" className="footer-link">
              <Lock className="h-5 w-5" />
              <span>Privacy</span>
            </Link>
            
            <Link href="/about" className="footer-link">
              <Info className="h-5 w-5" />
              <span>About</span>
            </Link>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} NetChat. All rights reserved.</p>
            <p className="mt-1">Messages and status updates expire automatically.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;