import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/useAuth';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Users2, X, Camera } from 'lucide-react';
import UserList from './UserList';

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
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [groupIconFile, setGroupIconFile] = useState<File | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  
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
      for (const user of selectedUsers) {
        await apiRequest('POST', `/api/groups/${group.id}/members`, {
          userId: user.id,
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
  
  const handleSelectUsers = (users: User[]) => {
    setSelectedUsers(users);
    setShowUserSelector(false);
  };
  
  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGroupMutation.mutate();
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={showUserSelector ? "sm:max-w-lg" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {showUserSelector ? "Select Group Members" : "Create New Group"}
          </DialogTitle>
        </DialogHeader>
        
        {showUserSelector ? (
          <div className="py-2">
            <UserList 
              onSelectUsers={handleSelectUsers}
              selectedUserIds={selectedUsers.map(user => user.id)}
              showSearch={true}
              showSelect={true}
              title=""
              buttonText="Done"
              excludeCurrentUser={true}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-netgray-200 flex items-center justify-center overflow-hidden border-2 border-primary">
                  {groupIcon ? (
                    <img src={groupIcon} alt="Group" className="h-full w-full object-cover" />
                  ) : (
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="text-2xl bg-primary/20">
                        {groupName ? getInitials(groupName) : "G"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <input 
                  type="file" 
                  id="groupIcon" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="image/*"
                  onChange={handleGroupIconChange}
                />
                <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow">
                  <Camera className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium mb-1">
                Group Name
              </label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for your group"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Members</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUserSelector(true)}
                  className="flex items-center gap-1"
                >
                  <Users2 className="h-3.5 w-3.5" />
                  Add Members
                </Button>
              </div>
              
              {selectedUsers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedUsers.map(user => (
                    <div 
                      key={user.id}
                      className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        {user.profilePicture ? (
                          <AvatarImage src={user.profilePicture} alt={user.username} />
                        ) : (
                          <AvatarFallback>
                            {getInitials(user.username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm truncate flex-1">{user.username}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <Users2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No members added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Members" to select users</p>
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;