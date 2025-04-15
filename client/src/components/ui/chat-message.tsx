import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  contentType?: 'text' | 'image' | 'file';
  timestamp: Date;
  isOwn: boolean;
  isRead?: boolean;
  sender?: string;
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  contentType = 'text',
  timestamp,
  isOwn,
  isRead,
  sender,
  className,
}) => {
  const bubbleClass = isOwn ? 'chat-bubble-mine' : 'chat-bubble-other';
  const triangleClass = isOwn ? 'triangle-left' : 'triangle-right';
  
  return (
    <div className={cn('flex mb-4', isOwn ? 'justify-end' : '', className)}>
      <div className="relative max-w-xs md:max-w-md">
        <div className={cn(bubbleClass, 'p-2 shadow-sm')}>
          {sender && !isOwn && (
            <p className="text-xs font-medium text-primary mb-1">{sender}</p>
          )}
          
          {contentType === 'text' && (
            <p className="text-netgray-600">{content}</p>
          )}
          
          {contentType === 'image' && (
            <div className="mb-2 rounded-lg overflow-hidden">
              <img src={content} alt="Shared content" className="w-full" />
            </div>
          )}
          
          {contentType === 'file' && (
            <div className="flex items-center p-2 bg-white/50 rounded border border-gray-200">
              <div className="mr-2 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <a href={content} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
                {content.split('/').pop()}
              </a>
            </div>
          )}
          
          <div className="flex justify-end items-center space-x-1 mt-1">
            <span className="text-xs text-netgray-400">
              {format(timestamp, 'h:mm a')}
            </span>
            {isOwn && (
              isRead 
                ? <CheckCheck className="h-3 w-3 text-blue-500" /> 
                : <Check className="h-3 w-3 text-netgray-400" />
            )}
          </div>
        </div>
        <div className={triangleClass}></div>
      </div>
    </div>
  );
};
