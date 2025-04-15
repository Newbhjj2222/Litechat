import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, UsersRound, X } from 'lucide-react';
import { User } from '@/types';
import { useAuth } from '@/lib/useAuth';

interface UserListProps {
  onSelectUsers: (selectedUsers: User[]) => void;
  selectedUserIds?: number[];
  showSearch?: boolean;
  showSelect?: boolean;
  title?: string;
  buttonText?: string;
  limit?: number;
  excludeCurrentUser?: boolean;
}

const UserList: React.FC<UserListProps> = ({
  onSelectUsers,
  selectedUserIds = [],
  showSearch = true,
  showSelect = true,
  title = "Select Users",
  buttonText = "Confirm Selection",
  limit,
  excludeCurrentUser = true,
}) => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<number[]>(selectedUserIds);

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Filter users based on search and exclude current user if needed
  const filteredUsers = users
    .filter((user: User) => {
      // Exclude current user if flag is true
      if (excludeCurrentUser && userProfile && user.id === userProfile.id) {
        return false;
      }
      
      // Filter by search term if provided
      if (searchTerm) {
        return (
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      return true;
    })
    .sort((a: User, b: User) => {
      // Show selected users first
      const aSelected = selected.includes(a.id);
      const bSelected = selected.includes(b.id);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // Otherwise sort by username
      return a.username.localeCompare(b.username);
    });

  // Sync selectedUserIds prop with internal state
  useEffect(() => {
    setSelected(selectedUserIds);
  }, [selectedUserIds]);

  const handleUserToggle = (userId: number) => {
    setSelected(prev => {
      // If user is already selected, remove them
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      
      // Check if we've reached the limit
      if (limit && prev.length >= limit) {
        return prev;
      }
      
      // Otherwise, add the user
      return [...prev, userId];
    });
  };

  const handleConfirm = () => {
    const selectedUsers = users.filter((user: User) => selected.includes(user.id));
    onSelectUsers(selectedUsers);
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
    <div className="space-y-4">
      {title && <h3 className="font-medium text-lg">{title}</h3>}
      
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      
      {limit && showSelect && (
        <div className="text-sm text-gray-500">
          {selected.length} of {limit} users selected
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading users...</div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No users match your search' : 'No users available'}
        </div>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
          {filteredUsers.map((user: User) => (
            <div 
              key={user.id}
              className={`flex items-center p-2 rounded-lg ${
                selected.includes(user.id) 
                  ? 'bg-primary/10' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => showSelect && handleUserToggle(user.id)}
              role={showSelect ? "button" : undefined}
              tabIndex={showSelect ? 0 : undefined}
            >
              {showSelect && (
                <Checkbox 
                  checked={selected.includes(user.id)}
                  className="mr-2"
                  tabIndex={-1}
                  disabled={!selected.includes(user.id) && limit && selected.length >= limit}
                />
              )}
              
              <Avatar className="h-10 w-10 mr-3">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.username} />
                ) : (
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                {user.email && (
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                )}
              </div>
              
              {selected.includes(user.id) && !showSelect && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserToggle(user.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showSelect && buttonText && (
        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="flex items-center gap-1"
          >
            {selected.length > 1 ? <UsersRound className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserList;