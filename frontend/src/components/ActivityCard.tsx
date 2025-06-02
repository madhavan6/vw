
import React from 'react';
import { MousePointer, Keyboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivityCardProps {
  screenshot: string;
  activityLevel: number;
  mouseClicks: number;
  keyboardPresses: number;
  timeRange: string;
  onClick: () => void;
}

export function ActivityCard({ 
  screenshot, 
  activityLevel, 
  mouseClicks, 
  keyboardPresses, 
  timeRange,
  onClick 
}: ActivityCardProps) {
  const getActivityColor = (level: number) => {
    if (level >= 81) return 'bg-green-500';
    if (level >= 61) return 'bg-green-400';
    if (level >= 41) return 'bg-yellow-400';
    if (level >= 21) return 'bg-orange-400';
    if (level >= 1) return 'bg-red-400';
    return 'bg-gray-300';
  };

  const getActiveSegments = (level: number) => {
    if (level >= 81) return 5;
    if (level >= 61) return 4;
    if (level >= 41) return 3;
    if (level >= 21) return 2;
    if (level >= 1) return 1;
    return 0;
  };

  const activeSegments = getActiveSegments(activityLevel);

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-xs">
              {timeRange}
            </Badge>
            <span className="text-sm font-medium">{activityLevel}%</span>
          </div>
          
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img 
              src={`https://images.unsplash.com/${screenshot}`}
              alt="Activity screenshot"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5].map((segment) => (
                <div
                  key={segment}
                  className={`h-2 flex-1 rounded-sm ${
                    segment <= activeSegments 
                      ? getActivityColor(activityLevel)
                      : 'bg-gray-200 dark:bg-gray-700'
                  } ${segment <= activeSegments ? 'animate-pulse-activity' : ''}`}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MousePointer className="h-3 w-3" />
                <span>{mouseClicks}</span>
              </div>
              <div className="flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                <span>{keyboardPresses}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
