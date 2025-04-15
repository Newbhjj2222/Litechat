import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AvatarWithStatus } from '@/components/ui/avatar-with-status';
import { useAuth } from '@/lib/useAuth';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [groupIconFile, setGroupIconFile] = useState<File | null>(null);
  
  // Get all users for selection
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: isOpen
  });
  
  // Filter users based on search query and exclude current user
  const filteredUsers = (users as User[])
    .filter(user => userProfile && user.id !== userProfile.id)
    .filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (!userProfile) throw new Error('User not logged in');
      if (!groupName.trim()) throw new Error('Group name is required');
      
      // Create the group
      const groupData = {
        name: groupName.trim(),
        description: description.trim() || undefined,
        creatorId: userProfile.id,
        profilePicture: groupIcon || undefined
      };
      
      const response = await apiRequest('POST', '/api/groups', groupData);
      const group = await response.json();
      
      // Add selected members to the group
      for (const userId of selectedUsers) {
        await apiRequest('POST', `/api/groups/${group.id}/members`, {
          userId,
          isAdmin: false,
          canWrite: true
        });
      }
      
      return group;
    },
    onSuccess: () => {
      // Reset form
      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
      setGroupIcon(null);
      setGroupIconFile(null);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userProfile?.id}/groups`] });
      
      toast({
        title: 'Group created',
        description: 'Your new group has been created successfully',
      });
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create group',
        variant: 'destructive',
      });
    }
  });
  
  const handleGroupIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupIconFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setGroupIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const toggleUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGroupMutation.mutate();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-netgray-600 mb-1">Group Icon</label>
            <div className="flex justify-center">
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-netgray-200 flex items-center justify-center overflow-hidden">
                  {groupIcon ? (
                    <img src={groupIcon} alt="Group icon" className="h-full w-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-netgray-400">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  )}
                </div>
                <label htmlFor="group-icon-upload" className="absolute bottom-0 right-0 bg-primary-light text-white rounded-full p-2 shadow-md cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  <input 
                    id="group-icon-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleGroupIconChange}
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-netgray-600 mb-1">Group Name</label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-2 border border-netgray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter group name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="groupDescription" className="block text-sm font-medium text-netgray-600 mb-1">Description (optional)</label>
            <Input
              id="groupDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-netgray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter group description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-netgray-600 mb-1">Add Participants</label>
            <Input
              type="text"
              className="w-full p-2 border border-netgray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-2"
              placeholder="Search contacts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="max-h-40 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-2 text-netgray-500">Loading contacts...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-2 text-netgray-500">No contacts found</div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center p-2 hover:bg-netgray-100 rounded-md">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                      className="mr-3"
                    />
                    <AvatarWithStatus
                      src={user.profilePicture}
                      alt={user.username}
                      fallback={user.username.substring(0, 2).toUpperCase()}
                      className="mr-3"
                    />
                    <label htmlFor={`user-${user.id}`} className="text-netgray-600 cursor-pointer flex-1">
                      {user.username}
                    </label>
                  </div>
                ))
              )}
            </div>
            
            {selectedUsers.length > 0 && (
              <div className="mt-2 text-sm text-netgray-500">
                {selectedUsers.length} {selectedUsers.length === 1 ? 'participant' : 'participants'} selected
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createGroupMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!groupName.trim() || selectedUsers.length === 0 || createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
