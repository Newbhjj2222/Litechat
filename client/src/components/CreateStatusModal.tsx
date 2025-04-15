import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Eye, TrendingUp, User, Link as LinkIcon } from 'lucide-react';

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
  const [isSponsor, setIsSponsor] = useState(false);
  const [targetAudience, setTargetAudience] = useState('all');
  const [externalLink, setExternalLink] = useState('');
  
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
        caption: caption.trim() || undefined,
        isSponsor,
        targetAudience: isSponsor ? targetAudience : 'all',
        externalLink: isSponsor && externalLink ? externalLink : undefined
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
          
          <div className="space-y-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isSponsor" 
                checked={isSponsor}
                onCheckedChange={(checked) => setIsSponsor(checked as boolean)}
              />
              <Label
                htmlFor="isSponsor"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <TrendingUp className="h-4 w-4 mr-1 text-amber-600" />
                Post as Sponsored Advertisement
              </Label>
            </div>
            
            {isSponsor && (
              <div className="space-y-2 pl-6">
                <div className="grid grid-cols-1 gap-1">
                  <Label htmlFor="externalLink" className="text-xs">
                    <LinkIcon className="h-3 w-3 inline mr-1" />
                    External Link (optional)
                  </Label>
                  <Input
                    id="externalLink"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://example.com"
                    className="text-xs h-8"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-1">
                  <Label htmlFor="targetAudience" className="text-xs">
                    <User className="h-3 w-3 inline mr-1" />
                    Target Audience
                  </Label>
                  <select
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="h-8 text-xs rounded-md border border-netgray-300 bg-transparent px-3 py-1"
                  >
                    <option value="all">Everyone</option>
                    <option value="followers">My Contacts Only</option>
                    <option value="groups">Group Members Only</option>
                  </select>
                </div>
                
                <div className="flex items-center text-xs text-amber-600">
                  <Eye className="h-3 w-3 mr-1" />
                  Sponsored statuses track view counts
                </div>
              </div>
            )}
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
