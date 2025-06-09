import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  projectId: string;
  taskId: string;
  screenshotInterval: number;
  displayName: string;
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

  const buttonContent = selectedEmployee ? (
    <div className="flex items-center gap-2">
      <span>{selectedEmployee.displayName}</span>
    </div>
  ) : (
    <span>Select Employee</span>
  );

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-left text-sm rounded-md border bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        {buttonContent}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {employees.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No employees found
            </div>
          ) : (
            <div className="max-h-60 overflow-auto">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => handleSelect(employee)}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted"
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span>{employee.displayName}</span>
                      <span className="block text-sm text-muted-foreground">
                        Project: {employee.projectId}, Task: {employee.taskId}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Interval: {employee.screenshotInterval} min
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}