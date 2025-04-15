import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type StatusType = 'online' | 'away' | 'offline' | 'active' | 'partial' | 'none';

interface AvatarWithStatusProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: StatusType;
  className?: string;
  statusClassName?: string;
  onClick?: () => void;
}

const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  status = 'none',
  className,
  statusClassName,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-24 w-24',
  };

  const statusColors = {
    online: 'bg-primary-light',
    away: 'bg-amber-500',
    offline: 'bg-gray-400',
    active: 'bg-primary',
    partial: 'bg-primary',
    none: 'hidden',
  };

  const statusSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
    xl: 'h-5 w-5',
  };

  const getStatusClasses = () => {
    if (status === 'active' || status === 'partial') {
      return 'status-ring ' + (status === 'active' ? 'active' : 'partial');
    }
    return '';
  };

  return (
    <div className={cn('relative', className)} onClick={onClick}>
      <div 
        className={cn(
          'rounded-full border-2 border-white p-0.5',
          getStatusClasses()
        )}
      >
        <Avatar className={cn(sizeClasses[size], 'border-2 border-white')}>
          <AvatarImage src={src} alt={alt} />
          <AvatarFallback className="text-white bg-primary">
            {fallback || alt.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {status !== 'active' && status !== 'partial' && status !== 'none' && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            statusColors[status],
            statusSizes[size],
            statusClassName
          )}
        />
      )}
    </div>
  );
};

export { AvatarWithStatus };
