import React from 'react';
import { MousePointer, Keyboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivityCardProps {
  thumbnail: string;
  timestamp: string;
  mouseClicks: number;
  keyboardClicks: number;
  activeJSON: number[][];
  onClick: () => void;
}

export function ActivityCard({
  thumbnail,
  timestamp,
  mouseClicks,
  keyboardClicks,
  activeJSON,
  onClick,
}: ActivityCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-xs">
              {timestamp.split('T')[0]}
            </Badge>
            <span className="text-sm font-medium">
              {
                Math.min(
                  100,
                  activeJSON.reduce(
                    (acc, [mouse, keyboard, active]) => acc + (active === 1 ? 10 : 0),
                    0
                  )
                )
              }%
            </span>
          </div>

          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={
                thumbnail.startsWith('http')
                  ? thumbnail
                  : `https://vw.aisrv.in/node_backend${thumbnail}`
              }
              alt="Thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/placeholder.png';
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex w-full h-2 rounded overflow-hidden mt-1">
              {activeJSON.map(([mouse, keyboard, active], idx) => (
                <div
                  key={idx}
                  title={`Min ${idx + 1}\nMouse: ${mouse}, Keyboard: ${keyboard}`}
                  className={`flex-1 transition-all ${
                    active === 1
                      ? 'bg-green-500 hover:brightness-110'
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}
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
                <span>{keyboardClicks}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
