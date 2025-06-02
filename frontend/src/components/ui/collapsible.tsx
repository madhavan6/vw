import React, { useState, ReactNode } from 'react';

interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CollapsibleTriggerProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  'aria-expanded'?: boolean;
}

interface CollapsibleContentProps {
  children: ReactNode;
  className?: string;
}

export function Collapsible({ children, open: openProp, onOpenChange }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : isOpen;

  const toggle = () => {
    const newState = !open;
    if (!isControlled) {
      setIsOpen(newState);
    }
    onOpenChange?.(newState);
  };

  return (
    <div className="w-full">
      {React.Children.map(children, (child) => {
        if (React.isValidElement<CollapsibleTriggerProps>(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child, { 
              onClick: toggle, 
              'aria-expanded': open 
            });
          }
        }
        if (React.isValidElement<CollapsibleContentProps>(child)) {
          if (child.type === CollapsibleContent && !open) {
            return null;
          }
        }
        return child;
      })}
    </div>
  );
}

export function CollapsibleTrigger({ 
  children, 
  className, 
  ...props 
}: CollapsibleTriggerProps) {
  return (
    <button
      type="button"
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function CollapsibleContent({ 
  children, 
  className 
}: CollapsibleContentProps) {
  return <div className={className}>{children}</div>;
}