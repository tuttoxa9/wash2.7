import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <div className={cn("card-with-shadow animate-pulse", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-3 flex-1">
          {/* Основная информация */}
          <div className="h-5 bg-muted rounded-lg w-3/4"></div>

          {/* Дата и время */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-12"></div>
            </div>
          </div>

          {/* Клиент */}
          <div className="h-4 bg-muted rounded w-1/2"></div>

          {/* Статус */}
          <div className="h-6 bg-muted rounded-full w-24"></div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-muted rounded"></div>
          <div className="w-8 h-8 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
