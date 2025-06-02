import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
  email: string;
  screenshotInterval: number;
}

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onSelectEmployee: (employee: Employee) => void;
  className?: string;
}

export function EmployeeSelector({ 
  employees, 
  selectedEmployee, 
  onSelectEmployee,
  className 
}: EmployeeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (employee: Employee) => {
    onSelectEmployee(employee);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md cursor-pointer",
          "bg-background hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedEmployee ? selectedEmployee.name : "Select an employee..."}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <div className="p-1">
            {employees.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No employees found
              </div>
            ) : (
              <div className="max-h-60 overflow-auto">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className={cn(
                      "px-2 py-1.5 text-sm rounded-sm cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      selectedEmployee?.id === employee.id && "bg-accent font-medium"
                    )}
                    onClick={() => handleSelect(employee)}
                  >
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-xs text-muted-foreground">{employee.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}