import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshot: string;
  timeRange: string;
  activityLevel: number;
  mouseClicks: number;
  keyboardPresses: number;
}

export function ScreenshotModal({ 
  isOpen, 
  onClose, 
  screenshot, 
  timeRange, 
  activityLevel, 
  mouseClicks, 
  keyboardPresses 
}: ScreenshotModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl w-[90vw] h-[90vh] p-0 flex flex-col" 
        ref={dialogRef}
      >
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-center">Screenshot - {timeRange}</DialogTitle>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span>Activity: <span className="font-medium">{activityLevel}%</span></span>
            <span>Mouse Clicks: <span className="font-medium">{mouseClicks}</span></span>
            <span>Keyboard Presses: <span className="font-medium">{keyboardPresses}</span></span>
          </div>
        </DialogHeader>
        <div className="flex-1 p-4 flex items-center justify-center bg-muted/50">
          <div className="w-full h-full max-w-full max-h-[calc(90vh-120px)] flex items-center justify-center">
            <img 
              src={screenshot}
              alt="Activity screenshot"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-white"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}