// src/components/ui/popover.tsx
import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: React.ReactNode;
}

export function Popover({ children, open: openProp, onOpenChange, trigger }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : isOpen;

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleTriggerClick = () => {
    const newState = !open;
    if (!isControlled) {
      setIsOpen(newState);
    }
    onOpenChange?.(newState);
  };

  return (
    <div className="relative inline-block">
      <div onClick={handleTriggerClick}>
        {trigger}
      </div>
      <dialog
        ref={dialogRef}
        className="fixed p-4 rounded-md border bg-background shadow-lg"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            handleTriggerClick();
          }
        }}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </dialog>
    </div>
  );
}