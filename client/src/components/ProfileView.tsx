import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface ProfileViewProps {
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const { userProfile, updateProfile, uploadAvatar, logout } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState(userProfile?.username || '');
  const [about, setAbout] = useState(userProfile?.about || 'Available');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const handleUpdateName = async () => {
    if (!username.trim()) {
      toast({
        title: 'Error',
        description: 'Username cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await updateProfile({ username });
      setIsEditingName(false);
      toast({
        title: 'Success',
        description: 'Your name has been updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update name',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateAbout = async () => {
    if (!about.trim()) {
      toast({
        title: 'Error',
        description: 'About cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await updateProfile({ about });
      setIsEditingAbout(false);
      toast({
        title: 'Success',
        description: 'Your about info has been updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update about',
        variant: 'destructive',
      });
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload avatar
      handleUploadAvatar(file);
    }
  };
  
  const handleUploadAvatar = async (file: File) => {
    try {
      await uploadAvatar(file);
      toast({
        title: 'Success',
        description: 'Profile picture updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload profile picture',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteAccount = async () => {
    try {
      // In a real app, we would call an API to delete the account
      // For now, just log the user out
      await logout();
      toast({
        title: 'Account deleted',
        description: 'Your account has been successfully deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="flex flex-col flex-1 bg-white">
      <div className="p-3 bg-primary-dark text-white flex items-center">
        <button className="md:hidden mr-2" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h2 className="font-medium">Profile</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="bg-primary pb-6 pt-10 flex flex-col items-center">
          <div className="relative group">
            <div className="h-32 w-32 rounded-full bg-netgray-200 flex items-center justify-center overflow-hidden border-4 border-white">
              <img 
                src={avatarPreview || userProfile?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.username || 'User')}&background=128C7E&color=fff&size=128`} 
                alt="Your profile" 
                className="h-full w-full object-cover"
              />
            </div>
            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary-light text-white rounded-full p-2 shadow cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <input 
                id="avatar-upload" 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-netgray-400 text-sm mb-1">Your Name</h3>
            {isEditingName ? (
              <div className="flex flex-col space-y-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="border-primary focus:ring-primary"
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUsername(userProfile?.username || '');
                      setIsEditingName(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateName}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-netgray-600">{userProfile?.username}</p>
                <button 
                  className="text-primary"
                  onClick={() => setIsEditingName(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="text-xs text-netgray-400 mb-6">
            This is not your username or pin. This name will be visible to your NetChat contacts.
          </div>
          
          <div className="mb-6">
            <h3 className="text-netgray-400 text-sm mb-1">About</h3>
            {isEditingAbout ? (
              <div className="flex flex-col space-y-2">
                <Textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell people about yourself"
                  className="border-primary focus:ring-primary"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAbout(userProfile?.about || 'Available');
                      setIsEditingAbout(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateAbout}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-netgray-600">{userProfile?.about}</p>
                <button 
                  className="text-primary"
                  onClick={() => setIsEditingAbout(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-netgray-400 text-sm mb-1">Email</h3>
            <p className="text-netgray-600">{userProfile?.email}</p>
          </div>
          
          <div className="border-t border-netgray-200 pt-6">
            <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  <span>Delete My Account</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-netgray-600">
                    Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
                  </p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Delete Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
