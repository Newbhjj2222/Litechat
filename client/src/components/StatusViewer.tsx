import React, { useState, useEffect, useCallback } from 'react';
import { Status, StatusView, User } from '@/types';
import { useAuth } from '@/lib/useAuth';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface StatusViewerProps {
  statusId: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const StatusViewer: React.FC<StatusViewerProps> = ({
  statusId,
  onClose,
  onNext,
  onPrevious
}) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [animating, setAnimating] = useState(true);
  
  // Get status details
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: [`/api/statuses/${statusId}`],
    enabled: !!statusId
  });
  
  // Get status owner
  const { data: statusOwner, isLoading: ownerLoading } = useQuery({
    queryKey: [status?.userId ? `/api/users/${status.userId}` : null],
    enabled: !!status?.userId
  });
  
  // Get status views
  const { data: views = [], isLoading: viewsLoading } = useQuery({
    queryKey: [`/api/statuses/${statusId}/views`],
    enabled: !!statusId
  });
  
  // View status mutation
  const viewMutation = useMutation({
    mutationFn: async () => {
      if (!userProfile) return null;
      
      return apiRequest('POST', `/api/statuses/${statusId}/views`, {
        viewerId: userProfile.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/statuses/${statusId}/views`] });
    }
  });
  
  // Record view when opening status
  useEffect(() => {
    if (userProfile && statusId && status?.userId !== userProfile.id) {
      viewMutation.mutate();
    }
  }, [userProfile, statusId, status?.userId]);
  
  // Status progress animation
  useEffect(() => {
    if (animating) {
      const duration = 5000; // 5 seconds
      const interval = 50; // Update every 50ms
      const increment = (interval / duration) * 100;
      
      const timer = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = prevProgress + increment;
          if (newProgress >= 100) {
            clearInterval(timer);
            setAnimating(false);
            if (onNext) {
              setTimeout(onNext, 500);
            }
            return 100;
          }
          return newProgress;
        });
      }, interval);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [animating, onNext]);
  
  // Key controls for navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' && onNext) {
      onNext();
    } else if (e.key === 'ArrowLeft' && onPrevious) {
      onPrevious();
    }
  }, [onClose, onNext, onPrevious]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Reset progress when status changes
  useEffect(() => {
    setProgress(0);
    setAnimating(true);
  }, [statusId]);
  
  if (statusLoading || ownerLoading) {
    return (
      <div className="flex flex-col flex-1 bg-black items-center justify-center">
        <div className="text-white">Loading status...</div>
      </div>
    );
  }
  
  if (!status || !statusOwner) {
    return (
      <div className="flex flex-col flex-1 bg-black items-center justify-center">
        <div className="text-white">Status not found</div>
        <button onClick={onClose} className="mt-4 text-white underline">
          Go back
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col flex-1 bg-black">
      <div className="relative h-full">
        {/* Status Header */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10">
          <button className="text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
              <img 
                src={statusOwner.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(statusOwner.username)}
                alt={statusOwner.username} 
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-medium text-white">{statusOwner.username}</h2>
              <p className="text-xs text-gray-300">
                {format(new Date(status.createdAt), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Status Progress Bar */}
        <div className="absolute top-14 left-0 right-0 flex px-3 space-x-1 z-10">
          <div className="h-1 bg-white bg-opacity-30 flex-1">
            <div 
              className="h-full bg-white transition-all duration-50 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Status Content */}
        <div className="h-full flex items-center justify-center">
          {status.contentType === 'image' ? (
            <img 
              src={status.content} 
              alt="Status content" 
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="max-w-lg p-6 text-white text-center bg-primary bg-opacity-90 rounded-lg">
              <p className="text-xl font-medium">{status.content}</p>
              {status.caption && (
                <p className="mt-2 text-white text-opacity-90">{status.caption}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Status Views */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mr-2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span className="text-white">{views.length} views</span>
            </div>
            <button className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusViewer;
