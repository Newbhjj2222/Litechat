import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateStatusModal: React.FC<CreateStatusModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [caption, setCaption] = useState('');
  const [statusContent, setStatusContent] = useState<string | null>(null);
  const [statusFile, setStatusFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<'image' | 'text'>('image');
  const [textContent, setTextContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Create status mutation
  const createStatusMutation = useMutation({
    mutationFn: async () => {
      if (!userProfile) throw new Error('User not logged in');
      
      let content: string;
      
      if (contentType === 'image') {
        if (!statusContent) throw new Error('Please select an image for your status');
        content = statusContent;
      } else {
        if (!textContent.trim()) throw new Error('Please enter text for your status');
        content = textContent;
      }
      
      const statusData = {
        userId: userProfile.id,
        content,
        contentType,
        caption: caption.trim() || undefined
      };
      
      return apiRequest('POST', '/api/statuses', statusData);
    },
    onSuccess: () => {
      // Reset form
      setCaption('');
      setStatusContent(null);
      setStatusFile(null);
      setTextContent('');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      if (userProfile) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userProfile.id}/statuses`] });
      }
      
      toast({
        title: 'Status created',
        description: 'Your status has been posted successfully',
      });
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create status',
        variant: 'destructive',
      });
    }
  });
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };
  
  const handleFile = (file?: File) => {
    if (!file) return;
    
    setStatusFile(file);
    setContentType('image');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setStatusContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStatusMutation.mutate();
  };
  
  const toggleContentType = () => {
    setContentType(prev => prev === 'image' ? 'text' : 'image');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Status</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-end mb-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={toggleContentType}
            >
              {contentType === 'image' ? 'Switch to Text' : 'Switch to Image'}
            </Button>
          </div>
          
          {contentType === 'image' ? (
            <div 
              className={`bg-netgray-100 border-2 ${isDragging ? 'border-primary' : 'border-dashed border-netgray-300'} rounded-lg p-8 flex flex-col items-center justify-center text-center mb-4`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {statusContent ? (
                <div className="w-full">
                  <img 
                    src={statusContent} 
                    alt="Status preview" 
                    className="max-h-48 mx-auto object-contain mb-2"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setStatusContent(null);
                      setStatusFile(null);
                    }}
                    className="mt-2"
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-netgray-400 mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <p className="text-netgray-500 mb-2">Drag & drop a photo here</p>
                  <label htmlFor="status-file" className="px-4 py-2 mt-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary-dark transition-colors">
                    Select from Gallery
                    <input 
                      id="status-file" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label htmlFor="statusText" className="block text-sm font-medium text-netgray-600 mb-1">Status Text</label>
              <textarea
                id="statusText"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 border border-netgray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                required
              />
            </div>
          )}
          
          <div>
            <label htmlFor="statusCaption" className="block text-sm font-medium text-netgray-600 mb-1">Add a caption (optional)</label>
            <Input
              id="statusCaption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-2 border border-netgray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type a caption..."
            />
          </div>
          
          <div className="text-sm text-netgray-500">
            Your status will automatically expire after 3 days.
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                (contentType === 'image' && !statusContent) || 
                (contentType === 'text' && !textContent.trim()) || 
                createStatusMutation.isPending
              }
            >
              {createStatusMutation.isPending ? 'Posting...' : 'Post Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStatusModal;
