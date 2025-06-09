
import React, { useEffect, useState } from 'react';
import { MousePointer, Keyboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { workDiaryApi } from './api';

interface ActivityCardProps {
  screenshot: string;
  activityLevel: number;
  mouseClicks: number;
  keyboardPresses: number;
  timeRange: string;
  onClick: () => void;
}

interface ActivityCardProps {
  userID: string;
  date: string;
  onClick: () => void;
}

export function ActivityCard({ 
  userID,
  date,
  onClick 
}: ActivityCardProps) {
  const [activityData, setActivityData] = useState<any>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const data = await workDiaryApi.getWorkDiary(userID, date);
        setActivityData(data[0]); // Assuming we want the first entry for this card
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };

    fetchActivityData();
  }, [userID, date]);
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

  const activeSegments = activityData ? getActiveSegments(activityData.activityLevel) : 0;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-xs">
              {activityData?.screenshotTimeStamp?.split(' ')[0] || 'Loading...'}
            </Badge>
            <span className="text-sm font-medium">{activityData?.activityLevel || 0}%</span>
          </div>
          
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img 
              src={activityData?.imageURL || '/placeholder.png'}
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
                      ? getActivityColor(activityData?.activityLevel || 0)
                      : 'bg-gray-200 dark:bg-gray-700'
                  } ${segment <= activeSegments ? 'animate-pulse-activity' : ''}`}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MousePointer className="h-3 w-3" />
                <span>{activityData?.mouseJSON?.clicks || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                <span>{activityData?.keyboardJSON?.presses || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
